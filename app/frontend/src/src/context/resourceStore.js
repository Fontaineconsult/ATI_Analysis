/**
 * The app's fetched-data store: one keyed cache with request de-duplication.
 *
 * Plain JavaScript on purpose — no React. DataContext holds an instance in a
 * ref and exposes it; keeping the logic out here means the two properties that
 * matter can be tested directly rather than through a rendered provider:
 *
 *   1. A key is fetched at most once. Concurrent callers for the same key share
 *      ONE promise. This is what makes React 18 StrictMode's double-invoked
 *      effect a single request, and what stops two components that both want
 *      the vendor list from both going and getting it.
 *   2. The cache outlives the components reading it, because it is not
 *      component state. That is the whole point: fetched data in useState dies
 *      with the route and is fetched again on return.
 *
 * `undefined` is the "absent" marker, so a cached `null` is a real cached value
 * and callers can tell the two apart. A rejected fetch caches nothing — the
 * next subscriber retries rather than inheriting a failure forever.
 */
export function createResourceStore() {
    let cache = Object.create(null);
    let inflight = Object.create(null);

    // Subscribers to in-flight changes. This is what makes a global "is anything
    // loading?" indicator possible at all: before every read went through here,
    // the answer was scattered across 48 components' private useState flags and
    // nothing could see all of it at once.
    const listeners = new Set();
    const notify = () => { listeners.forEach((listener) => listener()); };

    const peek = (key) => cache[key];

    const has = (key) => key in cache;

    const set = (key, value) => { cache[key] = value; };

    const getOrFetch = (key, fetcher) => {
        if (key in cache) return Promise.resolve(cache[key]);
        if (inflight[key]) return inflight[key];

        const pending = Promise.resolve()
            .then(fetcher)
            .then((value) => {
                // undefined would be indistinguishable from "absent", so a
                // fetcher that resolves to nothing caches nothing.
                if (value !== undefined) cache[key] = value;
                delete inflight[key];
                notify();
                return value;
            })
            .catch((err) => {
                delete inflight[key];
                notify();
                throw err;
            });

        inflight[key] = pending;
        notify();
        return pending;
    };

    /**
     * Subscribe to in-flight changes. Returns an unsubscribe.
     *
     * Deliberately NOT a React state update in the provider: bumping context
     * state on every request start and finish would re-render every consumer of
     * DataContext several times a page load. Subscribers opt in individually
     * (useIsFetching does it with useSyncExternalStore).
     */
    const subscribe = (listener) => {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    };

    /**
     * How many requests are in flight, optionally within one namespace.
     *
     * A NUMBER, not a boolean, because it has to be a stable snapshot for
     * useSyncExternalStore — and because "3 requests out" is more useful than
     * "something is loading" when you are looking at why a screen is slow.
     */
    const inflightCount = (prefix) => {
        const keys = Object.keys(inflight);
        return prefix ? keys.filter((k) => k.startsWith(prefix)).length : keys.length;
    };

    const invalidate = (key) => {
        delete cache[key];
        delete inflight[key];
        notify();
    };

    /** Drop a whole namespace — "every report", "every campus plan". */
    const invalidatePrefix = (prefix) => {
        [cache, inflight].forEach((bucket) => {
            Object.keys(bucket).forEach((k) => {
                if (k.startsWith(prefix)) delete bucket[k];
            });
        });
        notify();
    };

    const clear = () => {
        cache = Object.create(null);
        inflight = Object.create(null);
        notify();
    };

    /** Test/diagnostic helper — the keys currently held. */
    const keys = () => Object.keys(cache);

    return {
        peek, has, set, getOrFetch, invalidate, invalidatePrefix, clear, keys,
        subscribe, inflightCount,
    };
}

export default createResourceStore;
