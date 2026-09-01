import { useContext, useMemo } from 'react';

import { DataContext } from '../context/DataContext';

/**
 * Invalidation, for the components that WRITE.
 *
 * Caching a read is only half the change. The moment a list is cached, the
 * component that creates or edits a member of it has to say so, or the cache
 * quietly serves the old list — trading a redundant request for a stale-data
 * bug, which is the worse of the two. Every mutation handler in a migrated
 * domain calls one of these.
 *
 *   invalidateNamespace(NS.assets)   after any asset write — drops the list, the
 *                                    elevation signal and every asset detail
 *                                    together, because a rename shows in all of
 *                                    them.
 *   invalidateKey(KEYS.assetDetail(id))
 *                                    when only one record moved and the lists
 *                                    genuinely cannot have changed.
 *
 * Prefer the namespace. Guessing which individual keys a write touched is how
 * caches go wrong, and refetching one extra list costs a request nobody waits
 * for, while showing a stale one costs trust in the screen.
 *
 * Degrades to no-ops without a provider, so a component rendered bare in a test
 * still works — matching useResource's own fallback.
 */
export default function useInvalidateResources() {
    const ctx = useContext(DataContext) || {};
    const { invalidateResource, invalidateResourcePrefix } = ctx;

    return useMemo(() => ({
        invalidateKey: (key) => { if (key && invalidateResource) invalidateResource(key); },
        invalidateNamespace: (ns) => { if (ns && invalidateResourcePrefix) invalidateResourcePrefix(ns); },
    }), [invalidateResource, invalidateResourcePrefix]);
}
