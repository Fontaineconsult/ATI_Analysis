import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { DataContext } from '../context/DataContext';

/**
 * Read a fetched resource through the shared cache in DataContext.
 *
 * The rule this exists to enforce: fetched application data does not live in a
 * component's useState. It lives in one keyed store on the context, and a
 * component subscribes to a key. What stays local here is only the render
 * trigger — the data itself is the cache's, which is why it survives the route
 * unmount that used to throw it away.
 *
 * Three properties fall out of that, and each of them was a real defect before:
 *
 *   Survives navigation.  Leaving an area and coming back reads from the cache.
 *                         The Documentation index is 2.6 MB; it was refetched
 *                         every single visit.
 *   One request.          Concurrent subscribers to a key share one promise, so
 *                         React 18 StrictMode's double-invoked effect is a
 *                         single fetch, and two components wanting the same
 *                         vocabulary do not both go and get it.
 *   No spinner on revisit. A cached key renders synchronously on the first
 *                         render, rather than flashing a spinner and then
 *                         settling — the effect never runs for a cache hit.
 *
 * Usage:
 *   const { data, loading, error, reload } = useResource('vendors', fetchVendors);
 *
 * `key` may be null/undefined to mean "nothing to load yet" (a detail panel with
 * no selection); the hook then reports idle rather than loading. `fetcher` is
 * held in a ref, so an inline arrow that closes over props is fine and does NOT
 * retrigger the fetch — the KEY is the only thing that identifies a resource.
 * That means the key must contain every input the fetcher depends on.
 */
export default function useResource(key, fetcher, { enabled = true } = {}) {
    const ctx = useContext(DataContext) || {};
    const { peekResource, getOrFetchResource, invalidateResource, resourceVersion } = ctx;

    const active = Boolean(enabled && key);

    // Held in a ref so a new closure each render doesn't count as a new resource.
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    // Seed from the cache so a revisit paints immediately. `undefined` means the
    // key is absent, which is deliberately distinct from a cached null.
    const [state, setState] = useState(() => {
        const cached = active && peekResource ? peekResource(key) : undefined;
        if (cached !== undefined) return { data: cached, loading: false, error: null };
        return { data: undefined, loading: active, error: null };
    });

    useEffect(() => {
        if (!active) {
            setState({ data: undefined, loading: false, error: null });
            return undefined;
        }

        const cached = peekResource ? peekResource(key) : undefined;
        if (cached !== undefined) {
            setState({ data: cached, loading: false, error: null });
            return undefined;
        }

        let cancelled = false;
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // No provider (a component rendered bare in a test) — fall back to a
        // plain uncached call rather than exploding, matching how useCampusPlans
        // degrades.
        const run = getOrFetchResource
            ? getOrFetchResource(key, () => fetcherRef.current())
            : Promise.resolve().then(() => fetcherRef.current());

        run
            .then((data) => {
                if (!cancelled) setState({ data, loading: false, error: null });
            })
            .catch((e) => {
                if (!cancelled) {
                    setState({ data: undefined, loading: false, error: e?.message || 'Failed to load.' });
                }
            });

        return () => { cancelled = true; };
        // resourceVersion is the invalidation signal: bumping it re-runs this
        // effect for every subscriber, but only the key whose entry was dropped
        // actually refetches — the rest hit the cache above.
    }, [key, active, peekResource, getOrFetchResource, resourceVersion]);

    /** Drop this key and refetch. Call after a mutation that changes it. */
    const reload = useCallback(() => {
        if (key && invalidateResource) invalidateResource(key);
    }, [key, invalidateResource]);

    return { ...state, reload };
}
