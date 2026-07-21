import React, { useContext, useMemo } from 'react';
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    Link,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    Tag,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { getImplementationURL, navigateToIndicator } from '../../../services/utils/tools';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import StatusProgression from '../campus_plan_components/StatusProgression';
import { StatusLevelContext } from '../../../context/StatusLevelContext';
import { getPlanStatusColorScheme, getPlanStatusLabel } from '../../../styles/planStatusColors';
import CopyIndicatorReportButton from './CopyIndicatorReportButton';

/*
 * The single-indicator "View" report — a flat, single-column, single-page rendering of ALL
 * evidence for one YearSuccessEvidence (indicator × year × campus). Every section always
 * renders (with an explicit empty state) so the report reads as a complete checklist; the
 * only interactions are links and the Copy/Print/Edit actions. Print = the report.
 *
 * All record lists render as subtle tables (thin row rules, muted headers, no heavy chrome).
 * Semantic document: one <h1> (the indicator), <h2> per section, <h3> per implementation entry.
 */

// ── Primitives ──────────────────────────────────────────────────────────────
const SubLabel = ({ children }) => (
    <Text fontSize="2xs" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wide">
        {children}
    </Text>
);

const Empty = ({ children }) => (
    <Text fontSize="sm" color="gray.600" fontStyle="italic">{children}</Text>
);

const Dash = () => <Text as="span" color="gray.600">—</Text>;

/** Subtle data table — muted uppercase headers, thin horizontal row rules, no vertical lines. */
const TH_SX = {
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'gray.600',
    fontWeight: 'bold', px: 2, py: 1.5, borderBottomWidth: '1px', borderColor: 'gray.200',
    textAlign: 'left', whiteSpace: 'nowrap',
};
const TD_SX = { fontSize: 'xs', color: 'gray.700', px: 2, py: 2, borderBottomWidth: '1px', borderColor: 'gray.100', verticalAlign: 'top' };

