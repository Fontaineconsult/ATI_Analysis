import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import {fetchPrimaryData, fetchCurrentYearIndicator, fetchTrends, fetchAllImplementations} from '../services/api/get';
import { useToast } from '@chakra-ui/react';
import {year_difference} from "../services/utils/tools";
import { useSettings } from './SettingsContext';
import { WORKING_GROUP_LIST, SLUG_TO_DATAKEY, makeInitialWgState } from '../styles/workingGroupIdentity';
import { createResourceStore } from './resourceStore';

// Slug -> DataContext state key, derived from the WG single-source-of-truth. Keeps the
// passthrough fallback so an unknown slug maps to itself, exactly as before.
const transformWorkingGroup = (workingGroup) => SLUG_TO_DATAKEY[workingGroup] || workingGroup;

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    const { currentCampus } = useSettings();

    const [data, setData] = useState({
        ...makeInitialWgState(),   // { web: null, instructionalMaterials: null, procurement: null }
        indicators: null,
        implementations: {}
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2025-2026');

    // Add a simple version counter to force re-renders
    const [dataVersion, setDataVersion] = useState(0);

    // ----------------------------------------------------------------- //
    // Shared resource cache                                              //
    // ----------------------------------------------------------------- //
    //
    // ONE keyed store behind every cached read in the app (see resourceStore.js).
    // It exists because fetched data held in a component's useState dies with
    // the route: the Documentation index (2.6 MB) was refetched on every visit
    // to the area, and twice per visit in development, because StrictMode
    // double-invokes effects.
    //
    // The store lives in a ref, so it survives route unmounts and writing to it
    // re-renders nobody. `resourceVersion` is the only state: bumped on
    // invalidation — which is rare, since it follows a mutation — and it is what
    // tells mounted subscribers to re-read.
    //
    // Keys are namespaced ('report:...', 'plan:...', 'documentation:...'). The
    // report and campus-plan helpers below are thin views over this one store.
    // They used to be two hand-rolled copies of it, which is how the
    // Documentation area came to have neither.
    const storeRef = useRef(null);
    if (storeRef.current === null) storeRef.current = createResourceStore();
    const store = storeRef.current;

    const [resourceVersion, setResourceVersion] = useState(0);
    const bump = useCallback(() => setResourceVersion((v) => v + 1), []);

    /** Synchronous read. undefined means "not cached", which is deliberately
     *  distinct from a cached null — subscribers use it to paint immediately on
     *  a revisit instead of flashing a spinner. */
    const peekResource = useCallback((key) => store.peek(key), [store]);
    const setResource = useCallback((key, value) => store.set(key, value), [store]);
    const getOrFetchResource = useCallback(
        (key, fetcher) => store.getOrFetch(key, fetcher), [store],
    );
    const invalidateResource = useCallback((key) => {
        store.invalidate(key);
        bump();
    }, [store, bump]);
    const invalidateResourcePrefix = useCallback((prefix) => {
        store.invalidatePrefix(prefix);
        bump();
    }, [store, bump]);

    // The activity surface, for useIsFetching. Passed through as the store's own
    // functions rather than mirrored into state: a subscriber that wants to know
    // about in-flight requests subscribes to them directly, so the rest of the
    // context does not re-render every time one starts or finishes.
    const subscribeResources = useCallback((listener) => store.subscribe(listener), [store]);
    const inflightCount = useCallback((prefix) => store.inflightCount(prefix), [store]);

    // --- Report cache: a view over the store, keyed report:<group|goal|year|campus>.
    // Names and signatures are unchanged from when this was its own pair of refs,
    // because ApprovalPage, SingleReportMasterContainer and their tests bind to them.
    const getCachedReport = useCallback((key) => peekResource(`report:${key}`), [peekResource]);
    const setCachedReport = useCallback(
        (key, value) => setResource(`report:${key}`, value), [setResource],
    );
    const invalidateReport = useCallback(
        (key) => invalidateResource(`report:${key}`), [invalidateResource],
    );
    const clearReportCache = useCallback(
        () => invalidateResourcePrefix('report:'), [invalidateResourcePrefix],
    );
    const getOrFetchReport = useCallback(
        (key, fetcher) => getOrFetchResource(`report:${key}`, fetcher), [getOrFetchResource],
    );

    // --- Campus-plan cache: same, keyed plan:<abbrev|year>.
    const getCachedCampusPlan = useCallback((key) => peekResource(`plan:${key}`), [peekResource]);
    const invalidateCampusPlan = useCallback(
        (key) => invalidateResource(`plan:${key}`), [invalidateResource],
    );
    const getOrFetchCampusPlan = useCallback(
        (key, fetcher) => getOrFetchResource(`plan:${key}`, fetcher), [getOrFetchResource],
    );

    const toast = useToast();

    useEffect(() => {
        // Don't load data until campus is set
        if (currentCampus) {
            loadData();
        }
    }, [selectedYear, currentCampus]);

    const loadData = async () => {
        try {
            setLoading(true);
            // WG fetches are derived from the SSOT (one per dashboard group, in list order);
            // the three non-WG fetches follow. All in one Promise.all to preserve concurrency.
            const results = await Promise.all([
                ...WORKING_GROUP_LIST.map((w) => fetchPrimaryData(w.slug, selectedYear, currentCampus)),
                fetchCurrentYearIndicator(selectedYear),
                fetchTrends(year_difference(selectedYear), selectedYear, currentCampus),
                fetchAllImplementations()
            ]);
            const wgResults = results.slice(0, WORKING_GROUP_LIST.length);
            const [indicatorsData, yoyTrends, implementationsData] = results.slice(WORKING_GROUP_LIST.length);
            const wgData = Object.fromEntries(WORKING_GROUP_LIST.map((w, i) => [w.dataKey, wgResults[i].data]));

            setData({
                ...wgData,
                indicators: indicatorsData.data,
                yoyTrends: yoyTrends.data,
                implementations: implementationsData.status?.data || implementationsData.data || {}
            });

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error loading data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSingleWorkingGroupData = async (workingGroup) => {
        const dataKey = transformWorkingGroup(workingGroup);
        try {
            setUpdating(true);
            const groupData = await fetchPrimaryData(workingGroup, selectedYear, currentCampus);

            setData((prevData) => ({
                ...prevData,
                [dataKey]: groupData.data,
            }));

            // A mutation just happened — drop cached reports so the next View refetches.
            clearReportCache();

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);

        } catch (err) {
            setError(err.message);
            toast({
                title: `Error updating ${workingGroup} data.`,
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    const refreshIndicators = async () => {
        try {
            setUpdating(true);
            const indicatorsData = await fetchCurrentYearIndicator(selectedYear);

            setData((prevData) => ({
                ...prevData,
                indicators: indicatorsData.data,
            }));

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);
        } catch (err) {
            toast({
                title: "Error refreshing indicators data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    const updateYear = (newYear) => {
        setSelectedYear(newYear);
        toast({
            title: `Year changed to ${newYear}`,
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    };

    const refreshImplementations = async () => {
        try {
            setUpdating(true);
            const results = await Promise.all([
                ...WORKING_GROUP_LIST.map((w) => fetchPrimaryData(w.slug, selectedYear, currentCampus)),
                fetchAllImplementations()
            ]);
            const wgResults = results.slice(0, WORKING_GROUP_LIST.length);
            const implementationsData = results[WORKING_GROUP_LIST.length];
            const wgData = Object.fromEntries(WORKING_GROUP_LIST.map((w, i) => [w.dataKey, wgResults[i].data]));

            setData((prevData) => ({
                ...prevData,
                ...wgData,
                implementations: implementationsData.status?.data || implementationsData.data || {}
            }));

            // A mutation just happened — drop cached reports so the next View refetches.
            clearReportCache();

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);
        } catch (err) {
            toast({
                title: "Error refreshing implementations.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <DataContext.Provider value={{
            data,
            loading,
            updating,
            error,
            selectedYear,
            updateYear,
            loadSingleWorkingGroupData,
            refreshIndicators,
            refreshImplementations,
            dataVersion,
            peekResource,
            getOrFetchResource,
            invalidateResource,
            invalidateResourcePrefix,
            subscribeResources,
            inflightCount,
            resourceVersion,
            getCachedReport,
            setCachedReport,
            invalidateReport,
            clearReportCache,
            getOrFetchReport,
            getCachedCampusPlan,
            invalidateCampusPlan,
            getOrFetchCampusPlan
        }}>
            {children}
        </DataContext.Provider>
    );
}

export default DataProvider;
