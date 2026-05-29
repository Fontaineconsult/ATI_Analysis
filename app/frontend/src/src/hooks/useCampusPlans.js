import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCampusPlan } from '../services/api/get';
import { createCampusPlan } from '../services/api/post';

/**
 * Multi-campus data hook for the campus-plan dashboard's cross-campus
 * comparison. Manages a pool of campus plans keyed by abbreviation.
 *
 * Behavior:
 * - Newly-added campuses fetch on add.
 * - Removed campuses are dropped from the pool.
 * - Year change refetches every currently-tracked campus.
 * - Already-loaded campuses for the current year are NOT refetched on
 *   peer add/remove.
 * - `refreshOne(abbrev)` invalidates and refetches one campus (post-edit).
 * - `createPlanFor(abbrev)` creates a plan for a campus and reloads it.
 *
 * Implementation note — StrictMode safety:
 *   Earlier versions used a cancellation-closure on cleanup plus a
 *   prev-abbrevs ref to skip refetching. Under React StrictMode the
 *   double effect-run pattern broke this: the first run marked abbrevs
 *   as "already fetched" before its fetches resolved; cleanup cancelled
 *   those fetches; the second run saw the ref as fetched and skipped;
 *   state never updated. This left the page hung on "Loading…" after
 *   route navigation (hard reload won the race occasionally, back-nav
 *   reliably lost it).
 *
 *   The fix here:
 *     - request-ID per abbrev, incremented before each fetch
 *     - .then / .catch checks ID match before updating state, so a
 *       stale response can't overwrite a newer one
 *     - "seen-for-this-year" ref is only marked AFTER a successful
 *       response, so a cancelled-and-replaced fetch still leaves the
 *       slot open for the next effect run to retry
 */
export function useCampusPlans(campusAbbrevs, academicYear) {
    const [byAbbrev, setByAbbrev] = useState({});

    // Per-abbrev request counter. Latest in-flight request for an abbrev
    // increments this. .then/.catch only update state if the id still
    // matches — older responses get dropped.
    const requestIdRef = useRef({});
    // Per-abbrev "successfully loaded for which year" marker. Set only
    // when a fetch resolves successfully. Lets us skip refetching an
    // abbrev we already have for this year.
    const seenAtYearRef = useRef({});

    // Stable string key for the dep array (raw arrays change identity each render).
    const abbrevsKey = [...campusAbbrevs].sort().join('|');

    useEffect(() => {
        if (!academicYear) {
            setByAbbrev({});
            requestIdRef.current = {};
            seenAtYearRef.current = {};
            return;
        }

        const requested = new Set(campusAbbrevs);

        // Drop state + refs for any abbrev no longer requested.
        setByAbbrev((prev) => {
            const next = {};
            Object.entries(prev).forEach(([abbrev, state]) => {
                if (requested.has(abbrev)) next[abbrev] = state;
            });
            return next;
        });
        Object.keys(seenAtYearRef.current).forEach((abbrev) => {
            if (!requested.has(abbrev)) delete seenAtYearRef.current[abbrev];
        });
        Object.keys(requestIdRef.current).forEach((abbrev) => {
            if (!requested.has(abbrev)) delete requestIdRef.current[abbrev];
        });

        // Fetch any abbrev not already loaded for this exact year.
        const toFetch = campusAbbrevs.filter((a) => seenAtYearRef.current[a] !== academicYear);

        toFetch.forEach((abbrev) => {
            const myId = (requestIdRef.current[abbrev] || 0) + 1;
            requestIdRef.current[abbrev] = myId;

            setByAbbrev((prev) => ({
                ...prev,
                [abbrev]: { ...(prev[abbrev] || {}), plan: prev[abbrev]?.plan || null, loading: true, error: null, notFound: false, creating: false },
            }));

            fetchCampusPlan(abbrev, academicYear)
                .then((response) => {
                    // Stale response — a newer fetch for this abbrev is in flight.
                    if (requestIdRef.current[abbrev] !== myId) return;
                    seenAtYearRef.current[abbrev] = academicYear;
                    setByAbbrev((prev) => ({
                        ...prev,
                        [abbrev]: { plan: response.data, loading: false, error: null, notFound: false, creating: false },
                    }));
                })
                .catch((err) => {
                    if (requestIdRef.current[abbrev] !== myId) return;
                    const notFound = err?.response?.status === 404;
                    // Don't mark seen on error — next effect run should retry.
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
        });
    }, [abbrevsKey, academicYear]); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshOne = useCallback(async (abbrev) => {
        if (!abbrev || !academicYear) return;

        // Invalidate the seen marker so the next effect run would refetch too,
        // and bump the request id so any in-flight response gets ignored.
        delete seenAtYearRef.current[abbrev];
        const myId = (requestIdRef.current[abbrev] || 0) + 1;
        requestIdRef.current[abbrev] = myId;

        setByAbbrev((prev) => ({
            ...prev,
            [abbrev]: { ...(prev[abbrev] || {}), loading: true, error: null },
        }));

        try {
            const response = await fetchCampusPlan(abbrev, academicYear);
            if (requestIdRef.current[abbrev] !== myId) return;
            seenAtYearRef.current[abbrev] = academicYear;
            setByAbbrev((prev) => ({
                ...prev,
                [abbrev]: { plan: response.data, loading: false, error: null, notFound: false, creating: false },
            }));
        } catch (err) {
            if (requestIdRef.current[abbrev] !== myId) return;
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
        }
    }, [academicYear]);

    const createPlanFor = useCallback(async (abbrev) => {
        if (!abbrev || !academicYear) return;
        setByAbbrev((prev) => ({
            ...prev,
            [abbrev]: { ...(prev[abbrev] || {}), creating: true, error: null },
        }));
        try {
            await createCampusPlan(abbrev, academicYear);
            await refreshOne(abbrev);
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
    }, [academicYear, refreshOne]);

    return { byAbbrev, refreshOne, createPlanFor };
}

export default useCampusPlans;
