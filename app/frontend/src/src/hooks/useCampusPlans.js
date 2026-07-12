import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchCampusPlan } from '../services/api/get';
import { createCampusPlan } from '../services/api/post';
import { DataContext } from '../context/DataContext';

// No-cache fallback for when the hook is rendered outside a DataProvider (e.g.
// in isolation tests). There's no cross-route cache in that case — every load
// fetches directly — but nothing crashes. Defined at module scope so the
// identities are stable across renders, keeping `load`'s useCallback stable.
const NO_CACHE = {
    getCachedCampusPlan: () => undefined,
    getOrFetchCampusPlan: (_key, fetcher) => Promise.resolve().then(fetcher),
    invalidateCampusPlan: () => {},
};

/**
 * Multi-campus data hook for the campus-plan dashboard's cross-campus
 * comparison. Manages a pool of campus plans keyed by abbreviation.
 *
 * Caching: the actual plan payloads live in a route-surviving cache on
 * DataContext (getCachedCampusPlan / getOrFetchCampusPlan / invalidateCampusPlan),
 * keyed by `${abbrev}|${year}`. That cache persists across route unmount/remount,
 * so leaving the Campus Plan route and coming back renders the last-loaded plan
 * instantly instead of refetching. This hook holds only the per-render view state
 * and seeds it from the cache on mount.
 *
 * Behavior:
 * - First visit for a (campus, year): fetch, then cache.
 * - Return visits (same campus, year): served from cache — no network.
 * - Year change loads (and caches) the new year; switching back is a cache hit.
 * - Peer add/remove loads only the newly-added campus.
 * - `refreshOne(abbrev)` invalidates the cache key and refetches (post-edit).
 * - `createPlanFor(abbrev)` creates a plan and refetches it.
 *
 * StrictMode / concurrency safety comes from getOrFetchCampusPlan: concurrent
 * callers for the same key share ONE in-flight promise, so the double-invoked
 * effect never fires two fetches. A `yearRef` guard drops a late response whose
 * year no longer matches the current selection.
 */
export function useCampusPlans(campusAbbrevs, academicYear) {
    // DataContext supplies the route-surviving cache in the app; fall back to a
    // stable no-op cache when rendered without a provider so the hook never
    // hard-crashes on `useContext(DataContext)` returning undefined.
    const ctx = useContext(DataContext) || NO_CACHE;
    const getCachedCampusPlan = ctx.getCachedCampusPlan || NO_CACHE.getCachedCampusPlan;
    const getOrFetchCampusPlan = ctx.getOrFetchCampusPlan || NO_CACHE.getOrFetchCampusPlan;
    const invalidateCampusPlan = ctx.invalidateCampusPlan || NO_CACHE.invalidateCampusPlan;

    const cacheKey = useCallback((abbrev) => `${abbrev}|${academicYear}`, [academicYear]);

    // Seed view state from the persistent cache so a revisit paints immediately.
    const [byAbbrev, setByAbbrev] = useState(() => {
        const seeded = {};
        if (!academicYear) return seeded;
        for (const abbrev of campusAbbrevs) {
            const cached = getCachedCampusPlan(cacheKey(abbrev));
            if (cached) {
                seeded[abbrev] = { plan: cached, loading: false, error: null, notFound: false, creating: false };
            }
        }
        return seeded;
    });

    // Latest selected year, so a late fetch for a now-abandoned year is ignored.
    const yearRef = useRef(academicYear);
    yearRef.current = academicYear;

    const load = useCallback((abbrev, { force = false } = {}) => {
        if (!abbrev || !academicYear) return Promise.resolve();
        const key = cacheKey(abbrev);
        if (force) invalidateCampusPlan(key);

        const cached = !force && getCachedCampusPlan(key);
        if (cached) {
            setByAbbrev((prev) => ({
                ...prev,
                [abbrev]: { plan: cached, loading: false, error: null, notFound: false, creating: false },
            }));
            return Promise.resolve(cached);
        }

        setByAbbrev((prev) => ({
            ...prev,
            [abbrev]: {
                ...(prev[abbrev] || {}),
                plan: prev[abbrev]?.plan || null,
                loading: true,
                error: null,
                notFound: false,
                creating: false,
            },
        }));

        return getOrFetchCampusPlan(key, () => fetchCampusPlan(abbrev, academicYear).then((r) => r.data))
            .then((plan) => {
                if (yearRef.current !== academicYear) return;
                setByAbbrev((prev) => ({
                    ...prev,
                    [abbrev]: { plan, loading: false, error: null, notFound: false, creating: false },
                }));
            })
            .catch((err) => {
                if (yearRef.current !== academicYear) return;
                const notFound = err?.response?.status === 404;
                setByAbbrev((prev) => ({
                    ...prev,
                    [abbrev]: {
                        plan: null,
                        loading: false,
                        error: notFound ? null : (err?.message || 'Failed to load campus plan.'),
                        notFound,
                        creating: false,
                    },
                }));
            });
    }, [academicYear, cacheKey, getCachedCampusPlan, getOrFetchCampusPlan, invalidateCampusPlan]);

    // Stable string key for the dep array (raw arrays change identity each render).
    const abbrevsKey = [...campusAbbrevs].sort().join('|');

    useEffect(() => {
        if (!academicYear) {
            setByAbbrev({});
            return;
        }
        const requested = new Set(campusAbbrevs);
        // Drop state for any peer no longer requested.
        setByAbbrev((prev) => {
            const next = {};
            Object.entries(prev).forEach(([abbrev, state]) => {
                if (requested.has(abbrev)) next[abbrev] = state;
            });
            return next;
        });
        // Load each requested campus — cache hit is instant, miss fetches.
        campusAbbrevs.forEach((abbrev) => load(abbrev));
    }, [abbrevsKey, academicYear, load]); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshOne = useCallback(async (abbrev) => {
        await load(abbrev, { force: true });
    }, [load]);

    const createPlanFor = useCallback(async (abbrev) => {
        if (!abbrev || !academicYear) return;
        setByAbbrev((prev) => ({
            ...prev,
            [abbrev]: { ...(prev[abbrev] || {}), creating: true, error: null },
        }));
        try {
            await createCampusPlan(abbrev, academicYear);
            await load(abbrev, { force: true });
        } catch (err) {
            setByAbbrev((prev) => ({
                ...prev,
                [abbrev]: {
                    ...(prev[abbrev] || {}),
                    creating: false,
                    error: err?.message || 'Failed to create campus plan.',
                },
            }));
        }
    }, [academicYear, load]);

    return { byAbbrev, refreshOne, createPlanFor };
}

export default useCampusPlans;
