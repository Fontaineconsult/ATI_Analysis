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
    Divider,
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
import IndicatorReportView, { PlansAccomplishmentsBody } from './IndicatorReportView';

const Section = ({ title, subtitle, children, action }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" mb={5}>
        <Box bg="teal.50" px={4} py={2.5} borderBottomWidth="1px" borderColor="teal.100">
            <HStack justify="space-between" align="center">
                <Box>
                    <Heading as="h2" size="sm" color="gray.800">{title}</Heading>
                    {subtitle && <Text fontSize="xs" color="gray.600" mt={0.5}>{subtitle}</Text>}
                </Box>
                {action}
            </HStack>
        </Box>
        <Box p={4}>{children}</Box>
    </Box>
);

/**
 * Full-page approval workspace at
 * /:campus/dashboard/reports/approve/:workingGroup/:goalNumber/:indicatorNumber.
 *
 * Replaces the approval modal. Two reasons it had to stop being a modal: the report was
 * embedded inside it, which made a decision surface carry a whole second document; and a
 * modal cannot be linked, so nobody could be sent to the thing needing their sign-off.
 *
 * The report is NOT rendered here. It is one click away and unchanged; this page answers a
 * narrower question — is the claimed status defensible — and everything on it exists to
 * answer that. The bar coverage is the centrepiece, because it states what the indicator
 * asks for and what actually answers it.
 */
