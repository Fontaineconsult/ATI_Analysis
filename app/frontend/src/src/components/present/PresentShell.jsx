import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Grid, HStack, Spinner, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { UserContext } from '../../context/UserContext';
import { DataContext } from '../../context/DataContext';
import useResource from '../../hooks/useResource';
import useResources from '../../hooks/useResources';
import { KEYS } from '../../context/resourceKeys';
import {
    fetchMinutesPanelForWorkingGroup, fetchPlansBoard, fetchPlansTasks, fetchPlanYses,
} from '../../services/api/get';
import { addPlanSubtask } from '../../services/api/post';
import { workingGroupsForYear } from '../../styles/workingGroupIdentity';
import {
    buildDeck, mergeBoards, mergeTasks, readStoredCampuses, storeCampuses, toggleCampus,
} from './decks/plans/planDeck';
import PresentBar from './PresentBar';
import usePresentKeys, { toggleFullscreen } from './usePresentKeys';
import useMeetingMinutes from './useMeetingMinutes';
import { DEFAULT_SCALE, readStoredScale, stepScale, storeScale } from './presentScale';
import AgendaRail from './decks/plans/AgendaRail';
import PlanStage from './decks/plans/PlanStage';
import NotesPad from './decks/plans/NotesPad';
import ProgressStrip from './decks/plans/ProgressStrip';
import IndicatorsPanel from './decks/plans/IndicatorsPanel';
import NewPlanForm from './decks/plans/NewPlanForm';

/**
 * Meeting mode: the route-level shell for a shared screen.
 *
 *   /:campus/present/plans            opens on the top attention plan
 *   /:campus/present/plans/:planId    opens on one plan (a link for the chat)
 *
 * No top nav, no sub nav, no page container. One 40 px bar, a fixed viewport
 * with three columns that scroll on their own (agenda, stage, notes), and the
 * presentation type scale on the root. The deck here is Plans; the shell's
 * parts (bar, scale, keys, minutes) are what a second deck would reuse.
 *
 * The deck spans campuses: the board is read for every campus in settings
 * and merged (planDeck.mergeBoards), and the agenda's campus toggles choose
 * which campuses' plans are on deck. Notes and new tasks are still written
 * against the URL campus, the one holding the meeting.
 */
