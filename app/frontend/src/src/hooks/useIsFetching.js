import { useCallback, useContext, useSyncExternalStore } from 'react';

import { DataContext } from '../context/DataContext';

/**
 * How many requests are in flight right now — the app's one answer to "is
 * anything loading?".
 *
 * This only became possible once every read went through the shared store.
 * Before that, loading state was 48 components' private useState flags and
 * nothing could see all of it at once, which is why there was no global
 * indicator to plug a spinner into.
 *
 *   const busy = useIsFetching();                 // anywhere in the app
 *   const busy = useIsFetching(NS.assets);        // just this domain
 *
 * Returns a NUMBER, not a boolean: it is the snapshot useSyncExternalStore
 * compares, and a count is more useful than a flag when you are working out why
 * a screen is slow. Truthiness reads naturally either way.
 *
 * SCOPE IT WHEN YOU CAN. An unscoped call is true whenever anything anywhere is
 * loading, which is right for a global activity indicator and wrong for a
 * panel — a panel showing a spinner because some other area is fetching is a
 * lie about the panel. For "is MY data loading", use the `loading` that
 * useResource already returns for that key.
 *
 * Subscribes directly to the store rather than reading context state, so a
 * request starting or finishing re-renders only the components that asked,
 * not every consumer of DataContext.
 */
export default function useIsFetching(prefix) {
    const ctx = useContext(DataContext) || {};
    const { subscribeResources, inflightCount } = ctx;

    const subscribe = useCallback(
        (listener) => (subscribeResources ? subscribeResources(listener) : () => {}),
        [subscribeResources],
    );

    const getSnapshot = useCallback(
        () => (inflightCount ? inflightCount(prefix) : 0),
        [inflightCount, prefix],
    );

    // No provider (a component rendered bare in a test) reports "nothing in
    // flight" rather than throwing, matching how useResource degrades.
    return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
