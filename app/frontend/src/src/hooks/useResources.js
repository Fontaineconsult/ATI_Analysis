import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DataContext } from '../context/DataContext';

/**
 * useResource for a LIST of keys whose length is only known at runtime.
 *
 * Hooks cannot be called in a loop, so a component that needs one board per
 * campus (three today, but the campus list arrives from the server) cannot
 * call useResource three times. This hook takes `entries`, an array of
 * `{ key, fetcher }`, reads every key through the same shared cache, and
 * reports `{ byKey, loading, reload }`. The same rules apply: the key is the
 * identity of a resource and must carry every input the fetcher depends on;
 * an entry with a null key is skipped.
 *
 * Loading is true while ANY entry is in flight, so a caller can hold the
 * first render until the whole set is in.
 */
export default function useResources(entries) {
    const ctx = useContext(DataContext) || {};
    const { peekResource, getOrFetchResource, invalidateResource, resourceVersion } = ctx;

    const active = useMemo(() => (entries || []).filter((e) => e && e.key), [entries]);
    const signature = active.map((e) => e.key).join('|');

    // Fetchers held in a ref, keyed, so inline arrows do not retrigger loads.
    const fetchers = useRef({});
    active.forEach((e) => { fetchers.current[e.key] = e.fetcher; });

    const [state, setState] = useState(() => {
        const byKey = {};
        let pending = 0;
        active.forEach((e) => {
            const cached = peekResource ? peekResource(e.key) : undefined;
            if (cached !== undefined) byKey[e.key] = cached; else pending += 1;
        });
        return { byKey, loading: pending > 0, error: null };
    });

    useEffect(() => {
        if (active.length === 0) {
            setState({ byKey: {}, loading: false, error: null });
            return undefined;
        }
        let cancelled = false;
        const byKey = {};
        const misses = [];
        active.forEach((e) => {
            const cached = peekResource ? peekResource(e.key) : undefined;
            if (cached !== undefined) byKey[e.key] = cached; else misses.push(e.key);
        });
        if (misses.length === 0) {
            setState({ byKey, loading: false, error: null });
            return undefined;
        }
        setState((prev) => ({ byKey: { ...prev.byKey, ...byKey }, loading: true, error: null }));
        Promise.all(misses.map((key) => {
            const run = getOrFetchResource
                ? getOrFetchResource(key, () => fetchers.current[key]())
                : Promise.resolve().then(() => fetchers.current[key]());
            return run.then((data) => { byKey[key] = data; });
        }))
            .then(() => { if (!cancelled) setState({ byKey, loading: false, error: null }); })
            .catch((e) => {
                if (!cancelled) setState({ byKey, loading: false, error: e?.message || 'Failed to load.' });
            });
        return () => { cancelled = true; };
        // `signature` stands in for `active`, which is a new array each render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signature, peekResource, getOrFetchResource, resourceVersion]);

    /** Drop every key and refetch; the effect above repaints when they land. */
    const reload = useCallback(() => {
        if (invalidateResource) active.forEach((e) => invalidateResource(e.key));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signature, invalidateResource]);

    return { byKey: state.byKey, loading: state.loading, error: state.error, reload };
}
