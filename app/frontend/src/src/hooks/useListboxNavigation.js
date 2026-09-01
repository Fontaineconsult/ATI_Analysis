import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Roving-tabindex keyboard contract for ARIA listboxes (APG: Listbox pattern,
 * design-sense §6.1). Extracted from SuccessIndicatorList — the reference
 * implementation — so every selectable list keeps the same contract:
 *
 *  - the list is ONE tab stop (the selected option, else the first),
 *  - ArrowUp/ArrowDown move focus, Home/End jump to the ends,
 *  - Enter/Space activate (select) the focused option,
 *  - moving focus does NOT select, so arrowing doesn't thrash the detail panel.
 *
 * Usage:
 *   const { getItemProps } = useListboxNavigation({
 *       itemCount: items.length,
 *       selectedIndex,                  // -1 when nothing selected
 *       onActivate: (i) => onSelect(items[i]),
 *   });
 *   …
 *   <List role="listbox" aria-label="…">
 *     {items.map((item, i) => (
 *       <ListItem role="option" aria-selected={…} {...getItemProps(i)} onClick={…} />
 *     ))}
 *   </List>
 *
 * Spread getItemProps(i) BEFORE any props you need to override. Rows keep their
 * own onClick for mouse selection (click also moves the roving tab stop via
 * onFocus, which fires on mouse down).
 *
 * FOR LONG LISTS, use `itemHandlers` instead of getItemProps. getItemProps
 * builds a fresh ref callback and fresh handlers on every render, which is fine
 * for a list of twenty and expensive for a list of four hundred: a new ref
 * callback makes React detach and reattach every row's ref on every render, and
 * new handler identities defeat React.memo on the row. `itemHandlers` returns
 * the same three functions for the life of the list, so a memoized row can take
 * `index`, `isFocused` and these, and re-render only when its OWN state changes:
 *
 *   const { focusedIndex, itemHandlers } = useListboxNavigation({...});
 *   <Row index={i} isFocused={i === focusedIndex} handlers={itemHandlers} … />
 *
 * Both APIs drive the same state, so a list can move over one row type at a
 * time.
 */
export default function useListboxNavigation({ itemCount, selectedIndex = -1, onActivate }) {
    const itemRefs = useRef([]);
    const [focusedIndex, setFocusedIndex] = useState(Math.max(0, selectedIndex));

    // Held in refs so the stable handlers below never need them as dependencies.
    // Callers pass an inline onActivate; without this it would change identity
    // every render and take the handlers — and any memoized row — with it.
    const itemCountRef = useRef(itemCount);
    itemCountRef.current = itemCount;
    const onActivateRef = useRef(onActivate);
    onActivateRef.current = onActivate;

    // Keep the roving tab stop on the selection when it changes elsewhere (deep
    // link, parent state) and clamp when the list shrinks. Never moves actual
    // focus, so it can't steal focus on load.
    useEffect(() => {
        const target = selectedIndex >= 0 ? selectedIndex : 0;
        setFocusedIndex(Math.max(0, Math.min(target, Math.max(0, itemCount - 1))));
    }, [selectedIndex, itemCount]);

    const focusItem = useCallback((i) => {
        const clamped = Math.max(0, Math.min(i, itemCountRef.current - 1));
        setFocusedIndex(clamped);
        itemRefs.current[clamped]?.focus();
    }, []);

    // --- Stable API, for lists long enough that per-render identities cost. ---

    const registerItem = useCallback((index, el) => {
        itemRefs.current[index] = el;
    }, []);

    const onItemFocus = useCallback((index) => setFocusedIndex(index), []);

    const onItemKeyDown = useCallback((index, e) => {
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); focusItem(index + 1); break;
            case 'ArrowUp': e.preventDefault(); focusItem(index - 1); break;
            case 'Home': e.preventDefault(); focusItem(0); break;
            case 'End': e.preventDefault(); focusItem(itemCountRef.current - 1); break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (onActivateRef.current) onActivateRef.current(index);
                break;
            default: break;
        }
    }, [focusItem]);

    const itemHandlers = useRef({ registerItem, onItemFocus, onItemKeyDown }).current;

    // The original per-render API, unchanged, for the six lists short enough
    // that it costs nothing.
    const getItemProps = (index) => ({
        ref: (el) => { registerItem(index, el); },
        tabIndex: index === focusedIndex ? 0 : -1,
        onFocus: () => onItemFocus(index),
        onKeyDown: (e) => onItemKeyDown(index, e),
    });

    return { focusedIndex, setFocusedIndex, focusItem, getItemProps, itemHandlers };
}
