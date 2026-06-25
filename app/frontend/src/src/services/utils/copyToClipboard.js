// Robust rich-content clipboard copy (HTML + plain-text) for "paste into an email"
// flows. Three-tier fallback so it keeps formatting where it can and still copies
// something everywhere:
//   1) Clipboard API `write` with a ClipboardItem carrying BOTH text/html and
//      text/plain — the path that preserves the table/links for Outlook & Gmail.
//   2) Legacy `execCommand('copy')` over a hidden contenteditable (older browsers
//      / non-secure contexts that still allow rich copy).
//   3) Plain-text `writeText` (or a textarea + execCommand) as the last resort.
//
// Returns the format actually used: 'html' | 'html-legacy' | 'text' | 'text-legacy'.
// Throws if every method fails. The CALLER owns the toast (this stays UI-free).

function tryClipboardApiWrite(html, plainText) {
    if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem === 'undefined') {
        return Promise.resolve(null);
    }
    const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });
    return navigator.clipboard.write([item]).then(() => 'html');
}

function tryExecCommandRich(html, plainText) {
    // Rich copy via a hidden contenteditable selection.
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.setAttribute('style', 'position:fixed;left:-9999px;top:0;');
    div.innerHTML = html;
    document.body.appendChild(div);
    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    sel.removeAllRanges();
    document.body.removeChild(div);
    if (ok) return 'html-legacy';

    // Plain-text fallback via a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = plainText;
    ta.setAttribute('style', 'position:fixed;left:-9999px;top:0;');
    document.body.appendChild(ta);
    ta.select();
    let ok2 = false;
    try { ok2 = document.execCommand('copy'); } catch (e) { ok2 = false; }
    document.body.removeChild(ta);
    return ok2 ? 'text-legacy' : null;
}

export async function copyRichContent({ html, plainText }) {
    // 1) Modern Clipboard API — only in a secure context (HTTPS / localhost).
    if (window.isSecureContext) {
        try {
            const fmt = await tryClipboardApiWrite(html, plainText);
            if (fmt) return fmt;
        } catch (e) {
            // fall through to the legacy path
        }
    }
    // 2) Legacy rich copy.
    const legacy = tryExecCommandRich(html, plainText);
    if (legacy) return legacy;
    // 3) Plain-text Clipboard API as the final resort.
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
        return 'text';
    }
    throw new Error('Clipboard not available');
}

export default copyRichContent;