const DataTable = ({ columns, rows }) => {
    if (!rows.length) return null;
    return (
        <Box overflowX="auto">
            <Table size="sm" variant="unstyled" sx={{ tableLayout: 'auto' }}>
                <Thead>
                    <Tr>{columns.map((c, i) => <Th key={i} sx={TH_SX}>{c}</Th>)}</Tr>
                </Thead>
                <Tbody>
                    {rows.map((cells, ri) => (
                        <Tr key={ri}>{cells.map((cell, ci) => <Td key={ci} sx={TD_SX}>{cell}</Td>)}</Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

/** A titled white section with an <h2> heading and `aria-labelledby` for landmark nav. */
const ReportSection = ({ id, title, count, action, children }) => (
    <Box as="section" aria-labelledby={id} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
        <HStack justify="space-between" align="baseline" mb={3}>
            <Heading as="h2" id={id} size="sm" color="teal.700">
                {title}{typeof count === 'number' ? ` (${count})` : ''}
            </Heading>
            {action}
        </HStack>
        {children}
    </Box>
);

const WG_DOT = { Web: '#4966A4', 'Instructional Materials': '#635098', Procurement: '#DB5850' };

// ── Artifact rows (typed leading tag + resolved link) ───────────────────────
// Canonical artifact link resolution: uploaded (managed) files carry their link at
// file.download_url — the flat file_path/uri_path are null for them, which is why a plain
// `file_path || uri_path` produced dead links. Mirrors FileDownload in docPrimitives.jsx.
const resolveArtifactHref = (node) =>
    node?.file?.download_url || node?.uri_path || node?.file_path || null;

const ARTIFACT_TAG = {
    FILE:   { scheme: 'teal',   variant: 'solid' },
    URL:    { scheme: 'blue',   variant: 'solid' },
    WEB:    { scheme: 'blue',   variant: 'outline' },
    GONE:   { scheme: 'red',    variant: 'solid' },
    NOTE:   { scheme: 'purple', variant: 'subtle' },
    MSG:    { scheme: 'cyan',   variant: 'subtle' },
    METRIC: { scheme: 'green',  variant: 'subtle' },
};

const TagBadge = ({ tag }) => {
    const cfg = ARTIFACT_TAG[tag] || { scheme: 'gray', variant: 'subtle' };
    return <Badge colorScheme={cfg.scheme} variant={cfg.variant} fontSize="2xs">{tag}</Badge>;
};

const fileMeta = (file) => {
    if (!file) return null;
    const kb = file.size != null ? `${Math.max(1, Math.round(file.size / 1024))} KB` : null;
    return [file.uploaded_date, kb].filter(Boolean).join(' · ') || null;
};

const isTrue = (v) => v === true || v === 'True';

/** Build [Kind, Item, Details] rows for a set of documents/webpages/notes/messages/metrics. */
function artifactRows({ documents = [], webpages = [], notes = [], messages = [], metrics = [] }) {
    const rows = [];

    documents.forEach((d) => {
        const href = resolveArtifactHref(d);
        const flags = (
            <Wrap spacing={1}>
                {fileMeta(d.file) && <WrapItem><Text fontSize="2xs" color="gray.600">{fileMeta(d.file)}</Text></WrapItem>}
                {isTrue(d.is_administrative_review_documentation) && <WrapItem><Badge colorScheme="purple" fontSize="2xs">Admin Review</Badge></WrapItem>}
                {isTrue(d.is_milestone_and_measures_documentation) && <WrapItem><Badge colorScheme="blue" fontSize="2xs">Milestones</Badge></WrapItem>}
                {isTrue(d.depreciated) && <WrapItem><Badge colorScheme="orange" fontSize="2xs">Deprecated</Badge></WrapItem>}
            </Wrap>
        );
        rows.push([
            <TagBadge tag={d.file?.download_url ? 'FILE' : 'URL'} />,
            href ? <Link href={href} isExternal color="teal.600">{d.name || 'Document'}</Link> : <Text>{d.name || 'Document'}</Text>,
            flags,
        ]);
    });

    webpages.forEach((w) => {
        const gone = isTrue(w.no_longer_exists);
        rows.push([
            <TagBadge tag={gone ? 'GONE' : 'WEB'} />,
            gone
                ? <Text as="s" aria-label={`${w.name || w.url} (no longer available)`}>{w.name || w.url}</Text>
                : <Link href={w.url} isExternal color="teal.600">{w.name || w.url}</Link>,
            isTrue(w.depreciated) ? <Badge colorScheme="orange" fontSize="2xs">Deprecated</Badge> : <Dash />,
        ]);
    });

    notes.forEach((n) => rows.push([
        <TagBadge tag="NOTE" />, <Text>{n.content}</Text>,
        (n.dateCreated || n.date_created) ? <Text fontSize="2xs" color="gray.600">{n.dateCreated || n.date_created}</Text> : <Dash />,
    ]));

    messages.forEach((m) => {
        const href = resolveArtifactHref(m);
        rows.push([
            <TagBadge tag="MSG" />, <Text>{m.content || m.name}</Text>,
            <HStack spacing={2}>
                {href && <Link href={href} isExternal color="teal.600" fontSize="2xs">attachment</Link>}
                {m.date_created && <Text fontSize="2xs" color="gray.600">{m.date_created}</Text>}
                {!href && !m.date_created && <Dash />}
            </HStack>,
        ]);
    });

    metrics.forEach((m) => {
        const extra = [m.comment, m.academic_year].filter(Boolean).join(' · ');
        rows.push([
            <TagBadge tag="METRIC" />,
            <Text><Text as="span" fontWeight="semibold">{m.name}:</Text> {m.single_value ?? '—'}</Text>,
            extra ? <Text fontSize="2xs" color="gray.600">{extra}</Text> : <Dash />,
        ]);
    });

    return rows;
}

const ArtifactTable = ({ emptyText = 'None recorded.', ...lists }) => {
    const rows = artifactRows(lists);
    if (!rows.length) return <Empty>{emptyText}</Empty>;
    return <DataTable columns={['Kind', 'Item', 'Details']} rows={rows} />;
};

// ── Inline maturity rubric (the retired right-rail panel, folded in flat) ────
const RUBRIC_CATEGORIES = [
    { name: 'Procedures', descKey: 'procedure_descriptions', reqKey: 'procedure_requirements' },
    { name: 'Resources', descKey: 'resource_descriptions', reqKey: 'resource_requirements' },
    { name: 'Documentation', descKey: 'documentation_descriptions', reqKey: 'documentation_requirements' },
    { name: 'Documentation Evidence', descKey: 'documentation_evidence_descriptions', reqKey: 'documentation_evidence_requirements' },
];

const MaturityCriteria = ({ currentStatusLevelName }) => {
    const ctx = useContext(StatusLevelContext) || {};
    const levels = ctx.statusLevels || [];
    const level = useMemo(() => (
        (!levels.length || !currentStatusLevelName)
            ? null
            : levels.find((l) => l.status_level?.toLowerCase() === currentStatusLevelName.toLowerCase()) || null
    ), [levels, currentStatusLevelName]);

    if (!level) return null;
    return (
        <Box mt={4} pt={3} borderTopWidth="1px" borderColor="gray.100">
            <SubLabel>Expected evidence at “{level.status_level}”</SubLabel>
            <VStack align="stretch" spacing={3} mt={2}>
                {RUBRIC_CATEGORIES.map((cat) => {
                    const descs = level[cat.descKey] || [];
                    const reqs = level[cat.reqKey] || [];
                    if (!descs.length && !reqs.length) return null;
                    return (
                        <Box key={cat.name}>
                            <Text fontSize="2xs" fontWeight="semibold" color="gray.600" mb={1}>{cat.name}</Text>
                            <VStack align="stretch" spacing={0.5} pl={2}>
                                {descs.map((d) => <Text key={d.unique_id} fontSize="xs" color="gray.700">• {d.description}</Text>)}
                                {reqs.map((r) => <Text key={r.unique_id} fontSize="xs" color="gray.600">• {r.requirement_description}</Text>)}
                            </VStack>
                        </Box>
                    );
                })}
            </VStack>
        </Box>
    );
};

// ── Implementation entry ────────────────────────────────────────────────────
const ImplementationEntry = ({ impl, campus, navigate }) => {
    const noActiveDocs = Boolean(impl.no_active_documents);
    const accent = noActiveDocs ? 'orange' : 'teal';
    const participants = impl.participants || [];
    const remediates = (impl.remediates_interfaces || []).map((i) => i.title).filter(Boolean).join(', ');
    return (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden"
            borderLeftWidth="3px" borderLeftColor={`${accent}.400`}
            className={impl.retired ? 'retired' : undefined}>
            {/* Header band — implementation type + name */}
            <Box bg={`${accent}.50`} borderBottomWidth="1px" borderColor="gray.200" px={4} py={2.5}>
                <HStack spacing={2.5} align="center" flexWrap="wrap">
                    <Badge colorScheme={accent} variant="solid" textTransform="uppercase" fontSize="2xs" borderRadius="md">
                        {impl.type}
                    </Badge>
                    <Heading as="h3" size="sm" color="gray.800" cursor="pointer"
                        _hover={{ color: 'teal.700', textDecoration: 'underline' }}
                        onClick={() => impl.unique_id && navigate(getImplementationURL(impl.type, impl.unique_id, campus))}>
                        {impl.title}
                    </Heading>
                    {impl.retired && (
                        <Badge
                            colorScheme="gray"
                            variant="solid"
                            fontSize="2xs"
                            title={impl.retired_note || 'This implementation has been retired'}
                        >
                            Retired{impl.retired_date ? ` ${impl.retired_date}` : ''}
                        </Badge>
                    )}
                    {noActiveDocs && (
                        <Badge colorScheme="orange" variant="solid" fontSize="2xs" title="Every document on this implementation is depreciated — no active documentation">
                            ⚠ No active documentation
                        </Badge>
                    )}
                </HStack>
            </Box>

            {/* Body */}
            <Box p={4}>
                {impl.description && <Text fontSize="xs" color="gray.700" mb={2}>{impl.description}</Text>}

                <Wrap spacing={2} mb={2}>
                    {impl.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {impl.owner.name}</Tag></WrapItem>}
                    {impl.accountable_working_group && <WrapItem><Tag size="sm" colorScheme="cyan" variant="subtle">Accountable: {impl.accountable_working_group}</Tag></WrapItem>}
                    {(impl.dimensions || []).map((d) => <WrapItem key={d.handle}><Tag size="sm" colorScheme="orange" variant="subtle">{d.name}</Tag></WrapItem>)}
                    {remediates && <WrapItem><Tag size="sm" colorScheme="blue" variant="outline">Remediates: {remediates}</Tag></WrapItem>}
                </Wrap>

                {participants.length > 0 && (
                    <Box mb={3}>
                        <SubLabel>Worked on by</SubLabel>
                        <Box mt={1}>
                            <DataTable
                                columns={['Person', 'Role', 'Note']}
                                rows={participants.map((p) => [
                                    <Text color="gray.800">{p.person?.name}</Text>,
                                    p.role_handle ? <Text>{p.role_handle.replace(/^role:/, '')}</Text> : <Dash />,
                                    p.note ? <Text fontStyle="italic" color="gray.600">{p.note}</Text> : <Dash />,
                                ])}
                            />
                        </Box>
                    </Box>
                )}

                <Box>
                    <SubLabel>Evidence</SubLabel>
                    <Box mt={1}>
                        <ArtifactTable
                            emptyText="No evidence recorded."
                            documents={impl.documents}
                            webpages={impl.webpages}
                            notes={impl.notes}
                            messages={impl.messages}
                            metrics={impl.metrics}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// ── TAAP entry ──────────────────────────────────────────────────────────────
const TaapEntry = ({ taap }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" overflow="hidden"
        borderLeftWidth="3px" borderLeftColor="orange.400">
        {/* Header band — TAAP + name */}
        <Box bg="orange.50" borderBottomWidth="1px" borderColor="gray.200" px={4} py={2.5}>
            <HStack spacing={2.5} align="center" flexWrap="wrap">
                <Badge colorScheme="orange" variant="solid" textTransform="uppercase" fontSize="2xs" borderRadius="md">TAAP</Badge>
                <Heading as="h3" size="sm" color="gray.800">{taap.title}</Heading>
                {taap.outcome && <Badge colorScheme="gray" fontSize="2xs">{taap.outcome.replace(/_/g, ' ')}</Badge>}
                {taap.active === false && <Badge colorScheme="red" fontSize="2xs">Inactive</Badge>}
            </HStack>
        </Box>

        {/* Body */}
        <Box p={4}>
            {taap.description && <Text fontSize="xs" color="gray.700" mb={2}>{taap.description}</Text>}
            <Wrap spacing={2} mb={3}>
                {taap.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {taap.owner.name}</Tag></WrapItem>}
                {(taap.signed_by || []).map((s) => <WrapItem key={s.unique_id}><Tag size="sm" colorScheme="green" variant="subtle">Signed: {s.name}</Tag></WrapItem>)}
                {(taap.covers_assets || []).map((a) => <WrapItem key={a.unique_id}><Tag size="sm" colorScheme="gray" variant="subtle">Covers: {a.title}</Tag></WrapItem>)}
                {taap.review_due && <WrapItem><Tag size="sm" colorScheme="yellow" variant="subtle">Review due {taap.review_due}</Tag></WrapItem>}
            </Wrap>
            <SubLabel>Evidence</SubLabel>
            <Box mt={1}>
                <ArtifactTable emptyText="No evidence recorded." documents={taap.documents} webpages={taap.webpages} notes={taap.notes} messages={taap.messages} />
            </Box>
        </Box>
    </Box>
);

// ── Main view ───────────────────────────────────────────────────────────────
const IndicatorReportView = ({ report }) => {
    const navigate = useNavigate();
    const { campus } = useParams();

    if (!report) return null;
    const {
        indicator, status, yse, people,
        implementations = [], taaps = [],
        assets = [], interfaces = [], tools = [], vendors = [],
        plans = [], accomplishments = [],
        notes = [], messages = [], metrics = [],
        admin_review_notes: adminReviewNotes = [],
    } = report;

    const openEdit = () => navigateToIndicator(navigate, indicator.composite_key, campus);

    const campusName = report.campus?.name || campus;
    const reviewComplete = yse?.administrative_review_complete;
    const completedBy = people?.admin_review_completed_by;
    const implementers = people?.implementers || [];
    const ictEmpty = !assets.length && !interfaces.length && !tools.length && !vendors.length;
    const hasCompanion = (indicator.examples_of_evidence?.length > 0)
        || indicator.established_example || indicator.managed_example || indicator.optimizing_example;

    return (
        <Box as="article" maxW="1400px" mx="auto" p={6} bg="gray.50" textAlign="left" sx={{ '@media print': { bg: 'white', p: 0, maxW: '100%' } }}>
            <style>{`@media print { .report-no-print { display: none !important; } }`}</style>

            <VStack align="stretch" spacing={4}>
                {/* Header */}
                <Box as="header">
                    <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
                        <Box minW={0}>
                            <HStack spacing={2} mb={1} flexWrap="wrap">
                                <Text fontFamily="mono" fontSize="lg" fontWeight="bold" color="gray.700">{indicator.composite_key}</Text>
                                <Box w="10px" h="10px" borderRadius="full" bg={WG_DOT[indicator.working_group] || 'gray.400'} />
                                <Text fontSize="sm" color="gray.600">{indicator.working_group}</Text>
                                <Text fontSize="sm" color="gray.600">· {campusName} · {report.year}</Text>
                            </HStack>
                            <Heading as="h1" size="md" color="gray.800" lineHeight="1.35">{indicator.success_indicator}</Heading>
                            <Text fontSize="sm" color="gray.600" mt={1}>Goal {indicator.goal_number} — {indicator.goal_name}</Text>
                        </Box>
                        <HStack className="report-no-print" spacing={2} flexShrink={0}>
                            <CopyIndicatorReportButton report={report} />
                            <Button size="sm" colorScheme="teal" onClick={() => window.print()}>Print report</Button>
                            <Button size="sm" variant="outline" colorScheme="teal" onClick={openEdit}>Edit</Button>
                        </HStack>
                    </HStack>
                </Box>

                {/* Status & Administrative Review */}
                <ReportSection id="sec-status" title="Status & Administrative Review">
                    <Box mb={3}>
                        <HStack spacing={3} align="center" flexWrap="wrap" mb={status?.previous_status_level ? 2 : 0}>
                            <SubLabel>Maturity</SubLabel>
                            <StatusLevelLadder level={status?.status_level || null} variant="full" />
                        </HStack>
                        {status?.previous_status_level && (
                            <HStack spacing={3} align="center" flexWrap="wrap">
                                <SubLabel>Year over year</SubLabel>
                                <StatusProgression previousStatusLevel={status.previous_status_level} currentStatusLevel={status?.status_level} />
                                <Text fontSize="2xs" color="gray.600">(prev → current)</Text>
                            </HStack>
                        )}
                    </Box>

                    <Wrap spacing={2} mb={3}>
                        {yse?.priority_level && <WrapItem><Tag size="sm" colorScheme="purple" variant="subtle">Priority: {yse.priority_level}</Tag></WrapItem>}
                        {yse?.worked_on_in_current_year && <WrapItem><Tag size="sm" colorScheme="green" variant="subtle">Worked on this year</Tag></WrapItem>}
                        {yse?.will_work_on_next_year && <WrapItem><Tag size="sm" colorScheme="blue" variant="subtle">Continuing next year</Tag></WrapItem>}
                        {yse?.ready_for_admin_review && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Ready for admin review</Tag></WrapItem>}
                        {yse?.documentation_status && <WrapItem><Tag size="sm" colorScheme="gray" variant="subtle">Docs: {yse.documentation_status}</Tag></WrapItem>}
                        {yse?.resources_status && <WrapItem><Tag size="sm" colorScheme="gray" variant="subtle">Resources: {yse.resources_status}</Tag></WrapItem>}
                        {yse?.implementation_plan_status && <WrapItem><Tag size="sm" colorScheme="gray" variant="subtle">Plan: {yse.implementation_plan_status}</Tag></WrapItem>}
                    </Wrap>

                    <Box>
                        <SubLabel>Administrative review</SubLabel>
                        <HStack spacing={2} mt={1} flexWrap="wrap">
                            <Badge colorScheme={reviewComplete ? 'green' : 'yellow'}>{reviewComplete ? 'Complete' : 'Pending'}</Badge>
                            {(yse?.administrative_review_completed_date || completedBy) && (
                                <Text fontSize="xs" color="gray.600">
                                    {yse?.administrative_review_completed_date ? `Completed ${yse.administrative_review_completed_date}` : 'Completed'}
                                    {completedBy ? ` by ${completedBy.name}` : ''}
                                </Text>
                            )}
                            {(people?.admin_reviewers || []).map((r) => (
                                <Tag key={r.unique_id} size="sm" variant="subtle" colorScheme="gray">{r.name}</Tag>
                            ))}
                        </HStack>
                        {yse?.admin_review_description && yse.admin_review_description !== 'No Review' && (
                            <Box mt={2} p={3} bg="blue.50" borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.400">
                                <Text fontSize="xs" color="gray.700">{yse.admin_review_description}</Text>
                            </Box>
                        )}
                        {adminReviewNotes.length > 0 && (
                            <Box mt={2}>
                                <DataTable
                                    columns={['Review note', 'Author', 'Date']}
                                    rows={adminReviewNotes.map((n) => [
                                        <Text whiteSpace="pre-wrap">{n.content}</Text>,
                                        n.created_by?.name ? <Text>{n.created_by.name}</Text> : <Dash />,
                                        n.dateCreated ? <Text fontSize="2xs" color="gray.600">{n.dateCreated}</Text> : <Dash />,
                                    ])}
                                />
                            </Box>
                        )}
                    </Box>

                    <MaturityCriteria currentStatusLevelName={status?.status_level} />
                </ReportSection>

                {/* Companion Guide — SI-level reference content (examples of evidence + level examples) */}
                {hasCompanion && (
                    <ReportSection id="sec-companion" title="Companion Guide">
                        <VStack align="stretch" spacing={3}>
                            {indicator.examples_of_evidence?.length > 0 && (
                                <Box>
                                    <SubLabel>Examples of evidence ({indicator.examples_of_evidence.length})</SubLabel>
                                    <VStack align="stretch" spacing={1} mt={1}>
                                        {indicator.examples_of_evidence.map((ex, i) => (
                                            <HStack key={i} align="start" spacing={2}>
                                                <Text fontSize="sm" color="gray.600">•</Text>
                                                <Text fontSize="sm" color="gray.700">{ex}</Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                            {indicator.established_example && (
                                <Box>
                                    <SubLabel>Example of an established level</SubLabel>
                                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" mt={1}>{indicator.established_example}</Text>
                                </Box>
                            )}
                            {indicator.managed_example && (
                                <Box>
                                    <SubLabel>Example of a managed level</SubLabel>
                                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" mt={1}>{indicator.managed_example}</Text>
                                </Box>
                            )}
                            {indicator.optimizing_example && (
                                <Box>
                                    <SubLabel>Example of an optimizing level</SubLabel>
                                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" mt={1}>{indicator.optimizing_example}</Text>
                                </Box>
                            )}
                        </VStack>
                    </ReportSection>
                )}

                {/* People */}
                <ReportSection id="sec-people" title="People" count={implementers.length}>
                    {implementers.length ? (
                        <DataTable
                            columns={['Name', 'Title', 'Roles', 'Email']}
                            rows={implementers.map((p) => [
                                <Text fontWeight="medium" color="gray.800">{p.name}</Text>,
                                p.title ? <Text>{p.title}</Text> : <Dash />,
                                (p.roles || []).length
                                    ? <Wrap spacing={1}>{p.roles.map((r) => <WrapItem key={r.handle}><Badge colorScheme="purple" variant="subtle" fontSize="2xs">{r.name}</Badge></WrapItem>)}</Wrap>
                                    : <Dash />,
                                p.email ? <Link href={`mailto:${p.email}`} color="teal.600">{p.email}</Link> : <Dash />,
                            ])}
                        />
                    ) : <Empty>No people assigned.</Empty>}
                </ReportSection>

                {/* Implementation Evidence */}
                <ReportSection id="sec-impl" title="Implementation Evidence" count={implementations.length}>
                    {implementations.length ? (
                        <VStack align="stretch" spacing={3}>
                            {implementations.map((impl) => (
                                <ImplementationEntry key={`${impl.type}-${impl.unique_id}`} impl={impl} campus={campus} navigate={navigate} />
                            ))}
                        </VStack>
                    ) : indicator.override_implementation_requirement ? (
                        <Empty>This indicator is exempt from implementation evidence.</Empty>
                    ) : (
                        <Empty>No implementation evidence recorded for this year.</Empty>
                    )}
                </ReportSection>

                {/* ICT Footprint */}
                <ReportSection id="sec-ict" title="ICT Footprint">
                    {ictEmpty ? (
                        <Empty>None recorded for this year.</Empty>
                    ) : (
                        <VStack align="stretch" spacing={4}>
                            {assets.length > 0 && (
                                <Box>
                                    <SubLabel>Assets ({assets.length})</SubLabel>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Asset', 'Class', 'Scope', 'Reached via', 'Description']}
                                            rows={assets.map((a) => [
                                                <Box><Text fontWeight="semibold" color="gray.800">{a.title}</Text><Text fontSize="2xs" color="gray.600" fontFamily="mono">{a.asset_identifier}</Text></Box>,
                                                a.asset_class ? <Text>{a.asset_class.replace(/_/g, ' ')}</Text> : <Dash />,
                                                a.scope ? <Text>{a.scope}</Text> : <Dash />,
                                                (a.reached_via || []).length ? <Text>{a.reached_via.join(', ')}</Text> : <Dash />,
                                                a.description ? <Text color="gray.600">{a.description}</Text> : <Dash />,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {interfaces.length > 0 && (
                                <Box>
                                    <SubLabel>Interfaces ({interfaces.length})</SubLabel>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Interface', 'Function', 'Coverage / Audience', 'Description']}
                                            rows={interfaces.map((i) => [
                                                <Box><Text fontWeight="semibold" color="gray.800">{i.title}</Text><Text fontSize="2xs" color="gray.600" fontFamily="mono">{i.interface_identifier}</Text></Box>,
                                                i.function ? <Text>{i.function}</Text> : <Dash />,
                                                [...(i.coverage_domains || []), ...(i.audience || [])].length ? <Text>{[...(i.coverage_domains || []), ...(i.audience || [])].join(', ')}</Text> : <Dash />,
                                                i.description ? <Text color="gray.600">{i.description}</Text> : <Dash />,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {tools.length > 0 && (
                                <Box>
                                    <SubLabel>Tools ({tools.length})</SubLabel>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Tool', 'Identifier', 'Description']}
                                            rows={tools.map((t) => [
                                                <Text fontWeight="semibold" color="gray.800">{t.title}</Text>,
                                                t.tool_identifier ? <Text fontFamily="mono" color="gray.600">{t.tool_identifier}</Text> : <Dash />,
                                                t.description ? <Text color="gray.600">{t.description}</Text> : <Dash />,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {vendors.length > 0 && (
                                <Box>
                                    <SubLabel>Vendors ({vendors.length})</SubLabel>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Vendor', 'Location', 'Contacts']}
                                            rows={vendors.map((v) => [
                                                <Text fontWeight="semibold" color="gray.800">{v.name}</Text>,
                                                v.location ? <Text>{v.location}</Text> : <Dash />,
                                                (v.sales_contact_email || v.technical_contact_email) ? (
                                                    <VStack align="stretch" spacing={0.5}>
                                                        {v.sales_contact_email && <Link href={`mailto:${v.sales_contact_email}`} color="teal.600" fontSize="2xs">Sales: {v.sales_contact_email}</Link>}
                                                        {v.technical_contact_email && <Link href={`mailto:${v.technical_contact_email}`} color="teal.600" fontSize="2xs">Tech: {v.technical_contact_email}</Link>}
                                                    </VStack>
                                                ) : <Dash />,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </VStack>
                    )}
                </ReportSection>

                {/* Temporary Alternate Access Plans */}
                <ReportSection id="sec-taap" title="Temporary Alternate Access Plans" count={taaps.length}>
                    {taaps.length ? (
                        <VStack align="stretch" spacing={3}>
                            {taaps.map((t) => <TaapEntry key={t.unique_id} taap={t} />)}
                        </VStack>
                    ) : <Empty>None recorded for this year.</Empty>}
                </ReportSection>

                {/* Plans & Accomplishments */}
                <ReportSection id="sec-plans" title="Plans & Accomplishments">
                    {(plans.length > 0 || accomplishments.length > 0) ? (
                        <VStack align="stretch" spacing={4}>
                            {plans.length > 0 && (
                                <Box>
                                    <SubLabel>Plans ({plans.length})</SubLabel>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Plan', 'Status', 'Description']}
                                            rows={plans.map((p) => [
                                                <HStack spacing={1.5} flexWrap="wrap">
                                                    <Text fontWeight="semibold" color="gray.800">{p.name}</Text>
                                                    {p.is_key_plan && <Badge colorScheme="purple" fontSize="2xs">Key</Badge>}
                                                    {p.is_campus_plan && <Badge colorScheme="green" fontSize="2xs">Campus plan</Badge>}
                                                </HStack>,
                                                p.plan_status ? <Badge colorScheme={getPlanStatusColorScheme(p)} fontSize="2xs">{getPlanStatusLabel(p)}</Badge> : <Dash />,
                                                p.description ? <Text color="gray.600">{p.description}</Text> : <Dash />,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {accomplishments.length > 0 && (
                                <Box>
                                    <SubLabel>Accomplishments ({accomplishments.length})</SubLabel>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Accomplishment', 'Description']}
                                            rows={accomplishments.map((a) => [
                                                <Text fontWeight="semibold" color="gray.800">{a.name}</Text>,
                                                a.description ? <Text color="gray.600">{a.description}</Text> : <Dash />,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                        </VStack>
                    ) : <Empty>None recorded for this year.</Empty>}
                </ReportSection>

                {/* YSE-level notes, messages & metrics */}
                <ReportSection id="sec-notes" title="Notes, Messages & Metrics">
                    <ArtifactTable emptyText="None recorded for this year." notes={notes} messages={messages} metrics={metrics} />
                </ReportSection>
            </VStack>
        </Box>
    );
};

export default IndicatorReportView;
