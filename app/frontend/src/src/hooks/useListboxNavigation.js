import { useEffect, useRef, useState } from 'react';

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
 */
export default function useListboxNavigation({ itemCount, selectedIndex = -1, onActivate }) {
    const itemRefs = useRef([]);
    const [focusedIndex, setFocusedIndex] = useState(Math.max(0, selectedIndex));

    // Keep the roving tab stop on the selection when it changes elsewhere (deep
    // link, parent state) and clamp when the list shrinks. Never moves actual
    // focus, so it can't steal focus on load.
    useEffect(() => {
        const target = selectedIndex >= 0 ? selectedIndex : 0;
        setFocusedIndex(Math.max(0, Math.min(target, Math.max(0, itemCount - 1))));
    }, [selectedIndex, itemCount]);

    const focusItem = (i) => {
        const clamped = Math.max(0, Math.min(i, itemCount - 1));
        setFocusedIndex(clamped);
        itemRefs.current[clamped]?.focus();
    };

    const getItemProps = (index) => ({
        ref: (el) => { itemRefs.current[index] = el; },
        tabIndex: index === focusedIndex ? 0 : -1,
        onFocus: () => setFocusedIndex(index),
        onKeyDown: (e) => {
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); focusItem(index + 1); break;
                case 'ArrowUp': e.preventDefault(); focusItem(index - 1); break;
                case 'Home': e.preventDefault(); focusItem(0); break;
                case 'End': e.preventDefault(); focusItem(itemCount - 1); break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (onActivate) onActivate(index);
                    break;
                default: break;
            }
        },
    });

    return { focusedIndex, setFocusedIndex, focusItem, getItemProps };
}
