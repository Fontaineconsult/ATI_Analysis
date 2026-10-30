import { buildEvidenceDeck, parseCompositeKey, statusCounts, stepSlide } from './evidenceDeck';

const ind = (key, status) => ({ indicator: { properties: { composite_key: key } }, status });
const summarize = (w) => ({ statusLevel: w.status });

const tree = {
    goals: [
        { goal: { properties: { goal_number: 7, name: 'Seven' } }, indicators: [ind('7.11-ins', 'Defined'), ind('7.2-ins', 'Initiated')] },
        { goal: { properties: { goal_number: 6, name: 'Six' } }, indicators: [ind('6.2-ins', 'Initiated')] },
        { goal: { properties: { goal_number: 5, name: 'Empty' } }, indicators: [] },
    ],
};

describe('evidenceDeck', () => {
    it('parses composite keys', () => {
        expect(parseCompositeKey('6.12-ins')).toEqual({ goal: 6, indicator: 12 });
        expect(parseCompositeKey('nope')).toBeNull();
    });

    it('orders goals then indicators numerically and drops empty goals', () => {
        const { sections, slides } = buildEvidenceDeck(tree, summarize);
        expect(sections.map((s) => s.goalNumber)).toEqual([6, 7]);
        expect(slides.map((s) => s.key)).toEqual(['6.2-ins', '7.2-ins', '7.11-ins']);
        expect(slides[2]).toMatchObject({ goalNumber: 7, indicatorNumber: 11 });
    });

    it('returns an empty deck for a missing tree', () => {
        expect(buildEvidenceDeck(undefined, summarize)).toEqual({ sections: [], slides: [] });
    });

    it('counts statuses in rubric order', () => {
        const { slides } = buildEvidenceDeck(tree, summarize);
        expect(statusCounts(slides, ['Initiated', 'Defined'])).toEqual([
            { level: 'Initiated', count: 2 }, { level: 'Defined', count: 1 },
        ]);
    });

    it('steps and clamps', () => {
        const { slides } = buildEvidenceDeck(tree, summarize);
        expect(stepSlide(slides, '6.2-ins', 1).key).toBe('7.2-ins');
        expect(stepSlide(slides, '7.11-ins', 1).key).toBe('7.11-ins');
        expect(stepSlide(slides, '6.2-ins', -1).key).toBe('6.2-ins');
        expect(stepSlide(slides, 'missing', 1).key).toBe('6.2-ins');
        expect(stepSlide([], 'x', 1)).toBeNull();
    });
});
