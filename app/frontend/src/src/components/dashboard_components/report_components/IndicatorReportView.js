import React, { useContext, useMemo } from 'react';
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    Link,
    Tag,
    Text,
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
 * only interactions are links and the Print/Edit actions. Print = the report.
 *
 * Semantic document: one <h1> (the indicator), <h2> per section, <h3> per implementation entry.
 */

// ── Primitives ──────────────────────────────────────────────────────────────
const SubLabel = ({ children }) => (
    <Text fontSize="2xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wide">
        {children}
    </Text>
);

const Empty = ({ children }) => (
    <Text fontSize="sm" color="gray.500" fontStyle="italic">{children}</Text>
);

/** A titled white section with an <h2> heading and `aria-labelledby` for landmark nav. */
const ReportSection = ({ id, title, count, action, children }) => (
    <Box
        as="section"
        aria-labelledby={id}
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        boxShadow="sm"
        p={5}
    >
        <HStack justify="space-between" align="baseline" mb={3}>
            <Heading as="h2" id={id} size="sm" color="teal.700">
                {title}{typeof count === 'number' ? ` (${count})` : ''}
            </Heading>
            {action}
        </HStack>
        {children}
    </Box>
);

// Working-group identity dot (matches the campus-plan accents).
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

const fileMeta = (file) => {
    if (!file) return null;
    const kb = file.size != null ? `${Math.max(1, Math.round(file.size / 1024))} KB` : null;
    return [file.uploaded_date, kb].filter(Boolean).join(' · ') || null;
};

/**
 * One artifact row: a typed tag, then either the name-as-link (FILE/URL/WEB) or descriptive
 * text (GONE struck / NOTE / MSG / METRIC) with an optional secondary attachment link and meta.
 */
const ArtifactRow = ({ tag, label, href, attachmentHref, struck, meta, badges, ariaLabel }) => {
    const cfg = ARTIFACT_TAG[tag] || { scheme: 'gray', variant: 'subtle' };
    return (
        <HStack align="baseline" spacing={2} flexWrap="wrap">
            <Badge colorScheme={cfg.scheme} variant={cfg.variant} fontSize="2xs" minW="44px" textAlign="center" flexShrink={0}>
                {tag}
            </Badge>
            {href ? (
                <Link href={href} isExternal color="teal.600" fontSize="xs">{label}</Link>
            ) : (
                <Text as={struck ? 's' : undefined} fontSize="xs" color="gray.700" aria-label={ariaLabel}>{label}</Text>
            )}
            {attachmentHref && (
                <Link href={attachmentHref} isExternal color="teal.600" fontSize="2xs">📎 attachment</Link>
            )}
            {meta && <Text fontSize="2xs" color="gray.500">{meta}</Text>}
            {badges}
        </HStack>
    );
};

