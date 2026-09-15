import { useEffect } from 'react';

/**
 * Meeting mode's keyboard map. The presenter drives with the keyboard while
 * the room watches; every shortcut is also a visible button.
 *
 *   j / k, ArrowDown / ArrowUp   next / previous plan
 *   n                            focus "Add next step"
 *   m                            focus the notes input
 *   [                            collapse or expand the agenda rail
 *   f                            toggle browser fullscreen
 *   ?                            shortcut help
 *   Escape                       exit meeting mode (or close help when open)
 *
 * Shortcuts are suppressed while focus is in an input, textarea, select or a
 * contenteditable, so typing a note never moves the deck.
 */
export const PRESENT_KEYS = [
    { keys: 'j / k', what: 'Next / previous plan' },
    { keys: 'n', what: 'Add next step' },
    { keys: 'm', what: 'Type a note' },
    { keys: '[', what: 'Collapse or expand the agenda' },
    { keys: 'f', what: 'Fullscreen' },
    { keys: '?', what: 'This list' },
    { keys: 'Esc', what: 'Exit meeting mode' },
];

const isTyping = (target) => {
    if (!target) return false;
    const tag = (target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
};

export default function usePresentKeys(handlers) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
            const typing = isTyping(e.target);
            if (e.key === 'Escape') {
                // Escape leaves an input alone (it may be clearing a field) unless help is open.
                if (typing && !handlers.helpOpen) return;
                e.preventDefault();
                handlers.onEscape?.();
                return;
            }
            if (typing) return;
            switch (e.key) {
                case 'j': case 'ArrowDown': e.preventDefault(); handlers.onNext?.(); break;
                case 'k': case 'ArrowUp': e.preventDefault(); handlers.onPrev?.(); break;
                case 'n': e.preventDefault(); handlers.onAddStep?.(); break;
                case 'm': e.preventDefault(); handlers.onFocusNotes?.(); break;
                case '[': e.preventDefault(); handlers.onToggleRail?.(); break;
                case 'f': e.preventDefault(); handlers.onFullscreen?.(); break;
                case '?': e.preventDefault(); handlers.onHelp?.(); break;
                default: break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handlers]);
}

/** Toggle browser fullscreen on the document; resolves false when unavailable. */
export async function toggleFullscreen() {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return true;
        }
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            return true;
        }
    } catch (e) {
        // Fall through: the browser refused (no user gesture, or an iframe).
    }
    return false;
}
