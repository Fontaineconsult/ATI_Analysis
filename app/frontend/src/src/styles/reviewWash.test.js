import { reviewWashClass } from './reviewWash';

describe('reviewWashClass', () => {
    it('yields the yellow ready wash for ready-but-unapproved state', () => {
        expect(reviewWashClass('right', { approved: false, readyForReview: true }))
            .toBe('review-wash-right review-wash--ready');
        expect(reviewWashClass('bottom', { readyForReview: true }))
            .toBe('review-wash-bottom review-wash--ready');
    });

    it('approved wins over ready (green wash)', () => {
        expect(reviewWashClass('right', { approved: true, readyForReview: true }))
            .toBe('review-wash-right review-wash--approved');
    });

    it('yields nothing for no review state', () => {
        expect(reviewWashClass('right', { approved: false, readyForReview: false })).toBe('');
        expect(reviewWashClass('bottom', {})).toBe('');
        expect(reviewWashClass('bottom')).toBe('');
    });

    it('rejects unknown placements', () => {
        expect(reviewWashClass('top', { approved: true })).toBe('');
        expect(reviewWashClass(undefined, { approved: true })).toBe('');
    });
});
