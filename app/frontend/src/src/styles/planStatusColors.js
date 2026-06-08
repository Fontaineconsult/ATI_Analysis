/**
 * Maps a Plan's status string (and the `abandoned` flag) to a palette token.
 * Centralized so any UI rendering plan status reads from one place.
 *
 * Returns the semantic palette entry {solid, bg, fg}. Pass either:
 *   getPlanStatusColor('In Progress')
 *   getPlanStatusColor(plan)   // accepts the whole plan object
 *
 * The `abandoned` flag is authoritative — a plan with `abandoned: true`
 * always returns the Abandoned color, even if `plan_status` says otherwise.
 */
import { palette } from './palette';

const PLAN_STATUS_TO_TOKEN = {
    'Not Started': palette.semantic.statusNotStarted,
    'In Progress': palette.semantic.statusInProgress,
    'Completed':   palette.semantic.statusCompleted,
    'On Hold':     palette.semantic.statusOnHold,
    'Abandoned':   palette.semantic.statusAbandoned,
};

export function getPlanStatusColor(planOrStatus) {
    if (planOrStatus && typeof planOrStatus === 'object') {
        if (planOrStatus.abandoned === true) {
            return palette.semantic.statusAbandoned;
        }
        return PLAN_STATUS_TO_TOKEN[planOrStatus.plan_status] || palette.semantic.statusNotStarted;
    }
    return PLAN_STATUS_TO_TOKEN[planOrStatus] || palette.semantic.statusNotStarted;
}

export function getPlanStatusLabel(plan) {
    if (plan?.abandoned === true) return 'Abandoned';
    return plan?.plan_status || 'Not Started';
}

// The Chakra `colorScheme` name for a plan status — for components that render a
// plain <Badge colorScheme=...> rather than a token-based pill. Centralized so the
// mapping is never re-derived inline. (For pills, prefer getPlanStatusColor tokens.)
const PLAN_STATUS_TO_SCHEME = {
    'Not Started': 'gray',
    'In Progress': 'blue',
    'Completed':   'green',
    'On Hold':     'orange',
    'Abandoned':   'red',
};

export function getPlanStatusColorScheme(planOrStatus) {
    if (planOrStatus && typeof planOrStatus === 'object') {
        if (planOrStatus.abandoned === true) return 'red';
        return PLAN_STATUS_TO_SCHEME[planOrStatus.plan_status] || 'gray';
    }
    return PLAN_STATUS_TO_SCHEME[planOrStatus] || 'gray';
}
