import { buildDeck, mergeBoards, mergeTasks, readStoredCampuses, storeCampuses, toggleCampus } from './planDeck';

const row = (id, extra = {}) => ({
    unique_id: id, name: id, plan_status: 'In Progress', working_groups: ['Web'], goal_numbers: [7],
    tasks_open: 0, tasks_overdue: 0, ...extra,
});

describe('planDeck', () => {
    beforeEach(() => window.localStorage.clear());

    it('merges the same plan from several boards into one row that remembers its campuses', () => {
        const plans = mergeBoards({
            sfsu: [row('shared'), row('sfsu-only')],
            ssu: [row('shared'), row('ssu-only', { working_groups: ['Procurement'] })],
        }, ['sfsu', 'ssu']);
        const byId = Object.fromEntries(plans.map((p) => [p.unique_id, p]));
        expect(Object.keys(byId).sort()).toEqual(['sfsu-only', 'shared', 'ssu-only']);
        expect(byId.shared.campuses).toEqual(['sfsu', 'ssu']);
        expect(byId['ssu-only'].campuses).toEqual(['ssu']);
        expect(byId['ssu-only'].workingGroup).toBe('procurement');
        expect(byId.shared.goalNumber).toBe(7);
    });

    it('merges tasks by asana gid', () => {
        const tasks = mergeTasks({ sfsu: [{ asana_gid: 'a' }, { asana_gid: 'b' }], ssu: [{ asana_gid: 'a' }] });
        expect(tasks.map((t) => t.asana_gid).sort()).toEqual(['a', 'b']);
    });

    it('builds the deck from the selected campuses, attention first', () => {
        const plans = mergeBoards({
            sfsu: [row('quiet'), row('overdue', { tasks_overdue: 2, tasks_open: 2 }), row('done', { plan_status: 'Completed' })],
            csueb: [row('east', { tasks_open: 1 })],
        }, ['sfsu', 'csueb']);
        expect(buildDeck(plans, { campuses: ['sfsu', 'csueb'] }).map((p) => p.unique_id)).toEqual(['overdue', 'east', 'quiet']);
        expect(buildDeck(plans, { campuses: ['csueb'] }).map((p) => p.unique_id)).toEqual(['east']);
        expect(buildDeck(plans, { campuses: ['sfsu'], wgFilter: 'procurement' })).toEqual([]);
    });

    it('defaults to every campus and never drops the last one', () => {
        const available = [{ abbreviation: 'sfsu' }, { abbreviation: 'ssu' }, { abbreviation: 'csueb' }];
        expect(readStoredCampuses(available)).toEqual(['sfsu', 'ssu', 'csueb']);
        storeCampuses(['ssu', 'gone']);
        expect(readStoredCampuses(available)).toEqual(['ssu']);
        expect(toggleCampus(['ssu'], 'ssu')).toEqual(['ssu']);
        expect(toggleCampus(['ssu'], 'sfsu')).toEqual(['ssu', 'sfsu']);
        expect(toggleCampus(['ssu', 'sfsu'], 'ssu')).toEqual(['sfsu']);
    });
});
