import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Grid, HStack, Spinner, Text, useToast } from '@chakra-ui/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { UserContext } from '../../context/UserContext';
import { DataContext } from '../../context/DataContext';
import { WORKING_GROUP_LIST } from '../../styles/workingGroupIdentity';
import { STATUS_LEVELS_ORDER } from '../../services/utils/statusColors';
import { getIndicatorSummary } from '../graph_components/indicators/indicatorHelpers';
import SuccessIndicatorDetailPanel from '../graph_components/indicators/SuccessIndicatorDetailPanel';
import SingleReportMasterContainer from '../dashboard_components/report_components/SingleReportMasterContainer';
import useReportFilters from '../dashboard_components/report_components/useReportFilters';
import { availableCommunities, filterReportData } from '../dashboard_components/report_components/reportFilters';
import { findTrendForIndicator } from '../dashboard_components/report_components/reportMetrics';
import PresentBar from './PresentBar';
import usePresentKeys, { toggleFullscreen } from './usePresentKeys';
import { DEFAULT_SCALE, readStoredScale, stepScale, storeScale, T } from './presentScale';
import IndicatorRail from './decks/evidence/IndicatorRail';
import { buildEvidenceDeck, stepSlide } from './decks/evidence/evidenceDeck';

// Query params owned by this view. Exit drops them and keeps the report filters.
export const MEETING_PARAMS = ['view', 'wg', 'si'];

export const EVIDENCE_KEYS = [
    { keys: 'j / k', what: 'Next / previous indicator' },
    { keys: '[', what: 'Collapse or expand the indicator list' },
    { keys: 'f', what: 'Fullscreen' },
    { keys: 'Esc', what: 'Back to the report' },
];

/**
 * The reports page in meeting mode (/:campus/dashboard/reports?view=meeting).
 *
 * One working group at a time, for the selected campus and year, walked goal
 * by goal and indicator by indicator. The rail on the left lists the
 * indicators with their status counts; the centre is the indicator's report
 * exactly as the report page renders it; the right is the dashboard's editor
 * for the same indicator. An edit reloads the working group, which clears the
 * report cache, so the centre re-renders with the change.
 *
 * Selection lives in the URL (?wg=<slug>&si=<composite key>) so a link opens on
 * the same indicator. Any report filters already in the URL narrow the deck.
 */
