import { DEFAULT_SCALE, SCALE_STEPS, ps, readStoredScale, stepScale, storeScale } from './presentScale';

describe('presentScale', () => {
    beforeEach(() => window.localStorage.clear());

    it('never lets text drop under 13px', () => {
        expect(ps(0.75)).toBe('max(13px, calc(0.75rem * var(--present-scale, 1)))');
    });

    it('steps through the scale and clamps at both ends', () => {
        expect(stepScale(1, 1)).toBe(1.25);
        expect(stepScale(1.25, 1)).toBe(1.4);
        expect(stepScale(1.4, 1)).toBe(1.4);
        expect(stepScale(1, -1)).toBe(1);
        // An unknown current value steps from the default.
        expect(stepScale(2, -1)).toBe(SCALE_STEPS[SCALE_STEPS.indexOf(DEFAULT_SCALE) - 1]);
    });

    it('remembers a valid scale and ignores junk', () => {
        storeScale(1.4);
        expect(readStoredScale()).toBe(1.4);
        window.localStorage.setItem('ati.present.scale', '7');
        expect(readStoredScale()).toBe(DEFAULT_SCALE);
    });
});
