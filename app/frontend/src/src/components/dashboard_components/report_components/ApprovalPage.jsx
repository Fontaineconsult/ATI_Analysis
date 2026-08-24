import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Divider,
    HStack,
    Heading,
    Link,
    SimpleGrid,
    Spinner,
    Text,
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { SettingsContext, useSettings } from '../../../context/SettingsContext';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';
import { fetchGoalReport } from '../../../services/api/get';
import { assignApprover, withdrawApproval } from '../../../services/api/put';
import { workingGroupCodeFromName } from '../../../services/utils/tools';
import { SLUG_TO_DATAKEY } from '../../../styles/workingGroupIdentity';
import StatusLevelDetails from '../../graph_components/indicators/StatusLevelDetails';
import AdminSummaryForm from './AdminSummaryForm';
import AdminFeedbackForm from './AdminFeedbackForm';
import ConcernsPanel from './ConcernsPanel';
import RecommendationsPanel from './RecommendationsPanel';
import ApprovalCoverageTable from './ApprovalCoverageTable';

const Section = ({ title, subtitle, children, action }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" mb={5}>
        <Box bg="gray.50" px={4} py={2.5} borderBottomWidth="1px" borderColor="gray.200">
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

const Stat = ({ label, value, tone = 'gray', hint }) => (
    <Tooltip label={hint} openDelay={400} hasArrow isDisabled={!hint}>
        <Box
            borderWidth="1px"
            borderColor={`${tone}.200`}
            bg={`${tone}.50`}
            borderRadius="md"
            px={3}
            py={2}
            cursor={hint ? 'help' : 'default'}
        >
            <Text fontSize="2xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
                {label}
            </Text>
            <Text fontSize="sm" fontWeight="bold" color={`${tone}.700`}>{value}</Text>
        </Box>
    </Tooltip>
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
    const { currentWorkingGroup } = useSettings();
    const { data, getCachedReport, getOrFetchReport, loadSingleWorkingGroupData } = useContext(DataContext);
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

    // The report payload carries evidence_coverage — the bar with what answers each part.
    // Same goal-level cache the report page uses, so arriving here after viewing the report
    // costs nothing.
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
    }, [goalKey, compositeKey]);

    // The mutable side (concerns, recommendations, review notes, the approve flag) lives in
    // the working-group payload, which the panels below already write against.
    const evidenceData = useMemo(() => {
        const dataKey = SLUG_TO_DATAKEY[workingGroup];
        const wgData = dataKey ? data[dataKey] : null;
        if (!wgData) return null;
        const goal = wgData.goals?.find(
            (g) => g.goal?.properties?.goal_number === parseInt(goalNumber, 10)
        );
        const indicator = goal?.indicators?.find(
            (ind) => ind.indicator?.properties?.composite_key === compositeKey
        );
        return indicator?.evidences?.[0] || null;
    }, [data, workingGroup, goalNumber, compositeKey]);

    const backToReport = `/${campus}/dashboard/reports/${workingGroup}/${goalNumber}/${indicatorNumber}`;

    if (loading && !report) {
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
    const summary = coverage?.summary || {};
    const requirements = coverage?.requirements || [];
    const implementations = report?.implementations || [];

    // Decision signals. Each is a question an approver would otherwise have to reconstruct
    // by reading the whole report.
    const scoredTotal = summary.scored_total || 0;
    const scoredSatisfied = summary.scored_satisfied || 0;
    const bare = requirements.filter((r) => r.implementation_evidenced && !r.satisfied).length;
    const checkClaims = requirements.filter(
        (r) => !r.implementation_evidenced && (r.satisfied_by || []).length > 0
    ).length;
    const live = implementations.filter((im) => !im.retired);
    const unrated = live.filter((im) => im.strength === null || im.strength === undefined).length;
    const openRecs = (evidenceData.recommendations || []).filter(
        (w) => w.recommendation?.properties?.status === 'open'
    ).length;
    const openConcerns = (evidenceData.concerns || []).filter(
        (w) => w.concern?.properties?.status === 'open'
    ).length;

    const act = async (fn, successTitle, successBody) => {
        if (!currentUserId || !canApprove) return;
        setActing(true);
        try {
            await fn(currentUserId, year_identifier);
            await loadSingleWorkingGroupData(currentWorkingGroup);
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
        <Box maxW="1200px" mx="auto" p={6} textAlign="left" pb="96px">
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
                    Open full report
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

            {/* Decision signals — the questions an approver would otherwise reconstruct by
                reading the whole report. */}
            <Section
                title="At a glance"
                subtitle="What the indicator asks for, and how completely the evidence answers it."
            >
                <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
                    <Stat
                        label="Bar coverage"
                        value={requirements.length ? `${scoredSatisfied} / ${scoredTotal}` : 'No bar'}
                        tone={requirements.length === 0 ? 'gray' : scoredSatisfied === scoredTotal ? 'green' : 'orange'}
                        hint="Requirements answered by an implementation. Position and Budget are excluded — they are evidenced by position descriptions and allocation records."
                    />
                    <Stat
                        label="Bare"
                        value={bare}
                        tone={bare ? 'orange' : 'green'}
                        hint="Requirements nothing claims and nothing delivers."
                    />
                    <Stat
                        label="Check claims"
                        value={checkClaims}
                        tone={checkClaims ? 'red' : 'green'}
                        hint="Claims on Position or Budget, which an implementation cannot usually evidence. Likely overclaims."
                    />
                    <Stat
                        label="Unrated links"
                        value={`${unrated} / ${live.length}`}
                        tone={unrated ? 'orange' : 'green'}
                        hint="Live evidence links with no strength rating. An unrated link is an unqualified claim."
                    />
                    <Stat
                        label="Open items"
                        value={`${openRecs}R · ${openConcerns}C`}
                        tone={openRecs + openConcerns ? 'orange' : 'green'}
                        hint="Open recommendations and concerns still outstanding on this evidence."
                    />
                </SimpleGrid>
            </Section>

            <Section
                title="Companion bar coverage"
                subtitle="Each requirement, what claims it, and the argument made for the claim."
            >
                <ApprovalCoverageTable coverage={coverage} />
            </Section>

            <Section title="Maturity status">
                <StatusLevelDetails statusDetails={evidenceData.statusLevel.properties} />
            </Section>

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
                        onUpdate={() => loadSingleWorkingGroupData(currentWorkingGroup)}
                    />
                    <Divider />
                    <AdminFeedbackForm
                        yearIdentifier={year_identifier}
                        adminReviewNotes={evidenceData.adminReviewNotes || []}
                        onUpdate={() => loadSingleWorkingGroupData(currentWorkingGroup)}
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
                        onUpdate={() => loadSingleWorkingGroupData(currentWorkingGroup)}
                    />
                    <Divider />
                    <RecommendationsPanel
                        yearIdentifier={year_identifier}
                        recommendations={evidenceData.recommendations || []}
                        onUpdate={() => loadSingleWorkingGroupData(currentWorkingGroup)}
                    />
                </VStack>
            </Section>

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
                <HStack maxW="1200px" mx="auto" justify="space-between" flexWrap="wrap" gap={2}>
                    <HStack spacing={3} flexWrap="wrap">
                        <Badge
                            colorScheme={isApproved ? 'green' : ready_for_admin_review ? 'orange' : 'gray'}
                            variant="solid"
                            fontSize="2xs"
                        >
                            {isApproved ? '✓ Approved' : ready_for_admin_review ? 'Awaiting approval' : 'Not ready'}
                        </Badge>
                        {checkClaims > 0 && !isApproved && (
                            <Text fontSize="xs" color="red.600">
                                {checkClaims} claim{checkClaims > 1 ? 's' : ''} to check before approving
                            </Text>
                        )}
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
