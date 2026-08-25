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
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    VStack,
    Wrap,
    WrapItem,
    useToast,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { SettingsContext } from '../../../context/SettingsContext';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';
import { fetchGoalReport, fetchPrimaryData } from '../../../services/api/get';
import { assignApprover, withdrawApproval } from '../../../services/api/put';
import { workingGroupCodeFromName } from '../../../services/utils/tools';
import { getWgHex } from '../../../styles/workingGroupIdentity';
import StatusLevelDetails from '../../graph_components/indicators/StatusLevelDetails';
import { strengthConfig, controlConfig } from '../../graph_components/implementation/implementationConfig';
import AdminSummaryForm from './AdminSummaryForm';
import AdminFeedbackForm from './AdminFeedbackForm';
import ConcernsPanel from './ConcernsPanel';
import RecommendationsPanel from './RecommendationsPanel';
import ApprovalCoverageTable from './ApprovalCoverageTable';
import { SubLabel as Label, Empty, Dash } from './blocks/reportPrimitives';
import ReportSection from './blocks/ReportSection';
import ArtifactTable from './blocks/ArtifactTable';
import PlansAccomplishments from './blocks/PlansAccomplishments';
import PeopleTable from './blocks/PeopleTable';
import StatusSummary from './blocks/StatusSummary';
import CommunityOfPractice from './blocks/CommunityOfPractice';

/*
 * Approval workspace at
 * /:campus/dashboard/reports/approve/:workingGroup/:goalNumber/:indicatorNumber.
 *
 * This owns its markup rather than embedding IndicatorReportView. Embedding was tried: the
 * report presents a finished record, this page supports a decision, and reconciling the two
 * cost a suppression prop per block — coverage, review notes, concerns, recommendations, the
 * rubric, the evidence summary — then a split into intro and evidence halves. Each prop was
 * defensible alone; together they were a report component contorted around a second caller.
 *
 * The cost of separating them is that the two can drift. The gain is that this page orders
 * things the way a reviewer reads: context, then their own account of the year, then what
 * the bar asks for, then everything the claim rests on — and the report stays a report.
 */

