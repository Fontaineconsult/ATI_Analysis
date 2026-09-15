/**
 * The plans deck across campuses: pure helpers, no React.
 *
 * The board read is per campus. A plan that furthers evidence at several
 * campuses (the SFBRN-wide plans do) comes back on each of those boards as
 * the same node, so merging is by unique_id and the plan remembers which
 * campuses' boards it sat on. Task rollups are identical on every copy
 * (they are properties of the plan's own subtasks), so the first copy's
 * counts are kept.
 */
import { WORKING_GROUP_LIST } from '../../../../styles/workingGroupIdentity';
import { attentionRank } from '../../../PlansAndAccomplishments/PlansList';

const WG_NAME_TO_SLUG = Object.fromEntries(WORKING_GROUP_LIST.map((w) => [w.name, w.slug]));

export const CAMPUSES_STORAGE_KEY = 'ati.present.campuses';

/** boardsByCampus: { sfsu: [planRow, ...], ssu: [...] } -> merged plan rows with `campuses`. */
export function mergeBoards(boardsByCampus, campusOrder = []) {
    const order = campusOrder.length ? campusOrder : Object.keys(boardsByCampus);
    const byId = new Map();
    order.forEach((abbrev) => {
        (boardsByCampus[abbrev] || []).forEach((p) => {
            const existing = byId.get(p.unique_id);
            if (existing) {
                if (!existing.campuses.includes(abbrev)) existing.campuses.push(abbrev);
                return;
            }
            byId.set(p.unique_id, {
                ...p,
                workingGroup: WG_NAME_TO_SLUG[p.working_groups?.[0]] || p.working_groups?.[0] || null,
                goalNumber: p.goal_numbers?.[0] ?? null,
                campuses: [abbrev],
            });
        });
    });
    return [...byId.values()];
}

/** tasksByCampus: { sfsu: [taskRow, ...] } -> one row per asana_gid. */
export function mergeTasks(tasksByCampus) {
    const byGid = new Map();
    Object.values(tasksByCampus).forEach((rows) => {
        (rows || []).forEach((t) => { if (!byGid.has(t.asana_gid)) byGid.set(t.asana_gid, t); });
    });
    return [...byGid.values()];
}

/** The deck: in progress, at a selected campus, in the working-group filter, attention-first. */
export function buildDeck(plans, { campuses, wgFilter = 'all' }) {
    const wanted = new Set(campuses || []);
    return plans
        .filter((p) => !p.abandoned && (p.plan_status || 'Not Started') === 'In Progress')
        .filter((p) => wanted.size === 0 || (p.campuses || []).some((c) => wanted.has(c)))
        .filter((p) => wgFilter === 'all' || p.workingGroup === wgFilter)
        .sort((a, b) => (attentionRank(b) - attentionRank(a)) || (a.name || '').localeCompare(b.name || ''));
}

/** Remembered campus selection, validated against the campuses that exist; default all. */
export function readStoredCampuses(available) {
    const all = (available || []).map((c) => c.abbreviation);
    try {
        const raw = window.localStorage.getItem(CAMPUSES_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const kept = parsed.filter((a) => all.includes(a));
            if (kept.length > 0) return kept;
        }
    } catch (e) {
        // Fall through to the default.
    }
    return all;
}

export function storeCampuses(selection) {
    try {
        window.localStorage.setItem(CAMPUSES_STORAGE_KEY, JSON.stringify(selection));
    } catch (e) {
        // Storage unavailable; the selection still holds for the session.
    }
}

/** Toggle one campus, never below one selected. */
export function toggleCampus(selection, abbrev) {
    if (selection.includes(abbrev)) {
        return selection.length > 1 ? selection.filter((a) => a !== abbrev) : selection;
    }
    return [...selection, abbrev];
}