/** Flat artifact list for an implementation / TAAP / the YSE level. Renders in a fixed order. */
const ArtifactList = ({ documents = [], webpages = [], notes = [], messages = [], metrics = [] }) => {
    const rows = [];

    documents.forEach((d) => {
        rows.push(
            <ArtifactRow
                key={`doc-${d.unique_id}`}
                tag={d.file?.download_url ? 'FILE' : 'URL'}
                label={d.name || 'Document'}
                href={resolveArtifactHref(d)}
                meta={fileMeta(d.file)}
                badges={(
                    <>
                        {(d.is_administrative_review_documentation === 'True' || d.is_administrative_review_documentation === true) &&
                            <Badge colorScheme="purple" fontSize="2xs">Admin Review</Badge>}
                        {(d.is_milestone_and_measures_documentation === 'True' || d.is_milestone_and_measures_documentation === true) &&
                            <Badge colorScheme="blue" fontSize="2xs">Milestones</Badge>}
                        {d.depreciated && <Badge colorScheme="orange" fontSize="2xs">Deprecated</Badge>}
                    </>
                )}
            />
        );
    });

    webpages.forEach((w) => {
        const gone = !!w.no_longer_exists;
        rows.push(
            <ArtifactRow
                key={`web-${w.unique_id}`}
                tag={gone ? 'GONE' : 'WEB'}
                label={w.name || w.url}
                href={gone ? null : w.url}
                struck={gone}
                ariaLabel={gone ? `${w.name || w.url} (no longer available)` : undefined}
                badges={w.depreciated ? <Badge colorScheme="orange" fontSize="2xs">Deprecated</Badge> : null}
            />
        );
    });

    notes.forEach((n) => {
        rows.push(
            <ArtifactRow key={`note-${n.unique_id}`} tag="NOTE" label={n.content} meta={n.dateCreated || n.date_created || null} />
        );
    });

    messages.forEach((m) => {
        rows.push(
            <ArtifactRow
                key={`msg-${m.unique_id}`}
                tag="MSG"
                label={m.content || m.name}
                attachmentHref={resolveArtifactHref(m)}
                meta={m.date_created || null}
            />
        );
    });

    metrics.forEach((m) => {
        const extra = [m.comment, m.academic_year].filter(Boolean).join(' · ') || null;
        rows.push(
            <ArtifactRow
                key={`met-${m.unique_id || m.composite_key}`}
                tag="METRIC"
                label={`${m.name}: ${m.single_value ?? '—'}`}
                attachmentHref={resolveArtifactHref(m)}
                meta={extra}
            />
        );
    });

    if (!rows.length) return null;
    return <VStack align="stretch" spacing={1.5} pl={1} mt={2}>{rows}</VStack>;
};

// Admin-review notes carry an author (created_by) the artifact rows don't show.
const AdminNoteList = ({ items = [] }) => (
    <VStack align="stretch" spacing={2} mt={2}>
        {items.map((n) => (
            <Box key={n.unique_id} p={2} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap">{n.content}</Text>
                {(n.created_by?.name || n.dateCreated) && (
                    <Text fontSize="2xs" color="gray.500" mt={1}>
                        {n.created_by?.name ? `— ${n.created_by.name}` : ''}
                        {n.created_by?.name && n.dateCreated ? ' · ' : ''}
                        {n.dateCreated || ''}
                    </Text>
                )}
            </Box>
        ))}
    </VStack>
);

