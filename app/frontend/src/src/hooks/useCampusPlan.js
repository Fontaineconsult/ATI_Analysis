import { useCallback, useEffect, useState } from 'react';
import { fetchCampusPlan } from '../services/api/get';
import { createCampusPlan } from '../services/api/post';

/**
 * Data hook for a single campus plan, parameterized on (campusAbbrev,
 * academicYear). Encapsulates the fetch + state + create-if-missing flow
 * that lived inline in CampusPlanContainer, so multiple panels can drive
 * the same logic against different campuses (multi-campus comparison).
 *
 * Naive-parallel architecture: each caller of this hook fires its own
 * `fetchCampusPlan` request and manages its own loading state. No shared
 * cache between hook instances — edits to one campus's plan only refetch
 * that campus.
 *
 * Args
 * ----
 * campusAbbrev   string | null/undefined — short campus code (e.g. "sfsu")
 * academicYear   string | null/undefined — "YYYY-YYYY"
 *
 * Either being falsy parks the hook in idle state (no fetch).
 *
 * Returns
 * -------
 * {
 *   plan,        // CampusPlan DTO from the API, or null
 *   loading,     // true while fetching (initial or refetch)
 *   error,       // human-readable error string, or null
 *   notFound,    // true when the API returned 404 (campus plan doesn't exist yet)
 *   creating,    // true while createPlan is in flight
 *   reload,      // async fn — re-fetches the plan; call after edits
 *   createPlan,  // async fn — calls createCampusPlan and reloads
 * }
 */
export function useCampusPlan(campusAbbrev, academicYear) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [creating, setCreating] = useState(false);

    const reload = useCallback(async () => {
        if (!campusAbbrev || !academicYear) {
            // Idle: clear any previous state so a stale panel doesn't linger.
            setPlan(null);
            setLoading(false);
            setError(null);
            setNotFound(false);
            return;
        }

        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const response = await fetchCampusPlan(campusAbbrev, academicYear);
            setPlan(response.data);
        } catch (err) {
            if (err?.response?.status === 404) {
                setNotFound(true);
                setPlan(null);
            } else {
                setError(err?.message || 'Failed to load campus plan.');
            }
        } finally {
            setLoading(false);
        }
    }, [campusAbbrev, academicYear]);

    // Refetch whenever the (campus, year) key changes.
    useEffect(() => {
        reload();
    }, [reload]);

    const createPlan = useCallback(async () => {
        if (!campusAbbrev || !academicYear) return;
        setCreating(true);
        setError(null);
        try {
            await createCampusPlan(campusAbbrev, academicYear);
            await reload();
        } catch (err) {
            setError(err?.message || 'Failed to create campus plan.');
        } finally {
            setCreating(false);
        }
    }, [campusAbbrev, academicYear, reload]);

    return { plan, loading, error, notFound, creating, reload, createPlan };
}

export default useCampusPlan;