function PresentShell() {
    const { campus, planId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { currentAcademicYear: year, getCampusName, campuses } = useSettings();
    const { currentUser, individuals, loadAllIndividuals } = useContext(UserContext);
    const { invalidateResource } = useContext(DataContext) || {};

    // Presentation scale, remembered per browser.
    const [scale, setScale] = useState(() => readStoredScale() || DEFAULT_SCALE);
    const onScaleStep = (dir) => setScale((s) => { const n = stepScale(s, dir); storeScale(n); return n; });

    const [wgFilter, setWgFilter] = useState('all');

    // Which campuses' plans are on deck. Every campus by default, remembered
    // per browser, never fewer than one. Settings' campus list arrives async,
    // so the selection is (re)validated against it once it lands.
    const [selectedCampuses, setSelectedCampuses] = useState([]);
    useEffect(() => {
        if ((campuses || []).length > 0 && selectedCampuses.length === 0) {
            setSelectedCampuses(readStoredCampuses(campuses));
        }
    }, [campuses, selectedCampuses.length]);
    const onToggleCampus = useCallback((abbrev) => {
        setSelectedCampuses((sel) => { const next = toggleCampus(sel, abbrev); storeCampuses(next); return next; });
    }, []);
    const [railCollapsed, setRailCollapsed] = useState(false);
    const notesRef = useRef(null);
    const addStepRef = useRef(null);

    useEffect(() => {
        if (!individuals || individuals.length === 0) loadAllIndividuals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const people = useMemo(
        () => (individuals || []).filter((p) => p.active).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
        [individuals],
    );

    // One board and one task list per campus, plus each group's minutes at
    // the URL campus (for the previous meeting date). Same reads the desk
    // view makes, merged here.
    const campusAbbrevs = useMemo(() => {
        const list = (campuses || []).map((c) => c.abbreviation);
        return list.length ? list : (campus ? [campus] : []);
    }, [campuses, campus]);
    const boardEntries = useMemo(() => campusAbbrevs.map((abbrev) => ({
        key: year ? KEYS.plansBoard(abbrev, year) : null,
        fetcher: () => fetchPlansBoard(abbrev, year),
    })), [campusAbbrevs, year]);
    const taskEntries = useMemo(() => campusAbbrevs.map((abbrev) => ({
        key: year ? KEYS.plansTasks(abbrev, year) : null,
        fetcher: () => fetchPlansTasks(abbrev, year),
    })), [campusAbbrevs, year]);
    const { byKey: boardsByKey, loading: boardLoading, reload: reloadBoard } = useResources(boardEntries);
    const { byKey: tasksByKey, reload: reloadTasks } = useResources(taskEntries);
    const groups = useMemo(() => workingGroupsForYear(year), [year]);
    const minutesPanels = [
        useResource(campus && year && groups[0] ? KEYS.minutesForWorkingGroup(campus, year, groups[0].slug) : null,
            () => fetchMinutesPanelForWorkingGroup(campus, year, groups[0].slug)),
        useResource(campus && year && groups[1] ? KEYS.minutesForWorkingGroup(campus, year, groups[1].slug) : null,
            () => fetchMinutesPanelForWorkingGroup(campus, year, groups[1].slug)),
        useResource(campus && year && groups[2] ? KEYS.minutesForWorkingGroup(campus, year, groups[2].slug) : null,
            () => fetchMinutesPanelForWorkingGroup(campus, year, groups[2].slug)),
    ];

    const allPlans = useMemo(() => {
        const boards = {};
        campusAbbrevs.forEach((abbrev) => {
            boards[abbrev] = boardsByKey[KEYS.plansBoard(abbrev, year)]?.data?.plans || [];
        });
        return mergeBoards(boards, campusAbbrevs);
    }, [boardsByKey, campusAbbrevs, year]);

    // The deck: in-progress plans at the selected campuses, in the working-group filter, attention-first.
    const plans = useMemo(
        () => buildDeck(allPlans, { campuses: selectedCampuses, wgFilter }),
        [allPlans, selectedCampuses, wgFilter],
    );

    const allTasks = useMemo(() => {
        const lists = {};
        campusAbbrevs.forEach((abbrev) => {
            lists[abbrev] = tasksByKey[KEYS.plansTasks(abbrev, year)]?.data?.tasks || [];
        });
        return mergeTasks(lists);
    }, [tasksByKey, campusAbbrevs, year]);
    const planIds = useMemo(() => new Set(plans.map((p) => p.unique_id)), [plans]);
    const tasks = useMemo(() => allTasks.filter((t) => planIds.has(t.plan?.unique_id)), [allTasks, planIds]);

    // Previous meeting: the latest minutes dated before today, across the
    // filtered groups.
    const today = new Date().toISOString().slice(0, 10);
    const sinceDate = useMemo(() => {
        let best = null;
        minutesPanels.forEach((res, i) => {
            const g = groups[i];
            if (!g || (wgFilter !== 'all' && g.slug !== wgFilter)) return;
            (res.data?.data?.minutes || []).forEach((m) => {
                if (m.meeting_date && m.meeting_date < today && (!best || m.meeting_date > best)) best = m.meeting_date;
            });
        });
        return best;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minutesPanels[0].data, minutesPanels[1].data, minutesPanels[2].data, groups, wgFilter, today]);

    // Selection lives in the URL. No id, or an id not on deck: open the first plan.
    //
    // A plan just created on stage is a pending selection: the board is
    // reloading and the plan is not on deck yet, so the first-plan fallback
    // must wait for the reload to land and then open the new plan. If the
    // board comes back without it (it was created Not Started, say), the
    // pending selection is dropped and the fallback applies.
    const selected = useMemo(() => plans.find((p) => p.unique_id === planId) || null, [plans, planId]);
    const pendingPlan = useRef(null);
    useEffect(() => {
        if (boardLoading) {
            if (pendingPlan.current) pendingPlan.current.reloading = true;
            return;
        }
        const pending = pendingPlan.current;
        if (pending) {
            if (plans.some((p) => p.unique_id === pending.id)) {
                pendingPlan.current = null;
                navigate(`/${campus}/present/plans/${pending.id}`, { replace: true });
                return;
            }
            if (!pending.reloading) return;
            pendingPlan.current = null;
        }
        if (!selected && plans.length > 0) {
            navigate(`/${campus}/present/plans/${plans[0].unique_id}`, { replace: true });
        }
    }, [boardLoading, selected, plans, campus, navigate]);

    // The New plan form (the a shortcut and the agenda's button). A created
    // plan goes on stage: its campus is switched on and a narrower working-
    // group filter is widened, so the deck the board reload builds holds it.
    const { isOpen: newPlanOpen, onOpen: openNewPlan, onClose: closeNewPlan } = useDisclosure();
    const onPlanCreated = useCallback((plan, { campusAbbrev, workingGroupSlug, onDeck }) => {
        if (campusAbbrev && !selectedCampuses.includes(campusAbbrev)) onToggleCampus(campusAbbrev);
        if (wgFilter !== 'all' && workingGroupSlug && wgFilter !== workingGroupSlug) setWgFilter('all');
        pendingPlan.current = onDeck ? { id: plan.unique_id, reloading: false } : null;
        reloadBoard();
        reloadTasks();
    }, [selectedCampuses, onToggleCampus, wgFilter, reloadBoard, reloadTasks]);

    const select = useCallback((plan) => {
        if (plan) navigate(`/${campus}/present/plans/${plan.unique_id}`, { replace: true });
    }, [campus, navigate]);
    const step = useCallback((dir) => {
        if (plans.length === 0) return;
        const i = plans.findIndex((p) => p.unique_id === planId);
        const next = i === -1 ? 0 : Math.max(0, Math.min(plans.length - 1, i + dir));
        select(plans[next]);
    }, [plans, planId, select]);

    // The indicators the plan on stage furthers (per campus, in the notes column).
    const { data: ysesResp, loading: ysesLoading } = useResource(
        selected ? KEYS.planYses(selected.unique_id) : null,
        () => fetchPlanYses(selected.unique_id),
    );
    const evidences = useMemo(() => ysesResp || [], [ysesResp]);

    // Writes made on stage refresh the board and the task list.
    const onChanged = useCallback(() => { reloadBoard(); reloadTasks(); }, [reloadBoard, reloadTasks]);

    // Notes: today's minutes for the plan's working group.
    const minutes = useMeetingMinutes({ campus, year, recordedByUniqueId: currentUser?.unique_id || null });
    const wgName = selected?.working_groups?.[0] || null;

    const appendNote = useCallback(({ text, kind }) => (
        minutes.append(wgName, { text, planUniqueId: selected?.unique_id, kind })
    ), [minutes, wgName, selected]);

    const makeTask = useCallback(async ({ text, assigneeId, dueOn }) => {
        const record = await minutes.ensure(wgName);
        await addPlanSubtask(selected.unique_id, {
            name: text,
            assigneePersonId: assigneeId,
            dueOn,
            yearName: year,
            campusAbbrev: campus,
            minutesUniqueId: record.unique_id,
        });
        await minutes.append(wgName, { text: `${text} (task created)`, planUniqueId: selected.unique_id, kind: 'note' });
        if (invalidateResource) invalidateResource(KEYS.planAsanaSubtasks(selected.unique_id));
        onChanged();
    }, [minutes, wgName, selected, year, campus, invalidateResource, onChanged]);

    const exit = useCallback(() => {
        navigate(`/${campus}/dashboard/plans${planId ? `/${planId}` : ''}`);
    }, [campus, planId, navigate]);

    const onFullscreen = useCallback(async () => {
        const ok = await toggleFullscreen();
        if (!ok) toast({ title: 'Fullscreen is not available here. Use the browser\'s own fullscreen (F11).', status: 'info', duration: 3500 });
    }, [toast]);

    const keyHandlers = useMemo(() => ({
        onNext: () => step(1),
        onPrev: () => step(-1),
        onAddStep: () => addStepRef.current?.click(),
        onNewPlan: openNewPlan,
        onFocusNotes: () => notesRef.current?.focus(),
        onToggleRail: () => setRailCollapsed((v) => !v),
        onFullscreen,
        // Escape closes the form when it is open (the modal does too; both agree), else exits.
        onEscape: () => { if (newPlanOpen) closeNewPlan(); else exit(); },
    }), [step, onFullscreen, exit, openNewPlan, closeNewPlan, newPlanOpen]);
    usePresentKeys(keyHandlers);

    const railWidth = railCollapsed ? '56px' : 'minmax(240px, 1fr)';

    return (
        <Box h="100vh" display="flex" flexDirection="column" bg="gray.50" style={{ '--present-scale': scale }}
             overflow="hidden">
            <PresentBar
                campusName={getCampusName(campus) || campus}
                year={year}
                workingGroups={groups}
                wgFilter={wgFilter}
                onWgFilter={setWgFilter}
                notatingAs={currentUser?.name}
                scale={scale}
                onScaleStep={onScaleStep}
                onFullscreen={onFullscreen}
                onExit={exit}
            />
            <ProgressStrip plans={plans} tasks={tasks} sinceDate={sinceDate} />
            <Box as="main" id="main-content" flex="1" minH="0">
                {boardLoading ? (
                    <HStack p={8} color="gray.700"><Spinner size="md" color="teal.500" /><Text>Loading the plans board…</Text></HStack>
                ) : (
                    <Grid
                        h="100%"
                        minH="0"
                        overflow="hidden"
                        templateColumns={{ base: '1fr', lg: `${railWidth} minmax(0, 2.4fr) minmax(0, 1.6fr)` }}
                        templateRows={{ base: 'auto minmax(0, 1fr) auto', lg: 'minmax(0, 1fr)' }}
                    >
                        <AgendaRail
                            plans={plans}
                            selectedId={selected?.unique_id || null}
                            onSelect={select}
                            collapsed={railCollapsed}
                            onToggle={() => setRailCollapsed((v) => !v)}
                            campusOptions={campuses || []}
                            selectedCampuses={selectedCampuses}
                            onToggleCampus={onToggleCampus}
                            onNewPlan={openNewPlan}
                        />
                        <PlanStage
                            key={selected?.unique_id || 'none'}
                            plan={selected}
                            campus={campus}
                            year={year}
                            people={people}
                            onChanged={onChanged}
                            addStepRef={addStepRef}
                        />
                        {/* Right column: notes on top, the plan's indicators below, half each. */}
                        <Box display="grid" gridTemplateRows="minmax(0, 1fr) minmax(0, 1fr)" minH="0" h="100%">
                            <NotesPad
                                plan={selected}
                                workingGroupName={wgName}
                                minutes={wgName ? minutes.minutesFor(wgName) : null}
                                busy={minutes.busy}
                                error={minutes.error}
                                onAppend={appendNote}
                                onMakeTask={makeTask}
                                people={people}
                                inputRef={notesRef}
                            />
                            <IndicatorsPanel
                                plan={selected}
                                evidences={evidences}
                                campuses={campuses}
                                campus={campus}
                                year={year}
                                loading={ysesLoading}
                            />
                        </Box>
                    </Grid>
                )}
            </Box>

            <NewPlanForm
                isOpen={newPlanOpen}
                onClose={closeNewPlan}
                campus={campus}
                year={year}
                campusOptions={campuses || []}
                workingGroups={groups}
                defaultWorkingGroup={
                    wgFilter !== 'all' ? (groups.find((g) => g.slug === wgFilter)?.name || wgName) : wgName
                }
                people={people}
                ensureMinutes={minutes.ensure}
                appendMinutes={minutes.append}
                onCreated={onPlanCreated}
            />
        </Box>
    );
}

export default PresentShell;
