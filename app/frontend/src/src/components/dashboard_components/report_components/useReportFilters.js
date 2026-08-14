import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FILTER_PARAM, parseFilterParam, serializeFilterParam } from './reportFilters';

/**
 * Attention-filter state, held in the URL rather than in component state.
 *
 * The URL is the only place this can live if a filtered report is to be shareable —
 * "here are the 12 indicators still missing implementations" has to survive being
 * pasted into an email, and component state does not. `?attention=ready-for-review`
 * on the existing /dashboard/reports route is enough; no new route is needed.
 *
 * Changes PUSH a history entry, so Back undoes one filter at a time. Filters are the
 * kind of state people expect Back to reverse, and a replace would silently strand
 * them on a narrowed report with no way to step out of it.
 *
 * The hash is untouched — `#1.1-web` row deep links keep working alongside a filter,
 * so `?attention=unassigned#1.1-web` is a valid, shareable "this row, in this view".
 */
export function useReportFilters() {
    const navigate = useNavigate();
    const location = useLocation();

    // Unknown tokens are dropped by the parser, so a stale link degrades to the
    // filters it still understands instead of rendering nothing.
    const active = useMemo(
        () => parseFilterParam(new URLSearchParams(location.search).get(FILTER_PARAM)),
        [location.search],
    );

    // navigate() with an explicit location rather than setSearchParams: the latter
    // navigates search-only, which DROPS the hash — and the hash is how a row deep
    // link (`#1.1-web`) is addressed. Filtering a report must not throw away the row
    // someone linked to.
    const setActive = useCallback((keys) => {
        // Copy rather than mutate: other params on the URL are none of our business.
        const next = new URLSearchParams(location.search);
        const value = serializeFilterParam(keys);
        if (value) next.set(FILTER_PARAM, value);
        else next.delete(FILTER_PARAM);
        const qs = next.toString();
        navigate({
            pathname: location.pathname,
            search: qs ? `?${qs}` : '',
            hash: location.hash,
        });
    }, [navigate, location.pathname, location.search, location.hash]);

    const toggle = useCallback((key) => {
        setActive(active.includes(key) ? active.filter((k) => k !== key) : [...active, key]);
    }, [active, setActive]);

    const clear = useCallback(() => setActive([]), [setActive]);

    const isActive = useCallback((key) => active.includes(key), [active]);

    return { active, isActive, toggle, clear, setActive };
}

export default useReportFilters;
