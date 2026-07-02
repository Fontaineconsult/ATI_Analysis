import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import {fetchPrimaryData, fetchCurrentYearIndicator, fetchTrends, fetchAllImplementations} from '../services/api/get';
import { useToast } from '@chakra-ui/react';
import {year_difference} from "../services/utils/tools";
import { useSettings } from './SettingsContext';
import { WORKING_GROUP_LIST, SLUG_TO_DATAKEY } from '../styles/workingGroupIdentity';

const transformWorkingGroup = (workingGroup) => SLUG_TO_DATAKEY[workingGroup] || workingGroup;

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    const { currentCampus } = useSettings();

    const [data, setData] = useState({
        // one null slot per working group (keyed by dataKey), derived from the registry
        ...Object.fromEntries(WORKING_GROUP_LIST.map((wg) => [wg.dataKey, null])),
        indicators: null,
        implementations: {}
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2025-2026');

    // Add a simple version counter to force re-renders
    const [dataVersion, setDataVersion] = useState(0);

    // Goal report cache (the dashboard "View" report fetches a whole goal). Kept in a ref so
    // it survives route unmounts and never triggers re-renders. Keyed by group|goal|year|campus
    // so once a goal is fetched, revisiting reads from here instead of refetching.
    const reportCacheRef = useRef({});
    // In-flight requests, keyed the same way. Ensures concurrent callers for the same key share
    // ONE network request — so React 18 StrictMode's double-invoked effect (and any genuine
    // double-mount) never fires the (slow) report fetch twice.
    const reportInflightRef = useRef({});

    const getCachedReport = useCallback((key) => reportCacheRef.current[key], []);
    const setCachedReport = useCallback((key, value) => { reportCacheRef.current[key] = value; }, []);
    const invalidateReport = useCallback((key) => {
        delete reportCacheRef.current[key];
        delete reportInflightRef.current[key];
    }, []);
    const clearReportCache = useCallback(() => {
        reportCacheRef.current = {};
        reportInflightRef.current = {};
    }, []);

    // Cache-and-dedupe: resolves to cached data if present; otherwise runs `fetcher` once and
    // shares that single promise with any concurrent caller for the same key, caching the
    // result on success. This is what makes the double-effect under StrictMode a single fetch.
    const getOrFetchReport = useCallback((key, fetcher) => {
        if (reportCacheRef.current[key]) return Promise.resolve(reportCacheRef.current[key]);
        if (reportInflightRef.current[key]) return reportInflightRef.current[key];
        const pending = Promise.resolve()
            .then(fetcher)
            .then((data) => {
                if (data) reportCacheRef.current[key] = data;
                delete reportInflightRef.current[key];
                return data;
            })
            .catch((err) => {
                delete reportInflightRef.current[key];
                throw err;
            });
        reportInflightRef.current[key] = pending;
        return pending;
    }, []);

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
            const [wgResults, indicatorsData, yoyTrends, implementationsData] = await Promise.all([
                Promise.all(WORKING_GROUP_LIST.map((wg) => fetchPrimaryData(wg.slug, selectedYear, currentCampus))),
                fetchCurrentYearIndicator(selectedYear),
                fetchTrends(year_difference(selectedYear), selectedYear, currentCampus),
                fetchAllImplementations()
            ]);

            const wgData = Object.fromEntries(
                WORKING_GROUP_LIST.map((wg, i) => [wg.dataKey, wgResults[i].data])
            );

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
            const [wgResults, implementationsData] = await Promise.all([
                Promise.all(WORKING_GROUP_LIST.map((wg) => fetchPrimaryData(wg.slug, selectedYear, currentCampus))),
                fetchAllImplementations()
            ]);

            const wgData = Object.fromEntries(
                WORKING_GROUP_LIST.map((wg, i) => [wg.dataKey, wgResults[i].data])
            );

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
            getCachedReport,
            setCachedReport,
            invalidateReport,
            clearReportCache,
            getOrFetchReport
        }}>
            {children}
        </DataContext.Provider>
    );
}

export default DataProvider;
