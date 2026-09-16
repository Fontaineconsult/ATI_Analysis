/**
 * The presentation type scale.
 *
 * A shared screen arrives at the remote end downsampled, so the desk sizes
 * (14 px body, 10 px chips) do not survive. Meeting mode sets one CSS variable,
 * --present-scale, at its root and every text size in the shell is a multiple
 * of it. Nothing renders under 13 px at any scale.
 *
 *   ps(0.9)  at 1.25  ->  18 px   body
 *   ps(0.75) at 1.25  ->  15 px   meta
 *   ps(1.5)  at 1.25  ->  30 px   plan title
 */
export const SCALE_STEPS = [1, 1.25, 1.4];
export const DEFAULT_SCALE = 1.25;
export const SCALE_STORAGE_KEY = 'ati.present.scale';

export const ps = (rem) => `max(13px, calc(${rem}rem * var(--present-scale, 1)))`;

export const T = {
    title: ps(1.5),
    heading: ps(1.1),
    body: ps(0.9),
    meta: ps(0.75),
    section: ps(0.7),
    big: ps(2),
};

export function readStoredScale() {
    try {
        const raw = window.localStorage.getItem(SCALE_STORAGE_KEY);
        const n = raw == null ? NaN : Number(raw);
        return SCALE_STEPS.includes(n) ? n : DEFAULT_SCALE;
    } catch (e) {
        return DEFAULT_SCALE;
    }
}

export function storeScale(scale) {
    try {
        window.localStorage.setItem(SCALE_STORAGE_KEY, String(scale));
    } catch (e) {
        // Storage can be unavailable (private window); the scale still applies for the session.
    }
}

/** The next step up or down, clamped to the ends of SCALE_STEPS. */
export function stepScale(current, direction) {
    const i = SCALE_STEPS.indexOf(current);
    const next = (i === -1 ? SCALE_STEPS.indexOf(DEFAULT_SCALE) : i) + direction;
    return SCALE_STEPS[Math.max(0, Math.min(SCALE_STEPS.length - 1, next))];
}