// ── Inline maturity rubric (the retired right-rail panel, folded in flat) ────
// Mirrors EvidenceQualityPanel's category config; rendered as a flat block under Status
// instead of a sticky side rail. Degrades to nothing when StatusLevelContext is absent.
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
    // Server-computed over ALL of the implementation's documents, so it agrees with the
    // implementations view even when the report's year filter hides the deprecated docs.
    const noActiveDocs = Boolean(impl.no_active_documents);
    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            bg="gray.50"
            p={4}
            borderLeftWidth="3px"
            borderLeftColor={noActiveDocs ? 'orange.400' : 'teal.400'}
        >
            <HStack spacing={2} mb={1} flexWrap="wrap">
                <Badge colorScheme="teal" textTransform="uppercase" fontSize="2xs">{impl.type}</Badge>
                <Heading
                    as="h3"
                    size="xs"
                    color="gray.800"
                    cursor="pointer"
                    _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                    onClick={() => impl.unique_id && navigate(getImplementationURL(impl.type, impl.unique_id, campus))}
                >
                    {impl.title}
                </Heading>
                {noActiveDocs && (
                    <Badge colorScheme="orange" variant="solid" fontSize="2xs" title="Every document on this implementation is depreciated — no active documentation">
                        ⚠ No active documentation
                    </Badge>
                )}
            </HStack>
            {impl.description && <Text fontSize="xs" color="gray.700" mb={2}>{impl.description}</Text>}

            {/* Accountability + classification */}
            <Wrap spacing={2} mb={2}>
                {impl.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {impl.owner.name}</Tag></WrapItem>}
                {impl.accountable_working_group && (
                    <WrapItem><Tag size="sm" colorScheme="cyan" variant="subtle">Accountable: {impl.accountable_working_group}</Tag></WrapItem>
                )}
                {(impl.dimensions || []).map((d) => (
                    <WrapItem key={d.handle}><Tag size="sm" colorScheme="orange" variant="subtle">{d.name}</Tag></WrapItem>
                ))}
            </Wrap>

            {/* Participant team + notes */}
            {impl.participants?.length > 0 && (
                <Box mb={2}>
                    <SubLabel>Worked on by</SubLabel>
                    <Wrap spacing={1} mt={1}>
                        {impl.participants.map((p, i) => (
                            <WrapItem key={`${p.person?.unique_id}-${i}`}>
                                <Tag size="sm" colorScheme="purple" variant="subtle">
                                    {p.person?.name}{p.role_handle ? ` · ${p.role_handle.replace(/^role:/, '')}` : ''}
                                </Tag>
                            </WrapItem>
                        ))}
                    </Wrap>
                    {impl.participants.some((p) => p.note) && (
                        <VStack align="stretch" spacing={0.5} mt={1}>
                            {impl.participants.filter((p) => p.note).map((p, i) => (
                                <Text key={i} fontSize="2xs" color="gray.600" fontStyle="italic">{p.person?.name}: “{p.note}”</Text>
                            ))}
                        </VStack>
                    )}
                </Box>
            )}

            {/* Remediated interfaces */}
            {impl.remediates_interfaces?.length > 0 && (
                <Box mb={2}>
                    <SubLabel>Remediates</SubLabel>
                    <Wrap spacing={1} mt={1}>
                        {impl.remediates_interfaces.map((iface) => (
                            <WrapItem key={iface.unique_id}><Tag size="sm" colorScheme="blue" variant="outline">{iface.title}</Tag></WrapItem>
                        ))}
                    </Wrap>
                </Box>
            )}

            <ArtifactList
                documents={impl.documents}
                webpages={impl.webpages}
                notes={impl.notes}
                messages={impl.messages}
                metrics={impl.metrics}
            />
        </Box>
    );
};

// ── ICT footprint rows ──────────────────────────────────────────────────────
const REACHED_VIA_SCHEME = { remediated: 'green', interface: 'blue', tool: 'purple' };

