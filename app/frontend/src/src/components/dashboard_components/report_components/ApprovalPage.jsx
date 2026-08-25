import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    HStack,
    Heading,
    Link,
    Spinner,
    Text,
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { SettingsContext } from '../../../context/SettingsContext';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';
import { fetchGoalReport, fetchPrimaryData } from '../../../services/api/get';
import { assignApprover, withdrawApproval } from '../../../services/api/put';
import { workingGroupCodeFromName } from '../../../services/utils/tools';
import StatusLevelDetails from '../../graph_components/indicators/StatusLevelDetails';
import AdminSummaryForm from './AdminSummaryForm';
import AdminFeedbackForm from './AdminFeedbackForm';
import ConcernsPanel from './ConcernsPanel';
import RecommendationsPanel from './RecommendationsPanel';
import ApprovalCoverageTable from './ApprovalCoverageTable';
import { Empty } from './blocks/reportPrimitives';
import ReportSection from './blocks/ReportSection';
import ArtifactTable from './blocks/ArtifactTable';
import PlansAccomplishments from './blocks/PlansAccomplishments';
import PeopleTable from './blocks/PeopleTable';
import StatusSummary from './blocks/StatusSummary';
import CommunityOfPractice from './blocks/CommunityOfPractice';
import IndicatorIdentity from './blocks/IndicatorIdentity';
import TaapEntry from './blocks/TaapEntry';
import AssetsTable from './blocks/AssetsTable';
import ImplementationCard from './blocks/ImplementationCard';

/*
 * Approval workspace at
 * /:campus/dashboard/reports/approve/:workingGroup/:goalNumber/:indicatorNumber.
 *
 * Composes the shared report blocks (./blocks) in its own order — context, then the
 * reviewer's own account of the year, then what the bar asks for, then everything the claim
 * rests on — with the review-lens props turned on where the report leaves them off
 * (rationale callouts, claimed requirements, unrated badges). The blocks are what keep this
 * page and IndicatorReportView from drifting; the ORDER and the editable panels are what
 * make it an approval workspace rather than a second report.
 *
 * History, for whoever wonders why it isn't just the report embedded: embedding was tried
 * and cost a suppression prop per block; a fully standalone template was tried next and
 * drifted seven behaviors in one rewrite. The block decomposition is the synthesis.
 */

