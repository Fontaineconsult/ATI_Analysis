import { buildWorkingGroupPlanReport } from './workingGroupPlanReport';

const input = {
    workingGroup: 'Instructional Materials',
    planIdentifier: '2025-2026-ssu-ins',
    campusName: 'Sonoma State',
    leads: [{ name: 'Tim Hensel', title: 'Accessibility Specialist' }],
    members: [{ name: 'Kyle Falbo', title: 'Educational Technology Application Expert' }],
    indicators: [{
        composite_key: '6.8-ins',
        success_indicator: 'Develop a process to prioritize and remediate inaccessible course content.',
        previous_status_level: 'Defined',
        status_level: 'Established',
        companion_plans: [
            { name: 'SSU: Provision a shared network drive', plan_status: 'Not Started', abandoned: false },
            { name: 'SSU: Old plan', plan_status: 'Abandoned', abandoned: true },
        ],
    }],
    communities: [
        { name: 'Academic Technology', members: [{ name: 'Kyle Falbo' }], stakes: [{ composite_key: '6.7-ins' }, { composite_key: '6.8-ins' }] },
        { name: 'Faculty Affairs', members: [], stakes: [{ composite_key: '7.1-ins' }] },
    ],
};

describe('buildWorkingGroupPlanReport', () => {
    it('builds the group title, people, indicators and communities into the HTML', () => {
        const { html, rowCount } = buildWorkingGroupPlanReport(input);
        expect(html).toContain('Instructional Materials · Sonoma State');
        expect(html).toContain('2025-2026-ssu-ins');
        expect(html).toContain('Leads &amp; members (2)');
        expect(html).toContain('Tim Hensel');
        expect(html).toContain('Defined → Established');
        expect(html).toContain('SSU: Provision a shared network drive (Not Started)');
        expect(html).not.toContain('SSU: Old plan');
        expect(html).toContain('6.7-ins, 6.8-ins');
        expect(html).toContain('Nobody at this campus');
        expect(rowCount).toBe(5);
    });

    it('escapes interpolated content', () => {
        const { html } = buildWorkingGroupPlanReport({ ...input, leads: [{ name: '<b>x</b>' }] });
        expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
        expect(html).not.toContain('<b>x</b>');
    });

    it('produces a plain-text fallback with every section', () => {
        const { plainText } = buildWorkingGroupPlanReport(input);
        expect(plainText).toContain('LEADS & MEMBERS (2)');
        expect(plainText).toContain('  - Kyle Falbo (Member): Educational Technology Application Expert');
        expect(plainText).toContain('PRIORITIZED INDICATORS (1)');
        expect(plainText).toContain('      Plans: SSU: Provision a shared network drive (Not Started)');
        expect(plainText).toContain('  - Faculty Affairs: Nobody at this campus | Stakes: 7.1-ins');
    });

    it('reports zero rows for an empty card', () => {
        expect(buildWorkingGroupPlanReport({ workingGroup: 'Steering' }).rowCount).toBe(0);
    });
});