const AssetRow = ({ asset }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <HStack spacing={2} flexWrap="wrap" mb={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{asset.title}</Text>
            {asset.scope && <Badge colorScheme="gray" fontSize="2xs">{asset.scope}</Badge>}
            {asset.asset_class && <Badge colorScheme="teal" fontSize="2xs">{asset.asset_class.replace(/_/g, ' ')}</Badge>}
            {(asset.reached_via || []).map((v) => (
                <Badge key={v} colorScheme={REACHED_VIA_SCHEME[v] || 'gray'} variant="subtle" fontSize="2xs">via {v}</Badge>
            ))}
        </HStack>
        <Text fontSize="2xs" color="gray.400" fontFamily="mono">{asset.asset_identifier}</Text>
        {asset.description && <Text fontSize="xs" color="gray.600" mt={1}>{asset.description}</Text>}
    </Box>
);

const InterfaceRow = ({ iface }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <HStack spacing={2} flexWrap="wrap" mb={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{iface.title}</Text>
            {iface.function && <Badge colorScheme="blue" fontSize="2xs">{iface.function}</Badge>}
            {iface.provenance && <Badge colorScheme="gray" fontSize="2xs">{iface.provenance}</Badge>}
        </HStack>
        <Text fontSize="2xs" color="gray.400" fontFamily="mono">{iface.interface_identifier}</Text>
        {iface.description && <Text fontSize="xs" color="gray.600" mt={1}>{iface.description}</Text>}
        {(iface.audience?.length > 0 || iface.coverage_domains?.length > 0) && (
            <Wrap spacing={1} mt={2}>
                {(iface.coverage_domains || []).map((c) => <WrapItem key={c}><Tag size="sm" variant="subtle" colorScheme="cyan">{c}</Tag></WrapItem>)}
                {(iface.audience || []).map((a) => <WrapItem key={a}><Tag size="sm" variant="subtle" colorScheme="gray">{a}</Tag></WrapItem>)}
            </Wrap>
        )}
    </Box>
);

const ToolRow = ({ tool }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{tool.title}</Text>
            {tool.tool_identifier && <Text fontSize="2xs" color="gray.400" fontFamily="mono">{tool.tool_identifier}</Text>}
        </HStack>
        {tool.description && <Text fontSize="xs" color="gray.600" mt={1}>{tool.description}</Text>}
    </Box>
);

const VendorRow = ({ vendor }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.800">{vendor.name}</Text>
        {vendor.location && <Text fontSize="xs" color="gray.600">{vendor.location}</Text>}
        {(vendor.sales_contact_email || vendor.technical_contact_email) && (
            <HStack spacing={3} mt={1} flexWrap="wrap">
                {vendor.sales_contact_email && (
                    <Link href={`mailto:${vendor.sales_contact_email}`} fontSize="2xs" color="teal.600">Sales: {vendor.sales_contact_email}</Link>
                )}
                {vendor.technical_contact_email && (
                    <Link href={`mailto:${vendor.technical_contact_email}`} fontSize="2xs" color="teal.600">Tech: {vendor.technical_contact_email}</Link>
                )}
            </HStack>
        )}
    </Box>
);

const IctSubList = ({ title, count, children }) => (
    <Box>
        <SubLabel>{title} ({count})</SubLabel>
        <VStack align="stretch" spacing={2} mt={2}>{children}</VStack>
    </Box>
);

// ── TAAP entry ──────────────────────────────────────────────────────────────
const TaapEntry = ({ taap }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50" p={4} borderLeftWidth="3px" borderLeftColor="orange.400">
        <HStack spacing={2} mb={1} flexWrap="wrap">
            <Badge colorScheme="orange" textTransform="uppercase" fontSize="2xs">TAAP</Badge>
            <Heading as="h3" size="xs" color="gray.800">{taap.title}</Heading>
            {taap.outcome && <Badge colorScheme="gray" fontSize="2xs">{taap.outcome.replace(/_/g, ' ')}</Badge>}
            {taap.active === false && <Badge colorScheme="red" fontSize="2xs">Inactive</Badge>}
        </HStack>
        {taap.description && <Text fontSize="xs" color="gray.700" mb={2}>{taap.description}</Text>}
        <Wrap spacing={2} mb={2}>
            {taap.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {taap.owner.name}</Tag></WrapItem>}
            {(taap.signed_by || []).map((s) => <WrapItem key={s.unique_id}><Tag size="sm" colorScheme="green" variant="subtle">Signed: {s.name}</Tag></WrapItem>)}
            {(taap.covers_assets || []).map((a) => <WrapItem key={a.unique_id}><Tag size="sm" colorScheme="gray" variant="subtle">Covers: {a.title}</Tag></WrapItem>)}
            {taap.review_due && <WrapItem><Tag size="sm" colorScheme="yellow" variant="subtle">Review due {taap.review_due}</Tag></WrapItem>}
        </Wrap>
        <ArtifactList documents={taap.documents} webpages={taap.webpages} notes={taap.notes} messages={taap.messages} />
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
    const ictEmpty = !assets.length && !interfaces.length && !tools.length && !vendors.length;

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
                                <Text fontSize="sm" color="gray.400">· {campusName} · {report.year}</Text>
                            </HStack>
                            <Heading as="h1" size="md" color="gray.800" lineHeight="1.35">{indicator.success_indicator}</Heading>
                            <Text fontSize="sm" color="gray.500" mt={1}>Goal {indicator.goal_number} — {indicator.goal_name}</Text>
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
                                <Text fontSize="2xs" color="gray.400">(prev → current)</Text>
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
                                <Text fontSize="xs" color="gray.500">
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
                        {adminReviewNotes.length > 0 && <AdminNoteList items={adminReviewNotes} />}
                    </Box>

                    <MaturityCriteria currentStatusLevelName={status?.status_level} />
                </ReportSection>

                {/* People */}
                <ReportSection id="sec-people" title="People">
                    {people?.implementers?.length ? (
                        <VStack align="stretch" spacing={2}>
                            {people.implementers.map((p) => (
                                <HStack key={p.unique_id} spacing={2} flexWrap="wrap">
                                    <Text fontSize="sm" color="gray.800" fontWeight="medium">{p.name}</Text>
                                    {p.title && <Text fontSize="xs" color="gray.500">{p.title}</Text>}
                                    {(p.roles || []).map((r) => (
                                        <Badge key={r.handle} colorScheme="purple" variant="subtle" fontSize="2xs">{r.name}</Badge>
                                    ))}
                                    {p.email && (
                                        <Link href={`mailto:${p.email}`} fontSize="xs" color="teal.600">{p.email}</Link>
                                    )}
                                </HStack>
                            ))}
                        </VStack>
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
                                <IctSubList title="Assets" count={assets.length}>
                                    {assets.map((a) => <AssetRow key={a.unique_id} asset={a} />)}
                                </IctSubList>
                            )}
                            {interfaces.length > 0 && (
                                <IctSubList title="Interfaces" count={interfaces.length}>
                                    {interfaces.map((i) => <InterfaceRow key={i.unique_id} iface={i} />)}
                                </IctSubList>
                            )}
                            {tools.length > 0 && (
                                <IctSubList title="Tools" count={tools.length}>
                                    {tools.map((t) => <ToolRow key={t.unique_id} tool={t} />)}
                                </IctSubList>
                            )}
                            {vendors.length > 0 && (
                                <IctSubList title="Vendors" count={vendors.length}>
                                    {vendors.map((v) => <VendorRow key={v.unique_id} vendor={v} />)}
                                </IctSubList>
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
                        <VStack align="stretch" spacing={3}>
                            {plans.length > 0 && (
                                <Box>
                                    <SubLabel>Plans ({plans.length})</SubLabel>
                                    <VStack align="stretch" spacing={2} mt={2}>
                                        {plans.map((p) => (
                                            <Box key={p.unique_id} p={3} bg="gray.50" borderRadius="md" borderLeftWidth="3px" borderLeftColor="teal.300">
                                                <HStack spacing={2} mb={1} flexWrap="wrap">
                                                    <Text fontSize="sm" fontWeight="semibold" color="gray.800">{p.name}</Text>
                                                    {p.plan_status && <Badge colorScheme={getPlanStatusColorScheme(p)} fontSize="2xs">{getPlanStatusLabel(p)}</Badge>}
                                                    {p.is_key_plan && <Badge colorScheme="purple" fontSize="2xs">Key</Badge>}
                                                    {p.is_campus_plan && <Badge colorScheme="green" fontSize="2xs">Campus plan</Badge>}
                                                </HStack>
                                                {p.description && <Text fontSize="xs" color="gray.700">{p.description}</Text>}
                                            </Box>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                            {accomplishments.length > 0 && (
                                <Box>
                                    <SubLabel>Accomplishments ({accomplishments.length})</SubLabel>
                                    <VStack align="stretch" spacing={2} mt={2}>
                                        {accomplishments.map((a) => (
                                            <Box key={a.unique_id} p={3} bg="gray.50" borderRadius="md" borderLeftWidth="3px" borderLeftColor="blue.300">
                                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">{a.name}</Text>
                                                {a.description && <Text fontSize="xs" color="gray.700">{a.description}</Text>}
                                            </Box>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    ) : <Empty>None recorded for this year.</Empty>}
                </ReportSection>

                {/* YSE-level notes, messages & metrics */}
                <ReportSection id="sec-notes" title="Notes, Messages & Metrics">
                    {(notes.length > 0 || messages.length > 0 || metrics.length > 0) ? (
                        <ArtifactList notes={notes} messages={messages} metrics={metrics} />
                    ) : <Empty>None recorded for this year.</Empty>}
                </ReportSection>
            </VStack>
        </Box>
    );
};

export default IndicatorReportView;
