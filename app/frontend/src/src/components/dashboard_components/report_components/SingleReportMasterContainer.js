import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Text, Box, Alert, AlertIcon, HStack } from '@chakra-ui/react';
import { SettingsContext } from '../../../context/SettingsContext';
import { DataContext } from '../../../context/DataContext';
import { fetchGoalReport } from '../../../services/api/get';
import { workingGroupCodeFromName } from '../../../services/utils/tools';
import IndicatorReportView from './IndicatorReportView';

/*
 * Single-indicator "View" report. Rather than fetching one indicator, it fetches the whole
 * GOAL the indicator belongs to (/report/goal → every indicator in that goal+group's rich
 * payload at once) and caches that goal in DataContext keyed by group|goal|year|campus. The
 * indicator shown is then picked out of the cached goal, so opening one report pre-loads its
 * goal siblings and navigating between them is instant.
 *
 * Each indicator payload is the full graph backbone (owner, AMM dimensions, participants,
 * assets/interfaces/tools/vendors, TAAPs); rendering lives in IndicatorReportView. The goal
 * cache is busted by DataContext on any data mutation (refreshImplementations /
 * loadSingleWorkingGroupData), so post-edit views stay fresh.
 */
const SingleReportMasterContainer = ({ workingGroup: propWorkingGroup,
                                         goalNumber: propGoalNumber,
                                         indicatorNumber: propIndicatorNumber }) => {
    const { currentAcademicYear } = useContext(SettingsContext);
    const { getCachedReport, getOrFetchReport } = useContext(DataContext);
    const { campus, workingGroup: urlWorkingGroup, goalNumber: urlGoalNumber, indicatorNumber: urlIndicatorNumber } = useParams();

    const workingGroup = propWorkingGroup || urlWorkingGroup;
    const goalNumber = propGoalNumber || urlGoalNumber;
    const indicatorNumber = propIndicatorNumber || urlIndicatorNumber;

    const wgCode = workingGroup ? workingGroupCodeFromName(workingGroup) : null;
    // Composite key, e.g. "1.12-web" — goal.indicator + working-group code.
    const compositeKey = wgCode && goalNumber && indicatorNumber
        ? `${goalNumber}.${indicatorNumber}-${wgCode}`
        : null;

    // The cache holds the whole goal, keyed by group|goal|year|campus; the indicator is read out of it.
    const goalKey = wgCode && goalNumber && currentAcademicYear
        ? `${wgCode}|${goalNumber}|${currentAcademicYear}|${campus || ''}`
        : null;
    const pickReport = (goal) => (goal && compositeKey ? goal.indicators?.[compositeKey] || null : null);

    // Seed state from the cached goal on first render so a revisit shows instantly (no spinner).
    const cachedSeed = goalKey ? pickReport(getCachedReport(goalKey)) : null;
    const [report, setReport] = useState(cachedSeed || null);
    const [loading, setLoading] = useState(!cachedSeed);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!goalKey) return;

        // Goal already cached — serve the indicator from it, never refetch on revisit.
        const cachedGoal = getCachedReport(goalKey);
        if (cachedGoal) {
            setReport(pickReport(cachedGoal));
            setError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);
        // getOrFetchReport dedupes concurrent calls for this goalKey to a single request,
        // so StrictMode's double-invoked effect (and any double-mount) won't double-fetch.
        getOrFetchReport(goalKey, async () => {
            const resp = await fetchGoalReport(goalNumber, wgCode, currentAcademicYear, campus);
            return resp?.data || null;
        })
            .then((goal) => { if (!cancelled) setReport(pickReport(goal)); })
            .catch((e) => { if (!cancelled) setError(e?.response?.data?.error || e.message || 'Failed to load report'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goalKey, compositeKey, wgCode, goalNumber, currentAcademicYear, campus, getCachedReport, getOrFetchReport]);

    if (loading) {
        return (
            <Box p={6}>
                <HStack spacing={3}><Spinner size="md" color="teal.500" /><Text color="gray.600">Loading report…</Text></HStack>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={6}>
                <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>
            </Box>
        );
    }

    if (!report) {
        return (
            <Box p={6}>
                <Alert status="warning" borderRadius="md" fontSize="sm">
                    <AlertIcon />No report data for {compositeKey} in {currentAcademicYear}{campus ? ` at ${campus}` : ''}.
                </Alert>
            </Box>
        );
    }

    return <IndicatorReportView report={report} />;
};

export default SingleReportMasterContainer;
