import './reviewWash.css';

/**
 * Review-state wash classes — the JS face of styles/reviewWash.css.
 *
 * Returns the className string for a subtle edge gradient signaling review
 * state (green approved wins over yellow ready; no state -> no classes).
 *
 *   placement  'right'  — tint enters from the right edge (list selectors)
 *              'bottom' — tint rises from the bottom edge (heading areas)
 *   state      any object with `approved` / `readyForReview` booleans
 *              (getIndicatorSummary output qualifies)
 *
 * Depth defaults live in the CSS (right 15%, bottom 5%); override per element
 * with style={{ '--review-wash-depth': '20%' }}. Chakra callers must set the
 * element's own color via bgColor, not bg — the bg shorthand resets the
 * wash's background-image.
 */
export function reviewWashClass(placement, { approved, readyForReview } = {}) {
    if (placement !== 'right' && placement !== 'bottom') return '';
    const state = approved ? 'approved' : readyForReview ? 'ready' : null;
    if (!state) return '';
    return `review-wash-${placement} review-wash--${state}`;
}