const ApprovalPage = () => {
    const { campus, workingGroup, goalNumber, indicatorNumber } = useParams();
    const { currentAcademicYear } = useContext(SettingsContext);
    const { dataVersion, getCachedReport, getOrFetchReport, loadSingleWorkingGroupData } =
        useContext(DataContext);
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const toast = useToast();

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [acting, setActing] = useState(false);

    const wgCode = workingGroup ? workingGroupCodeFromName(workingGroup) : null;
    const compositeKey = wgCode && goalNumber && indicatorNumber
        ? `${goalNumber}.${indicatorNumber}-${wgCode}`
        : null;
    const goalKey = wgCode && goalNumber && currentAcademicYear
        ? `${wgCode}|${goalNumber}|${currentAcademicYear}|${campus || ''}`
        : null;

    // Fetched for the campus in the URL, deliberately NOT read out of DataContext.
    //
    // DataContext loads whichever campus the settings picker is on. The report on this page
    // is fetched for the campus in the URL. Reading the mutable side from context therefore
    // put two campuses on one screen — sfsu's report beside ssu's empty panels — which reads
    // as "this indicator has no recommendations" when it has three. Empty would have been a
    // bug; wrong is worse, because nothing about it looks wrong.
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

    // A write refreshes this page's own copy, and the shared context too so the rest of the
    // app doesn't go stale behind it.
    const refreshAfterWrite = useCallback(() => {
        loadWorkingGroup();
        loadSingleWorkingGroupData(workingGroup);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadWorkingGroup, workingGroup]);

    // The report payload carries evidence_coverage — the bar with what answers each part.
    // Same goal-level cache the report page uses, so arriving here after viewing the report
    // costs nothing.
    //
    // Keyed on dataVersion as well as the goal: every mutation on this page runs
    // loadSingleWorkingGroupData, which calls clearReportCache. Without that dependency the
    // effect would never re-run, the cache would stay empty, and the coverage table would
    // silently blank out the moment anyone added a review note.
    useEffect(() => {
        if (!goalKey) return;
        const cached = getCachedReport(goalKey);
        if (cached) {
            setReport(cached.indicators?.[compositeKey] || null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getOrFetchReport(goalKey, async () => {
            const resp = await fetchGoalReport(goalNumber, wgCode, currentAcademicYear, campus);
            return resp?.data || null;
        })
            .then((goal) => { if (!cancelled) setReport(goal?.indicators?.[compositeKey] || null); })
            .catch((e) => { if (!cancelled) setError(e?.response?.data?.error || e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goalKey, compositeKey, dataVersion]);

    // The mutable side (concerns, recommendations, review notes, the approve flag) lives in
    // the working-group payload, which the panels below already write against.
    const evidenceData = useMemo(() => {
        const wgData = wgPayload;
        if (!wgData) return null;
        const goal = wgData.goals?.find(
            (g) => g.goal?.properties?.goal_number === parseInt(goalNumber, 10)
        );
        const indicator = goal?.indicators?.find(
            (ind) => ind.indicator?.properties?.composite_key === compositeKey
        );
        return indicator?.evidences?.[0] || null;
    }, [wgPayload, goalNumber, compositeKey]);

    const backToReport = `/${campus}/dashboard/reports/${workingGroup}/${goalNumber}/${indicatorNumber}`;

    // Arriving cold, the working-group payload is still in flight, so evidenceData is
    // legitimately null for a moment. Without this the page would flash "no evidence
    // found" over evidence that exists.
    if ((loading && !report) || wgLoading) {
        return (
            <Box p={8} textAlign="left">
                <HStack spacing={3}><Spinner color="teal.500" /><Text color="gray.600">Loading approval workspace…</Text></HStack>
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

    const { year_identifier, administrative_review_complete, ready_for_admin_review } =
        evidenceData.evidence.properties;
    const isApproved = administrative_review_complete === true;
    const canApprove = Boolean(user?.can_approve_yse);
    const currentUserId = user?.employee_id;

    const coverage = report?.evidence_coverage;

    const act = async (fn, successTitle, successBody) => {
        if (!currentUserId || !canApprove) return;
        setActing(true);
        try {
            await fn(currentUserId, year_identifier);
            await refreshAfterWrite();
            toast({ title: successTitle, description: successBody, status: 'success', duration: 5000, isClosable: true });
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
        <Box maxW="1400px" mx="auto" p={6} textAlign="left" pb="96px">
            {/* Identity + where you are */}
            <HStack justify="space-between" align="flex-start" mb={1} flexWrap="wrap" gap={2}>
                <Box>
                    <Text fontSize="xs" color="gray.500">
                        <Link as={RouterLink} to={`/${campus}/dashboard/reports`} color="teal.600">Reports</Link>
                        {' / '}Approval
                    </Text>
                    <Heading as="h1" size="lg" color="gray.800" mt={1}>
                        Approve {compositeKey}
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                        {(campus || '').toUpperCase()} · {year_identifier}
                    </Text>
                </Box>
                <Button
                    as={RouterLink}
                    to={backToReport}
                    size="sm"
                    variant="outline"
                    rightIcon={<ExternalLinkIcon />}
                >
                    Open standalone report
                </Button>
            </HStack>

            <Text fontSize="sm" color="gray.700" mt={3} mb={5}>
                {report?.indicator?.success_indicator}
            </Text>

            {isApproved && (
                <Alert status="success" borderRadius="md" fontSize="sm" mb={5}>
                    <AlertIcon />
                    This indicator has been approved. Withdraw it to reopen the review.
                </Alert>
            )}
            {!isApproved && !ready_for_admin_review && (
                <Alert status="info" borderRadius="md" fontSize="sm" mb={5}>
                    <AlertIcon />
                    Not yet marked ready for review by the working group. You can still review
                    and comment; approving early is possible but the group may not be finished.
                </Alert>
            )}

            <Section
                title="Companion bar coverage"
                subtitle="Each requirement, what claims it, and the argument made for the claim."
            >
                {report ? (
                    <ApprovalCoverageTable coverage={coverage} />
                ) : (
                    /* The page-level guard covers "still loading", so reaching here means
                       the report resolved without this indicator in it. The table's empty
                       state asserts the bar was never authored, which is a different claim
                       and not one this state supports. */
                    <Alert status="warning" fontSize="sm" borderRadius="md">
                        <AlertIcon />
                        Coverage is unavailable — the report for {compositeKey} could not be
                        loaded, so the companion bar cannot be shown. The evidence and review
                        tools below still work.
                    </Alert>
                )}
            </Section>

            <Accordion allowToggle mb={5} borderWidth="1px" borderColor="gray.200"
                borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden">
                <AccordionItem border="none">
                    <Heading as="h2" size="sm">
                        <AccordionButton bg="teal.50" _expanded={{ bg: 'teal.100' }} py={2.5} px={4}>
                            <Box flex="1" textAlign="left">
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                                    Maturity status
                                </Text>
                                <Text fontSize="xs" fontWeight="normal" color="gray.600" mt={0.5}>
                                    The rubric this level is claimed against.
                                </Text>
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </Heading>
                    <AccordionPanel p={4}>
                        <StatusLevelDetails statusDetails={evidenceData.statusLevel.properties} />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>

            {/* Review comments — the reviewer's own record, and the reason this page exists
                as a workspace rather than a confirmation dialog. */}
            <Section
                title="Review comments"
                subtitle="Your summary of the evidence, and notes to the working group."
            >
                <VStack align="stretch" spacing={5}>
                    <AdminSummaryForm
                        yearIdentifier={year_identifier}
                        currentValue={evidenceData.evidence.properties.admin_review_description || 'No Review'}
                        onUpdate={refreshAfterWrite}
                    />
                    <Divider />
                    <AdminFeedbackForm
                        yearIdentifier={year_identifier}
                        adminReviewNotes={evidenceData.adminReviewNotes || []}
                        onUpdate={refreshAfterWrite}
                    />
                </VStack>
            </Section>

            <Section
                title="Outstanding work"
                subtitle="Concerns have no path to resolution yet; recommendations are the work ahead."
            >
                <VStack align="stretch" spacing={5}>
                    <ConcernsPanel
                        yearIdentifier={year_identifier}
                        concerns={(evidenceData.concerns || []).filter(
                            (w) => w.concern?.properties?.status !== 'converted'
                        )}
                        onUpdate={refreshAfterWrite}
                    />
                    <Divider />
                    <RecommendationsPanel
                        yearIdentifier={year_identifier}
                        recommendations={evidenceData.recommendations || []}
                        onUpdate={refreshAfterWrite}
                    />
                </VStack>
            </Section>

            {/* Plans and accomplishments sit above the evidence: they are what the group
                says comes next, which frames how a reviewer reads what is there now. Same
                block the report renders, suppressed there so it appears once. */}
            <Section
                title="Plans & Accomplishments"
                subtitle="Committed work and what has already been claimed for this year."
            >
                <PlansAccomplishmentsBody
                    plans={report?.plans || []}
                    accomplishments={report?.accomplishments || []}
                />
            </Section>

            {/* The evidence, rendered exactly as the report page renders it. An approver is
                deciding whether the claimed status is defensible, and that decision is made
                against the implementations, documentation, people and annotations — not
                against a summary of them. Same component, so the two can never drift. Its
                own coverage section is suppressed because the review-lens table above
                already carries that ground with rationale and claim flags. */}
            <Box mt={2} mb={4}>
                <Heading as="h2" size="sm" color="gray.800" mb={1}>Evidence</Heading>
                <Text fontSize="xs" color="gray.600">
                    The full record for this indicator, as it appears on the report.
                </Text>
            </Box>
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
                mb={5}
            >
                <IndicatorReportView report={report} suppressReviewBlocks suppressPlans />
            </Box>

            {/* Sticky action bar — the decision must never depend on scroll position. */}
            <Box
                position="fixed"
                bottom={0}
                left={0}
                right={0}
                bg="white"
                borderTopWidth="1px"
                borderColor="gray.200"
                boxShadow="0 -2px 8px rgba(0,0,0,0.06)"
                px={6}
                py={3}
                zIndex={10}
            >
                <HStack maxW="1400px" mx="auto" justify="space-between" flexWrap="wrap" gap={2}>
                    <HStack spacing={3} flexWrap="wrap">
                        <Badge
                            colorScheme={isApproved ? 'green' : ready_for_admin_review ? 'orange' : 'gray'}
                            variant="solid"
                            fontSize="2xs"
                        >
                            {isApproved ? '✓ Approved' : ready_for_admin_review ? 'Awaiting approval' : 'Not ready'}
                        </Badge>
                    </HStack>
                    <HStack spacing={3}>
                        {acting && <Spinner size="sm" color="teal.500" />}
                        {isApproved && canApprove && (
                            <Button
                                variant="outline"
                                colorScheme="red"
                                size="sm"
                                isDisabled={acting}
                                onClick={() => act(withdrawApproval, 'Approval withdrawn',
                                    'The evidence has returned to awaiting approval.')}
                            >
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