function EvidenceMeetingView() {
    const { campus } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentAcademicYear: year, getCampusName, currentWorkingGroup, updateCurrentWorkingGroup } = useSettings();
    const { currentUser } = useContext(UserContext);
    const { data, loading, dataVersion } = useContext(DataContext);

    const [scale, setScale] = useState(() => readStoredScale() || DEFAULT_SCALE);
    const onScaleStep = (dir) => setScale((s) => { const n = stepScale(s, dir); storeScale(n); return n; });
    const [railCollapsed, setRailCollapsed] = useState(false);

    const groups = useMemo(
        () => WORKING_GROUP_LIST.filter((w) => !w.activeFromYear || !year || w.activeFromYear <= year),
        [year],
    );
    const wgParam = searchParams.get('wg');
    const wg = groups.find((w) => w.slug === wgParam)
        || groups.find((w) => w.slug === currentWorkingGroup)
        || groups[0];

    // The editor refreshes "the current working group", so it must be this one.
    useEffect(() => {
        if (wg && wg.slug !== currentWorkingGroup) updateCurrentWorkingGroup(wg.slug);
    }, [wg, currentWorkingGroup, updateCurrentWorkingGroup]);

    // The report's own filters, read from the URL, narrow the deck.
    const wgDataKeys = useMemo(() => WORKING_GROUP_LIST.map((w) => w.dataKey), []);
    const communityNames = useMemo(() => availableCommunities(data, wgDataKeys), [data, wgDataKeys]);
    const { state: filterState } = useReportFilters({ statusOrder: STATUS_LEVELS_ORDER, communityNames });
    const filtered = useMemo(() => filterReportData(data, filterState, {
        wgDataKeys, summarize: getIndicatorSummary, findTrend: findTrendForIndicator, statusOrder: STATUS_LEVELS_ORDER,
    }), [data, filterState, wgDataKeys]);

    const { sections, slides } = useMemo(
        () => buildEvidenceDeck(wg ? filtered?.[wg.dataKey] : null, getIndicatorSummary),
        [filtered, wg],
    );
    const siParam = searchParams.get('si');
    const selected = slides.find((s) => s.key === siParam) || slides[0] || null;

    const setParams = useCallback((patch) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    const select = useCallback((item) => { if (item) setParams({ wg: wg?.slug, si: item.key }); }, [setParams, wg]);
    const step = useCallback((dir) => select(stepSlide(slides, selected?.key, dir)), [select, slides, selected]);
    const onWg = useCallback((slug) => setParams({ wg: slug, si: null }), [setParams]);

    const exit = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        MEETING_PARAMS.forEach((k) => next.delete(k));
        const qs = next.toString();
        navigate(`/${campus}/dashboard/reports${qs ? `?${qs}` : ''}`);
    }, [searchParams, navigate, campus]);

    const onFullscreen = useCallback(async () => {
        const ok = await toggleFullscreen();
        if (!ok) toast({ title: 'Fullscreen is not available here. Use the browser\'s own fullscreen (F11).', status: 'info', duration: 3500 });
    }, [toast]);

    const keyHandlers = useMemo(() => ({
        onNext: () => step(1),
        onPrev: () => step(-1),
        onToggleRail: () => setRailCollapsed((v) => !v),
        onFullscreen,
        onEscape: exit,
    }), [step, onFullscreen, exit]);
    usePresentKeys(keyHandlers);

    // A new indicator opens both columns at the top.
    const reportRef = useRef(null);
    const editorRef = useRef(null);
    useEffect(() => {
        [reportRef, editorRef].forEach((r) => { if (r.current) r.current.scrollTop = 0; });
    }, [selected?.key]);

    const railWidth = railCollapsed ? '72px' : 'minmax(260px, 0.8fr)';

    return (
        <Box h="100vh" display="flex" flexDirection="column" bg="gray.50" style={{ '--present-scale': scale }}
             overflow="hidden">
            <PresentBar
                campusName={getCampusName(campus) || campus}
                year={year}
                workingGroups={groups}
                wgFilter={wg?.slug || ''}
                onWgFilter={onWg}
                allowAllGroups={false}
                modeLabel="Report meeting mode"
                shortcuts={EVIDENCE_KEYS}
                notatingAs={currentUser?.name}
                scale={scale}
                onScaleStep={onScaleStep}
                onFullscreen={onFullscreen}
                onExit={exit}
            />
            <Box as="main" id="main-content" flex="1" minH="0">
                {loading && !data ? (
                    <HStack p={8} color="gray.700"><Spinner size="md" color="teal.500" /><Text fontSize={T.body}>Loading the report…</Text></HStack>
                ) : (
                    <Grid
                        h="100%"
                        minH="0"
                        overflow="hidden"
                        templateColumns={{ base: '1fr', lg: `${railWidth} minmax(0, 1.8fr) minmax(0, 2.4fr)` }}
                        templateRows={{ base: 'auto auto auto', lg: 'minmax(0, 1fr)' }}
                    >
                        <IndicatorRail
                            sections={sections}
                            slides={slides}
                            selectedKey={selected?.key || null}
                            onSelect={select}
                            collapsed={railCollapsed}
                            onToggle={() => setRailCollapsed((v) => !v)}
                        />
                        {/* The report as published. The type scale applies as a zoom, because
                            the report's own sizes are the desk sizes. Keyed on dataVersion so an
                            edit on the right re-reads the (cleared) report cache. */}
                        <Box as="section" aria-label="Report" ref={reportRef} minH="0" overflowY="auto" bg="white"
                             borderRightWidth="1px" borderColor="gray.200">
                            <Box style={{ zoom: scale }} textAlign="left">
                                {selected ? (
                                    <SingleReportMasterContainer
                                        key={`${selected.key}-${dataVersion}`}
                                        workingGroup={wg.slug}
                                        goalNumber={String(selected.goalNumber)}
                                        indicatorNumber={String(selected.indicatorNumber)}
                                    />
                                ) : (
                                    <Text p={6} color="gray.600">No indicator selected.</Text>
                                )}
                            </Box>
                        </Box>
                        <Box as="section" aria-label="Edit evidence" ref={editorRef} minH="0" overflowY="auto" bg="gray.50">
                            <Box style={{ zoom: scale }} p={3} textAlign="left">
                                {selected && <SuccessIndicatorDetailPanel key={selected.key} wrapper={selected.wrapper} />}
                            </Box>
                        </Box>
                    </Grid>
                )}
            </Box>
        </Box>
    );
}

export default EvidenceMeetingView;
