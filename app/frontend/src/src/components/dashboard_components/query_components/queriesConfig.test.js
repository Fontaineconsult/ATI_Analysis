import {
    summarizeQueries, getStatusMeta, getCategoryMeta, vocabToOptions,
} from './queriesConfig';

describe('queriesConfig', () => {
    it('summarizeQueries counts by status', () => {
        const s = summarizeQueries([
            { status: 'open' }, { status: 'open' }, { status: 'in_progress' }, { status: 'settled' },
        ]);
        expect(s).toEqual({ total: 4, open: 2, in_progress: 1, settled: 1 });
    });

    it('summarizeQueries handles empty and unknown statuses', () => {
        expect(summarizeQueries()).toEqual({ total: 0, open: 0, in_progress: 0, settled: 0 });
        const s = summarizeQueries([{ status: 'weird' }]);
        expect(s.total).toBe(1);
        expect(s.open).toBe(0);
    });

    it('getStatusMeta returns a colorScheme and falls back for unknown values', () => {
        expect(getStatusMeta('settled').colorScheme).toBe('green');
        expect(getStatusMeta('???')).toEqual({ label: '???', colorScheme: 'gray' });
    });

    it('getCategoryMeta returns the label and falls back', () => {
        expect(getCategoryMeta('policy_decision').label).toBe('Policy Decision');
        expect(getCategoryMeta(null).label).toBe('Uncategorized');
    });

    it('vocabToOptions prefers the vocab dict, falls back to meta, else empty', () => {
        expect(vocabToOptions({ a: 'Apple', b: 'Banana' })).toEqual([
            { value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana' },
        ]);
        expect(vocabToOptions(null, { open: { label: 'Open' } })).toEqual([
            { value: 'open', label: 'Open' },
        ]);
        expect(vocabToOptions(undefined, null)).toEqual([]);
    });
});
