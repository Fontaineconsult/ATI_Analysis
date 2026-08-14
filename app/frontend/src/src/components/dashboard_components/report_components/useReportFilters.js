import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    COMMUNITY_PARAM,
    FILTER_PARAM,
    SEARCH_PARAM,
    STATUS_PARAM,
    TREND_PARAM,
    TREND_KEYS,
    parseFilterParam,
    serializeFilterParam,
} from './reportFilters';

/**
 * Report filter state, held in the URL rather than in component state.
 *
 * The URL is the only place this can live if a filtered report is to be shareable —
 * "here are the 12 indicators still missing implementations" has to survive being
 * pasted into an email, and component state does not. Four facets on the existing
 * /dashboard/reports route:
 *
 *   ?attention=ready-for-review   the diagnostic tiles
 *   ?status=Defined,Established   maturity buckets
 *   ?trend=declining              year-over-year direction
 *   ?community=Library,Procurement  communities of practice holding a stake
 *   ?q=captioning                 free text over description + composite key
 *
 * Changes PUSH a history entry so Back undoes one step, EXCEPT the search box, which
 * replaces — a pushed entry per keystroke would bury the page in history and make Back
 * useless for anything else.
 *
 * The hash is preserved explicitly: setSearchParams navigates search-only and drops it,
 * which would kill the `#1.1-web` row deep links this page already supports.
 */

// Generic comma-list param, validated against an allowed set. Same forgiving contract
// as the attention param: unknown tokens are dropped, never fatal.
function parseList(raw, allowed) {
    if (!raw) return [];
    const seen = new Set(String(raw).split(',').map((t) => t.trim()).filter(Boolean));
    return allowed.filter((v) => seen.has(v));
}

function serializeList(values, allowed) {
    const seen = new Set(values || []);
    return allowed.filter((v) => seen.has(v)).join(',');
}

export function useReportFilters({ statusOrder = [], communityNames = [] } = {}) {
    const navigate = useNavigate();
    const location = useLocation();

    // Status values are the maturity level names themselves, so the allowed set is the
    // caller's status order plus the off-ladder bucket.
    const statusAllowed = useMemo(() => [...statusOrder, 'No evidence'], [statusOrder]);
    // Community names come from the loaded data, not a fixed vocabulary — a community
    // renamed or removed since a link was shared simply drops out of the filter.
    const communityAllowed = useMemo(() => [...communityNames], [communityNames]);

    const state = useMemo(() => {
        const p = new URLSearchParams(location.search);
        return {
            attention: parseFilterParam(p.get(FILTER_PARAM)),
            status: parseList(p.get(STATUS_PARAM), statusAllowed),
            trend: parseList(p.get(TREND_PARAM), TREND_KEYS),
            community: parseList(p.get(COMMUNITY_PARAM), communityAllowed),
            q: p.get(SEARCH_PARAM) || '',
        };
    }, [location.search, statusAllowed, communityAllowed]);

    const write = useCallback((mutate, { replace = false } = {}) => {
        // Copy rather than mutate: other params on the URL are none of our business.
        const next = new URLSearchParams(location.search);
        mutate(next);
        const qs = next.toString();
        navigate(
            { pathname: location.pathname, search: qs ? `?${qs}` : '', hash: location.hash },
            { replace },
        );
    }, [navigate, location.pathname, location.search, location.hash]);

    const setParam = useCallback((key, value, opts) => {
        write((p) => { if (value) p.set(key, value); else p.delete(key); }, opts);
    }, [write]);

    const setAttention = useCallback(
        (keys) => setParam(FILTER_PARAM, serializeFilterParam(keys)),
        [setParam],
    );
    const setStatus = useCallback(
        (values) => setParam(STATUS_PARAM, serializeList(values, statusAllowed)),
        [setParam, statusAllowed],
    );
    const setTrend = useCallback(
        (values) => setParam(TREND_PARAM, serializeList(values, TREND_KEYS)),
        [setParam],
    );
    const setCommunity = useCallback(
        (values) => setParam(COMMUNITY_PARAM, serializeList(values, communityAllowed)),
        [setParam, communityAllowed],
    );
    // Replace, not push: one history entry per keystroke would make Back unusable.
    const setSearch = useCallback(
        (q) => setParam(SEARCH_PARAM, (q || '').trim(), { replace: true }),
        [setParam],
    );

    const toggleIn = (values, value) =>
        (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

    const toggleAttention = useCallback(
        (key) => setAttention(toggleIn(state.attention, key)),
        [state.attention, setAttention],
    );
    const toggleStatus = useCallback(
        (value) => setStatus(toggleIn(state.status, value)),
        [state.status, setStatus],
    );
    const toggleTrend = useCallback(
        (value) => setTrend(toggleIn(state.trend, value)),
        [state.trend, setTrend],
    );
    const toggleCommunity = useCallback(
        (value) => setCommunity(toggleIn(state.community, value)),
        [state.community, setCommunity],
    );

    const clear = useCallback(() => {
        write((p) => {
            [FILTER_PARAM, STATUS_PARAM, TREND_PARAM, COMMUNITY_PARAM, SEARCH_PARAM]
                .forEach((k) => p.delete(k));
        });
    }, [write]);

    const isActive = useCallback((key) => state.attention.includes(key), [state.attention]);

    return {
        state,
        // Back-compat alias: the attention tiles were the first consumer.
        active: state.attention,
        isActive,
        toggle: toggleAttention,
        toggleAttention,
        toggleStatus,
        toggleTrend,
        toggleCommunity,
        setSearch,
        setAttention,
        setStatus,
        setTrend,
        setCommunity,
        clear,
    };
}

export default useReportFilters;
