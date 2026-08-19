/**
 * Plan lifecycle status — the frontend mirror of `plan_statuses` in
 * app/data_config.py, which is the source of truth.
 *
 * Defined once here and derived everywhere, the same way working groups are handled
 * in styles/workingGroupIdentity.js. A form that hardcodes its own option list is how
 * the Annotations-tab Plan editor came to offer "Complete" while the write path only
 * accepted "Completed" — every save at that status 500'd, and because the caller
 * swallowed the error the form just closed as though it had worked.
 *
 * Keep in step with app/data_config.py:plan_statuses.
 */

export const PLAN_STATUSES = [
    'Not Started',
    'In Progress',
    'Completed',
    'On Hold',
    'Abandoned',
];

export const DEFAULT_PLAN_STATUS = 'Not Started';

/** Display order for grouped/sorted views — active work first, terminal states last. */
export const PLAN_STATUS_DISPLAY_ORDER = [
    'In Progress',
    'Not Started',
    'On Hold',
    'Completed',
    'Abandoned',
];

export function isValidPlanStatus(status) {
    return PLAN_STATUSES.includes(status);
}