// ── The page ────────────────────────────────────────────────────────────────
const ApprovalPage = () => {
    const { campus, workingGroup, goalNumber, indicatorNumber } = useParams();
    const { currentAcademicYear } = useContext(SettingsContext);
    const { dataVersion, getCachedReport, getOrFetchReport, loadSingleWorkingGroupData } =
        useContext(DataContext);
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const toast = useToast();

    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState(null);
    const [acting, setActing] = useState(false);

    const wgCode = workingGroup ? workingGroupCodeFromName(workingGroup) : null;
    const compositeKey = wgCode && goalNumber && indicatorNumber
        ? `${goalNumber}.${indicatorNumber}-${wgCode}`
        : null;
    const goalKey = wgCode && goalNumber && currentAcademicYear
        ? `${wgCode}|${goalNumber}|${currentAcademicYear}|${campus || ''}`
        : null;

    // Fetched for the campus in the URL, deliberately NOT read out of DataContext, which
    // loads whichever campus the settings picker is on. Mixing the two put one campus's
    // report beside another's empty panels — which reads as "no recommendations" on an
    // indicator that has three.
    const [wgPayload, setWgPayload] = useState(null);
    const [wgLoading, setWgLoading] = useState(true);

    const loadWorkingGroup = useCallback(async () => {
        if (!workingGroup || !currentAcademicYear || !campus) return;
        setWgLoading(true);
        try {
            const resp = await fetchPrimaryData(workingGroup, currentAcademicYear, campus);
            setWgPayload(resp?.data || null);
        } catch (e) {
            setError(e?.response?.data?.error || e.message);
        } finally {
            setWgLoading(false);
        }
    }, [workingGroup, currentAcademicYear, campus]);

    useEffect(() => { loadWorkingGroup(); }, [loadWorkingGroup]);

    const refreshAfterWrite = useCallback(() => {
        loadWorkingGroup();
        loadSingleWorkingGroupData(workingGroup);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadWorkingGroup, workingGroup]);

    // Keyed on dataVersion as well as the goal: every write here runs
    // loadSingleWorkingGroupData, which clears the report cache. Without that dependency the
    // effect never re-runs and the evidence blanks out after the first review note.
    useEffect(() => {
        if (!goalKey) return;
        const cached = getCachedReport(goalKey);
        if (cached) {
            setReport(cached.indicators?.[compositeKey] || null);
            return;
        }
        let cancelled = false;
        setReportLoading(true);
        getOrFetchReport(goalKey, async () => {
            const resp = await fetchGoalReport(goalNumber, wgCode, currentAcademicYear, campus);
            return resp?.data || null;
        })
            .then((goal) => { if (!cancelled) setReport(goal?.indicators?.[compositeKey] || null); })
            .catch((e) => { if (!cancelled) setError(e?.response?.data?.error || e.message); })
            .finally(() => { if (!cancelled) setReportLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goalKey, compositeKey, dataVersion]);

    const evidenceData = useMemo(() => {
        if (!wgPayload) return null;
        const goal = wgPayload.goals?.find(
            (g) => g.goal?.properties?.goal_number === parseInt(goalNumber, 10)
        );
        const indicator = goal?.indicators?.find(
            (ind) => ind.indicator?.properties?.composite_key === compositeKey
        );
        return indicator?.evidences?.[0] || null;
    }, [wgPayload, goalNumber, compositeKey]);

    const requirementsByHandle = useMemo(() => Object.fromEntries(
        (report?.evidence_coverage?.requirements || []).map((r) => [r.handle, r])
    ), [report]);

    const backToReport = `/${campus}/dashboard/reports/${workingGroup}/${goalNumber}/${indicatorNumber}`;

    // Full-page spinner ONLY on a cold load. Every write on this page triggers a refetch,
    // and blanking a workspace someone is actively using — after each approve, note or
    // concern — reads as the page crashing. Stale-but-present data keeps rendering while
    // the fresh copy is in flight.
    if ((reportLoading && !report) || (wgLoading && !wgPayload)) {
        return (
            <Box p={8} textAlign="left">
                <HStack spacing={3}>
                    <Spinner color="teal.500" />
                    <Text color="gray.600">Loading approval workspace…</Text>
                </HStack>
            </Box>
        );
    }

    if (!evidenceData) {
        return (
            <Box p={6} textAlign="left">
                <Alert status="warning" borderRadius="md" fontSize="sm" mb={4}>
                    <AlertIcon />
                    {error || `No evidence found for ${compositeKey || 'this indicator'} in ${currentAcademicYear}${campus ? ` at ${campus}` : ''}.`}
                </Alert>
                <Button size="sm" onClick={() => navigate(backToReport)}>Back to report</Button>
            </Box>
        );
    }

    const yseProps = evidenceData.evidence.properties;
    const { year_identifier, administrative_review_complete, ready_for_admin_review } = yseProps;
    const isApproved = administrative_review_complete === true;
    const canApprove = Boolean(user?.can_approve_yse);
    const currentUserId = user?.employee_id;

    const indicator = report?.indicator || {};
    const status = report?.status || {};
    const implementers = report?.people?.implementers || [];
    const implementations = report?.implementations || [];
    const stakeholders = report?.community_stakeholders || [];
    const plans = report?.plans || [];
    const accomplishments = report?.accomplishments || [];
    const assets = report?.assets || [];
    const taaps = report?.taaps || [];

    const act = async (fn, title, description) => {
        if (!currentUserId || !canApprove) return;
        setActing(true);
        try {
            await fn(currentUserId, year_identifier);
            await refreshAfterWrite();
            toast({ title, description, status: 'success', duration: 5000, isClosable: true });
        } catch (e) {
            toast({
                title: 'Action failed',
                description: e?.response?.data?.error || 'The approval state could not be changed.',
                status: 'error', duration: 5000, isClosable: true,
            });
        } finally {
            setActing(false);
        }
    };

    return (
        <Box maxW="1280px" mx="auto" p={5} textAlign="left" pb="96px">
            {/* ── Intro: who and what, before anything asks for a judgement ── */}
            <Box mb={4}>
                <IndicatorIdentity
                    indicator={indicator}
                    compositeKey={compositeKey}
                    campusName={report?.campus?.name || (campus || '').toUpperCase()}
                    year={report?.year || currentAcademicYear}
                    breadcrumb={
                        <Text fontSize="xs" color="gray.500" mb={1}>
                            <Link as={RouterLink} to={`/${campus}/dashboard/reports`} color="teal.600">
                                Reports
                            </Link>
                            {' / '}Approval
                        </Text>
                    }
                    action={
                        <Button as={RouterLink} to={backToReport} size="sm" variant="outline"
                            rightIcon={<ExternalLinkIcon />} flexShrink={0}>
                            Open standalone report
                        </Button>
                    }
                />
            </Box>

            {isApproved && (
                <Alert status="success" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />
                    This indicator has been approved. Withdraw it to reopen the review.
                </Alert>
            )}
            {!isApproved && !ready_for_admin_review && (
                <Alert status="info" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />
                    Not yet marked ready for review by the working group. You can still review and
                    comment; approving early is possible but the group may not be finished.
                </Alert>
            )}

            <ReportSection banded mb={3} id="ap-status" title="Status"
                subtitle="Where this indicator stands, and who answers for it.">
                <VStack align="stretch" spacing={4}>
                    <Box>
                        <StatusSummary status={status} yse={yseProps} />
                    </Box>
                    <Box>
                        <CommunityOfPractice implementations={implementations} stakeholders={stakeholders} />
                    </Box>
                </VStack>
            </ReportSection>

            {/* ── The reviewer's own account, first among the things they write ── */}
            <ReportSection banded mb={3} id="ap-summary" title="Evidence summary"
                subtitle="The ATI coordinator's account of this year's evidence.">
                <AdminSummaryForm
                    yearIdentifier={year_identifier}
                    currentValue={yseProps.admin_review_description || 'No Review'}
                    onUpdate={refreshAfterWrite}
                />
            </ReportSection>

            <ReportSection banded mb={3} id="ap-review-notes" title="Review notes"
                subtitle="Notes to the working group, kept on the record for next cycle.">
                <AdminFeedbackForm
                    yearIdentifier={year_identifier}
                    adminReviewNotes={evidenceData.adminReviewNotes || []}
                    onUpdate={refreshAfterWrite}
                />
            </ReportSection>

            <ReportSection banded mb={3} id="ap-outstanding" title="Outstanding work"
                subtitle="Concerns have no path to resolution yet; recommendations are the work ahead.">
                <VStack align="stretch" spacing={5}>
                    <ConcernsPanel
                        yearIdentifier={year_identifier}
                        concerns={(evidenceData.concerns || []).filter(
                            (w) => w.concern?.properties?.status !== 'converted'
                        )}
                        onUpdate={refreshAfterWrite}
                    />
                    <RecommendationsPanel
                        yearIdentifier={year_identifier}
                        recommendations={evidenceData.recommendations || []}
                        onUpdate={refreshAfterWrite}
                    />
                </VStack>
            </ReportSection>

            <ReportSection banded mb={3} id="ap-coverage" title="Companion bar coverage"
                subtitle="Each requirement, what claims it, and the argument made for the claim.">
                {report ? <ApprovalCoverageTable coverage={report.evidence_coverage} /> : (
                    <Alert status="warning" fontSize="sm" borderRadius="md">
                        <AlertIcon />
                        Coverage is unavailable — the report for {compositeKey} could not be loaded.
                        The review tools below still work.
                    </Alert>
                )}
            </ReportSection>

            <Accordion allowToggle mb={3} borderWidth="1px" borderColor="gray.200"
                borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden">
                <AccordionItem border="none">
                    <Heading as="h2" size="sm">
                        <AccordionButton bg="teal.50" _expanded={{ bg: 'teal.100' }} py={2} px={3.5}>
                            <Box flex="1" textAlign="left">
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                                    Maturity rubric
                                </Text>
                                <Text fontSize="xs" fontWeight="normal" color="gray.600" mt={0.5}>
                                    What “{status.status_level || 'this level'}” asks for — reference while grading.
                                </Text>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </Heading>
                    <AccordionPanel p={3}>
                        <StatusLevelDetails statusDetails={evidenceData.statusLevel.properties} />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>

            <ReportSection banded mb={3} id="ap-people" title="People" count={implementers.length}>
                <PeopleTable implementers={implementers} />
            </ReportSection>







            <ReportSection banded mb={3} id="ap-plans" title="Plans & Accomplishments"
                subtitle="Committed work, and what has been claimed for this year.">
                <PlansAccomplishments plans={plans} accomplishments={accomplishments} />
            </ReportSection>

            {/* ── What the claim actually rests on ── */}
            <ReportSection banded mb={3} id="ap-implementations" title="Implementation evidence" count={implementations.length}
                subtitle="The work claimed as evidence, with its documentation.">
                {implementations.length ? (
                    <VStack align="stretch" spacing={3}>
                        {implementations.map((impl) => (
                            <ImplementationCard
                                key={`${impl.type}-${impl.unique_id}`}
                                impl={impl}
                                requirementsByHandle={requirementsByHandle}
                                showRationale
                                showClaimedRequirements
                                showUnratedBadge
                            />
                        ))}
                    </VStack>
                ) : <Empty>No implementations are wired to this indicator.</Empty>}
            </ReportSection>

            {taaps.length > 0 && (
                <ReportSection banded mb={3} id="ap-taaps" title="Temporary Alternate Access Plans" count={taaps.length}>
                    <VStack align="stretch" spacing={3}>
                        {taaps.map((t) => <TaapEntry key={t.unique_id} taap={t} />)}
                    </VStack>
                </ReportSection>
            )}

            {assets.length > 0 && (
                <ReportSection banded mb={3} id="ap-ict" title="ICT touched by this work" count={assets.length}>
                    <AssetsTable assets={assets} showDescription={false} />
                </ReportSection>
            )}

            <ReportSection banded mb={3} id="ap-annotations" title="Annotations"
                subtitle="Notes, messages and metrics recorded against this year's evidence.">
                <ArtifactTable
                    notes={report?.notes}
                    messages={report?.messages}
                    metrics={report?.metrics}
                    emptyText="None recorded for this year."
                />
            </ReportSection>

            {/* Sticky action bar — the decision must never depend on scroll position. */}
            <Box position="fixed" bottom={0} left={0} right={0} bg="white" borderTopWidth="1px"
                borderColor="gray.200" boxShadow="0 -2px 8px rgba(0,0,0,0.06)" px={6} py={3} zIndex={10}>
                <HStack maxW="1280px" mx="auto" justify="space-between" flexWrap="wrap" gap={2}>
                    <Badge
                        colorScheme={isApproved ? 'green' : ready_for_admin_review ? 'orange' : 'gray'}
                        variant="solid"
                        fontSize="2xs"
                    >
                        {isApproved ? '✓ Approved' : ready_for_admin_review ? 'Awaiting approval' : 'Not ready'}
                    </Badge>
                    <HStack spacing={3}>
                        {acting && <Spinner size="sm" color="teal.500" />}
                        {isApproved && canApprove && (
                            <Button variant="outline" colorScheme="red" size="sm" isDisabled={acting}
                                onClick={() => act(withdrawApproval, 'Approval withdrawn',
                                    'The evidence has returned to awaiting approval.')}>
                                Withdraw Approval
                            </Button>
                        )}
                        <Tooltip
                            label={
                                !currentUserId ? 'Select a user to approve this indicator'
                                    : isApproved ? 'Already approved'
                                        : !canApprove ? 'Your account does not have the Approver flag — an administrator can grant it under Settings → Members'
                                            : 'Approve this indicator'
                            }
                            placement="top"
                            hasArrow
                        >
                            <Button
                                colorScheme={isApproved ? 'green' : 'teal'}
                                size="sm"
                                isDisabled={isApproved || !currentUserId || !canApprove || acting}
                                onClick={() => act(assignApprover, 'Approval successful',
                                    'The success indicator has been approved.')}
                            >
                                {isApproved ? 'Approved' : 'Approve Indicator'}
                            </Button>
                        </Tooltip>
                    </HStack>
                </HStack>
            </Box>
        </Box>
    );
};

export default ApprovalPage;
