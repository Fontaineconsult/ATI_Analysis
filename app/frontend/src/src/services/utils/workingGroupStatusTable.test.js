/**
 * Unit tests for the three-column working-group table builder (pure): SI, Name,
 * Status and nothing else.
 */
import { buildWorkingGroupStatusTable, collectStatusRows } from './workingGroupStatusTable';

const DATA = {
    web: {
        goals: [
            {
                goal: { properties: { goal_number: 2 } },
                indicators: [{
                    indicator: { properties: { composite_key: '2.1-web', success_indicator: 'Audit <vendor> pages.' } },
                    evidences: [{ statusLevel: { properties: { status_level: 'Initiated' } } }],
                }],
            },
            {
                goal: { properties: { goal_number: 1 } },
                indicators: [
                    {
                        indicator: { properties: { composite_key: '1.10-web', success_indicator: 'Tenth.' } },
                        evidences: [{ statusLevel: { properties: { status_level: 'Managed' } } }],
                    },
                    {
                        indicator: { properties: { composite_key: '1.2-web', success_indicator: 'Second.' } },
                        evidences: [],
                    },
                ],
            },
        ],
    },
    procurement: {
        goals: [{
            goal: { properties: { goal_number: 3 } },
            indicators: [{
                indicator: { properties: { composite_key: '3.1-pro', success_indicator: 'Procurement row.' } },
                evidences: [],
            }],
        }],
    },
};

describe('collectStatusRows', () => {
    it('flattens one working group in numeric goal.indicator order', () => {
        expect(collectStatusRows(DATA, 'web').map((r) => r.ck)).toEqual(['1.2-web', '1.10-web', '2.1-web']);
    });

    it('falls back to Not Started when the YSE has no status', () => {
        const row = collectStatusRows(DATA, 'web').find((r) => r.ck === '1.2-web');
        expect(row.status).toBe('Not Started');
    });

    it('returns nothing for an unknown group', () => {
        expect(collectStatusRows(DATA, 'nope')).toEqual([]);
    });
});

describe('buildWorkingGroupStatusTable', () => {
    const out = buildWorkingGroupStatusTable(DATA, { workingGroup: 'web', campus: 'ssu', year: '2026-2027' });

    it('renders exactly the SI, Name and Status columns', () => {
        expect(out.html).toContain('>SI</th>');
        expect(out.html).toContain('>Name</th>');
        expect(out.html).toContain('>Status</th>');
        expect(out.html).not.toContain('Implementations');
        expect(out.html).not.toContain('Notes');
        expect(out.html).not.toContain('<a ');
        expect(out.rowCount).toBe(3);
        expect(out.name).toBe('Web');
    });

    it('keeps other working groups out', () => {
        expect(out.html).not.toContain('3.1-pro');
        expect(out.plainText).not.toContain('Procurement row.');
    });

    it('escapes interpolated content and carries the heading', () => {
        expect(out.html).toContain('Audit &lt;vendor&gt; pages.');
        expect(out.html).toContain('Web Success Indicators &mdash; SSU &middot; 2026-2027');
    });

    it('writes a tab-separated plain-text fallback', () => {
        expect(out.plainText).toContain('SI\tName\tStatus');
        expect(out.plainText).toContain('1.10-web\tTenth.\tManaged');
    });

    it('reports an empty group without throwing', () => {
        const empty = buildWorkingGroupStatusTable({ web: { goals: [] } }, { workingGroup: 'web' });
        expect(empty.rowCount).toBe(0);
        expect(empty.html).toContain('No success indicators');
    });
});