// ── Local primitives ──────────────────────────────────────────────────────────────────────
const SimpleTable = ({ columns, rows, empty = 'None recorded.' }) => {
    if (!rows.length) return <Empty>{empty}</Empty>;
    return (
        <Box overflowX="auto">
            <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                    <Tr>{columns.map((c) => <Th key={c} fontSize="2xs">{c}</Th>)}</Tr>
                </Thead>
                <Tbody>
                    {rows.map((cells, i) => (
                        <Tr key={i}>
                            {cells.map((cell, j) => (
                                <Td key={j} fontSize="xs" verticalAlign="top" whiteSpace="normal">{cell}</Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

// ── One implementation ──────────────────────────────────────────────────────
const ImplementationCard = ({ impl, requirementsByHandle }) => {
    const flagged = impl.no_active_documents || impl.undocumented;
    const accent = flagged ? 'orange' : 'teal';
    const claims = impl.satisfies || [];
    const strength = strengthConfig(impl.strength);

    return (
        <Box borderWidth="1px" borderColor="gray.200" borderLeftWidth="3px"
            borderLeftColor={`${accent}.400`} borderRadius="md" bg="white" overflow="hidden"
            opacity={impl.retired ? 0.7 : 1}>
            <Box bg={`${accent}.50`} px={3} py={2} borderBottomWidth="1px" borderColor="gray.200">
                <HStack spacing={2} align="center" flexWrap="wrap">
                    <Badge colorScheme={accent} variant="solid" fontSize="2xs" textTransform="uppercase">
                        {impl.type}
                    </Badge>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.800">{impl.title}</Text>
                    {strength ? (
                        <Tooltip label={strength.description} hasArrow>
                            <Badge colorScheme={strength.colorScheme} variant="subtle" fontSize="2xs">
                                {strength.label}
                            </Badge>
                        </Tooltip>
                    ) : (
                        <Tooltip label="This link carries no strength rating — an unqualified claim." hasArrow>
                            <Badge colorScheme="gray" variant="outline" fontSize="2xs">unrated</Badge>
                        </Tooltip>
                    )}
                    {impl.control === 'external' && (
                        <Tooltip label={controlConfig('external')?.description} hasArrow>
                            <Badge colorScheme="purple" variant="subtle" fontSize="2xs">External</Badge>
                        </Tooltip>
                    )}
                    {claims.length > 0 && (
                        <Badge colorScheme="green" variant="solid" fontSize="2xs">
                            ✓ Satisfies {claims.length}
                        </Badge>
                    )}
                    {impl.retired && (
                        <Badge colorScheme="gray" variant="solid" fontSize="2xs">
                            Retired{impl.retired_date ? ` ${impl.retired_date}` : ''}
                        </Badge>
                    )}
                    {impl.no_active_documents && (
                        <Badge colorScheme="orange" variant="solid" fontSize="2xs">
                            ⚠ No active documentation
                        </Badge>
                    )}
                    {impl.undocumented && (
                        <Badge colorScheme="orange" variant="outline" fontSize="2xs">⚠ Undocumented</Badge>
                    )}
                </HStack>
            </Box>

            <Box p={3}>
                {impl.description && (
                    <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap" mb={2}>{impl.description}</Text>
                )}

                {/* Why this work is evidence HERE — distinct from the description, which
                    describes the work and is identical wherever it appears. */}
                {impl.rationale && (
                    <Box mb={3} p={2} bg="teal.50" borderLeftWidth="2px" borderLeftColor="teal.300"
                        borderRadius="sm">
                        <Label>Why this is evidence here</Label>
                        <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap" mt={0.5}>
                            {impl.rationale}
                        </Text>
                    </Box>
                )}

                {claims.length > 0 && (
                    <Box mb={3}>
                        <Label>Requirements claimed</Label>
                        <VStack align="stretch" spacing={0.5} mt={1}>
                            {claims.map((h) => (
                                <Text key={h} fontSize="2xs" color="gray.700">
                                    • {requirementsByHandle[h]?.requirement || h}
                                </Text>
                            ))}
                        </VStack>
                    </Box>
                )}

                <Wrap spacing={2} mb={3}>
                    {impl.owner && (
                        <WrapItem>
                            <Badge colorScheme="teal" variant="subtle" fontSize="2xs">
                                Owner: {impl.owner.name}
                            </Badge>
                        </WrapItem>
                    )}
                    {(impl.accountable_communities || []).map((c) => (
                        <WrapItem key={c}>
                            <Badge colorScheme="cyan" variant="subtle" fontSize="2xs">Accountable: {c}</Badge>
                        </WrapItem>
                    ))}
                    {impl.accountable_working_group && (
                        <WrapItem>
                            <Badge colorScheme="cyan" variant="outline" fontSize="2xs">
                                WG: {impl.accountable_working_group}
                            </Badge>
                        </WrapItem>
                    )}
                    {(impl.dimensions || []).map((d) => (
                        <WrapItem key={d.handle || d.name}>
                            <Badge colorScheme="orange" variant="subtle" fontSize="2xs">{d.name}</Badge>
                        </WrapItem>
                    ))}
                    {(impl.remediates_interfaces || []).map((i) => (
                        <WrapItem key={i.unique_id || i.title}>
                            <Badge colorScheme="blue" variant="outline" fontSize="2xs">
                                Remediates: {i.title}
                            </Badge>
                        </WrapItem>
                    ))}
                </Wrap>

                {(impl.participants || []).length > 0 && (
                    <Box mb={3}>
                        <Label>Worked on by</Label>
                        <VStack align="stretch" spacing={0.5} mt={1}>
                            {impl.participants.map((p, i) => (
                                <Text key={i} fontSize="2xs" color="gray.700">
                                    <Text as="span" fontWeight="semibold">{p.person?.name}</Text>
                                    {p.role_handle ? ` — ${p.role_handle.replace('role:', '')}` : ''}
                                    {p.note ? ` · ${p.note}` : ''}
                                </Text>
                            ))}
                        </VStack>
                    </Box>
                )}

                <Label>Documentation</Label>
                <Box mt={1}>
                    <ArtifactTable
                        documents={impl.documents}
                        webpages={impl.webpages}
                        notes={impl.notes}
                        messages={impl.messages}
                        metrics={impl.metrics}
                        emptyText="No documentation attached."
                    />
                </Box>
            </Box>
        </Box>
    );
};

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

    if ((reportLoading && !report) || wgLoading) {
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
        <Box maxW="1280px" mx="auto" p={6} textAlign="left" pb="96px">
            {/* ── Intro: who and what, before anything asks for a judgement ── */}
            <Box mb={5}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                    <Link as={RouterLink} to={`/${campus}/dashboard/reports`} color="teal.600">
                        Reports
                    </Link>
                    {' / '}Approval
                </Text>
                <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
                    <Box minW={0}>
                        <HStack spacing={2} mb={1} flexWrap="wrap">
                            <Text fontFamily="mono" fontSize="lg" fontWeight="bold" color="gray.700">
                                {compositeKey}
                            </Text>
                            {indicator.working_group && (
                                <>
                                    <Box w="10px" h="10px" borderRadius="full"
                                        bg={getWgHex(indicator.working_group)} />
                                    <Text fontSize="sm" color="gray.600">{indicator.working_group}</Text>
                                </>
                            )}
                            <Text fontSize="sm" color="gray.600">
                                · {report?.campus?.name || (campus || '').toUpperCase()}
                                {' · '}{report?.year || currentAcademicYear}
                            </Text>
                        </HStack>
                        <Heading as="h1" size="md" color="gray.800" lineHeight="1.35">
                            {indicator.success_indicator}
                        </Heading>
                        {indicator.goal_number && (
                            <Text fontSize="sm" color="gray.600" mt={1}>
                                Goal {indicator.goal_number} — {indicator.goal_name}
                            </Text>
                        )}
                    </Box>
                    <Button as={RouterLink} to={backToReport} size="sm" variant="outline"
                        rightIcon={<ExternalLinkIcon />} flexShrink={0}>
                        Open standalone report
                    </Button>
                </HStack>
            </Box>

            {isApproved && (
                <Alert status="success" borderRadius="md" fontSize="sm" mb={5}>
                    <AlertIcon />
                    This indicator has been approved. Withdraw it to reopen the review.
                </Alert>
            )}
            {!isApproved && !ready_for_admin_review && (
                <Alert status="info" borderRadius="md" fontSize="sm" mb={5}>
                    <AlertIcon />
                    Not yet marked ready for review by the working group. You can still review and
                    comment; approving early is possible but the group may not be finished.
                </Alert>
            )}

            <ReportSection banded mb={5} id="ap-status" title="Status"
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

            <ReportSection banded mb={5} id="ap-people" title="People" count={implementers.length}>
                <PeopleTable implementers={implementers} />
            </ReportSection>

            {/* ── The reviewer's own account, first among the things they write ── */}
            <ReportSection banded mb={5} id="ap-summary" title="Evidence summary"
                subtitle="The ATI coordinator's account of this year's evidence.">
                <AdminSummaryForm
                    yearIdentifier={year_identifier}
                    currentValue={yseProps.admin_review_description || 'No Review'}
                    onUpdate={refreshAfterWrite}
                />
            </ReportSection>

            <ReportSection banded mb={5} id="ap-coverage" title="Companion bar coverage"
                subtitle="Each requirement, what claims it, and the argument made for the claim.">
                {report ? <ApprovalCoverageTable coverage={report.evidence_coverage} /> : (
                    <Alert status="warning" fontSize="sm" borderRadius="md">
                        <AlertIcon />
                        Coverage is unavailable — the report for {compositeKey} could not be loaded.
                        The review tools below still work.
                    </Alert>
                )}
            </ReportSection>

            <Accordion allowToggle mb={5} borderWidth="1px" borderColor="gray.200"
                borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden">
                <AccordionItem border="none">
                    <Heading as="h2" size="sm">
                        <AccordionButton bg="teal.50" _expanded={{ bg: 'teal.100' }} py={2.5} px={4}>
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
                    <AccordionPanel p={4}>
                        <StatusLevelDetails statusDetails={evidenceData.statusLevel.properties} />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>

            <ReportSection banded mb={5} id="ap-review-notes" title="Review notes"
                subtitle="Notes to the working group, kept on the record for next cycle.">
                <AdminFeedbackForm
                    yearIdentifier={year_identifier}
                    adminReviewNotes={evidenceData.adminReviewNotes || []}
                    onUpdate={refreshAfterWrite}
                />
            </ReportSection>

            <ReportSection banded mb={5} id="ap-outstanding" title="Outstanding work"
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

            <ReportSection banded mb={5} id="ap-plans" title="Plans & Accomplishments"
                subtitle="Committed work, and what has been claimed for this year.">
                <PlansAccomplishments plans={plans} accomplishments={accomplishments} />
            </ReportSection>

            {/* ── What the claim actually rests on ── */}
            <ReportSection banded mb={5} id="ap-implementations" title="Implementation evidence" count={implementations.length}
                subtitle="The work claimed as evidence, with its documentation.">
                {implementations.length ? (
                    <VStack align="stretch" spacing={3}>
                        {implementations.map((impl) => (
                            <ImplementationCard
                                key={`${impl.type}-${impl.unique_id}`}
                                impl={impl}
                                requirementsByHandle={requirementsByHandle}
                            />
                        ))}
                    </VStack>
                ) : <Empty>No implementations are wired to this indicator.</Empty>}
            </ReportSection>

            {taaps.length > 0 && (
                <ReportSection banded mb={5} id="ap-taaps" title="Temporary Alternate Access Plans" count={taaps.length}>
                    <VStack align="stretch" spacing={3}>
                        {taaps.map((t) => (
                            <Box key={t.unique_id} p={3} borderWidth="1px" borderColor="gray.200"
                                borderRadius="md">
                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">{t.title}</Text>
                                <Wrap spacing={2} mt={1}>
                                    {t.owner && (
                                        <WrapItem>
                                            <Badge colorScheme="teal" variant="subtle" fontSize="2xs">
                                                Owner: {t.owner.name}
                                            </Badge>
                                        </WrapItem>
                                    )}
                                    {(t.covers_assets || []).map((a) => (
                                        <WrapItem key={a.unique_id}>
                                            <Badge colorScheme="gray" variant="subtle" fontSize="2xs">
                                                Covers: {a.title}
                                            </Badge>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                                <Box mt={2}>
                                    <ArtifactTable
                                        documents={t.documents} webpages={t.webpages}
                                        notes={t.notes} messages={t.messages}
                                        emptyText="No evidence recorded."
                                    />
                                </Box>
                            </Box>
                        ))}
                    </VStack>
                </ReportSection>
            )}

            {assets.length > 0 && (
                <ReportSection banded mb={5} id="ap-ict" title="ICT touched by this work" count={assets.length}>
                    <SimpleTable
                        columns={['Asset', 'Class', 'Scope', 'Reached via']}
                        rows={assets.map((a) => [
                            <Text fontWeight="medium" color="gray.800">{a.title}</Text>,
                            a.asset_class ? <Text>{a.asset_class.replace(/_/g, ' ')}</Text> : <Dash />,
                            a.scope ? <Text>{a.scope}</Text> : <Dash />,
                            (a.reached_via || []).length ? <Text>{a.reached_via.join(', ')}</Text> : <Dash />,
                        ])}
                    />
                </ReportSection>
            )}

            <ReportSection banded mb={5} id="ap-annotations" title="Annotations"
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
