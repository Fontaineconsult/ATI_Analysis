import React, { useContext, useMemo } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Link,
    Text,
    Tag,
    VStack,
    StackDivider,
    useToast,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { getImplementationURL, navigateToIndicator } from '../../../services/utils/tools';
import { StatusLevelContext } from '../../../context/StatusLevelContext';
import CopyIndicatorReportButton from './CopyIndicatorReportButton';
import { SubLabel, SubHeading, Empty, Dash, DataTable } from './blocks/reportPrimitives';
import ReportSection from './blocks/ReportSection';
import PeopleTable from './blocks/PeopleTable';
import { LevelBadge, RequirementCell } from './blocks/coveragePrimitives';
import ArtifactTable from './blocks/ArtifactTable';
import PlansAccomplishments from './blocks/PlansAccomplishments';
import StatusSummary from './blocks/StatusSummary';
import CommunityOfPractice from './blocks/CommunityOfPractice';
import IndicatorIdentity from './blocks/IndicatorIdentity';
import TaapEntry from './blocks/TaapEntry';
import AssetsTable from './blocks/AssetsTable';
import ImplementationCard from './blocks/ImplementationCard';

/*
 * The single-indicator "View" report — a flat, single-column, single-page rendering of ALL
 * evidence for one YearSuccessEvidence (indicator × year × campus). Every section always
 * renders (with an explicit empty state) so the report reads as a complete checklist; the
 * only interactions are links and the Copy/Print/Edit actions. Print = the report.
 *
 * All record lists render as subtle tables (thin row rules, muted headers, no heavy chrome).
 * Semantic document: one <h1> (the indicator), <h2> per section, <h3> per implementation entry.
 */

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
        <Box>
            <SubHeading>Expected evidence at “{level.status_level}”</SubHeading>
            <VStack align="stretch" spacing={3} mt={2}>
                {RUBRIC_CATEGORIES.map((cat) => {
                    const descs = level[cat.descKey] || [];
                    const reqs = level[cat.reqKey] || [];
                    if (!descs.length && !reqs.length) return null;
                    return (
                        <Box key={cat.name}>
                            <Text fontSize="2xs" fontWeight="semibold" color="gray.700" mb={1}>{cat.name}</Text>
                            <VStack align="stretch" spacing={0.5} pl={2}>
                                {descs.map((d) => <Text key={d.unique_id} fontSize="xs" color="gray.700">• {d.description}</Text>)}
                                {reqs.map((r) => <Text key={r.unique_id} fontSize="xs" color="gray.700">• {r.requirement_description}</Text>)}
                            </VStack>
                        </Box>
                    );
                })}
            </VStack>
        </Box>
    );
};

// ── Companion-bar coverage ──────────────────────────────────────────────────
// Requirement-first view of the bar: is each part answered, and by what. The claims
// themselves live on each is_evidence_for rel; the report inverts them so a reviewer
// reads the standard and sees what is missing, rather than reading the work and
// inferring what it covers.
const EvidenceCoverage = ({ coverage }) => {
    const requirements = coverage?.requirements || [];
    if (!requirements.length) return null;

    const { scored_total: scoredTotal = 0, scored_satisfied: scoredSatisfied = 0 } =
        coverage.summary || {};
    // Position and Budget are normally answered by role holdings and allocation records,
    // not by an implementation. They stay in the table — a reviewer still needs to see
    // them — but out of the ratio, which would otherwise report a gap against work that
    // was never the right kind of evidence.
    const hasUnscored = requirements.some((r) => !r.implementation_evidenced);

    const rows = requirements.map((r) => [
        <LevelBadge level={r.level} />,
        <Box><RequirementCell requirement={r.requirement} element={r.element} /></Box>,
        r.satisfied ? (
            <Badge colorScheme="green" variant="solid" fontSize="2xs">Satisfied</Badge>
        ) : (
            <Badge
                colorScheme={r.implementation_evidenced ? 'orange' : 'gray'}
                variant={r.implementation_evidenced ? 'solid' : 'outline'}
                fontSize="2xs"
                title={r.implementation_evidenced
                    ? 'No implementation claims this requirement'
                    : 'Normally evidenced by position descriptions or allocation records rather than by an implementation'}
            >
                Not satisfied
            </Badge>
        ),
        r.satisfied_by?.length ? (
            <VStack align="stretch" spacing={0.5}>
                {r.satisfied_by.map((im) => (
                    <Text key={`${im.type}-${im.unique_id}`} fontSize="2xs" color="gray.700">
                        {im.title}{im.retired ? ' (retired)' : ''}
                    </Text>
                ))}
            </VStack>
        ) : <Dash />,
    ]);

    return (
        <Box mt={4}>
            <SubHeading>Companion bar coverage</SubHeading>
            <Text fontSize="2xs" color="gray.700" mt={1} mb={2}>
                {scoredSatisfied} of {scoredTotal} requirements answered by an implementation.
                {hasUnscored && ' Position and Budget are listed but not counted — they are'
                    + ' normally evidenced by position descriptions and allocation records'
                    + ' rather than by an implementation.'}
            </Text>
            <DataTable columns={['Level', 'Requirement', 'State', 'Satisfied by']} rows={rows} />
        </Box>
    );
};

// ── Implementation entry ────────────────────────────────────────────────────
// ── TAAP entry ──────────────────────────────────────────────────────────────
// ── Main view ───────────────────────────────────────────────────────────────
const IndicatorReportView = ({ report }) => {
    const navigate = useNavigate();
    const { campus } = useParams();
    const toast = useToast();

    if (!report) return null;
    // handle -> requirement, so an implementation card's badge can name what it claims
    // without carrying the text on every link.
    const requirementsByHandle = Object.fromEntries(
        (report.evidence_coverage?.requirements || []).map((r) => [r.handle, r])
    );
    const {
        indicator, status, yse, people,
        implementations = [], taaps = [],
        assets = [], interfaces = [], tools = [], vendors = [],
        plans = [], accomplishments = [],
        notes = [], messages = [], metrics = [],
        admin_review_notes: adminReviewNotes = [],
        recommendations = [],
        concerns = [],
        community_stakeholders: communityStakeholders = [],
    } = report;



    const openEdit = () => navigateToIndicator(navigate, indicator.composite_key, campus);

    const campusName = report.campus?.name || campus;
    const reviewComplete = yse?.administrative_review_complete;
    const completedBy = people?.admin_review_completed_by;
    const implementers = people?.implementers || [];
    // DERIVED unit portfolio behind the internally-controlled evidence — part of
    // the ICT Footprint section, distinguished by RELATIONSHIP (who answers for
    // the asset) from the remediation-reached rollup above it.
    const footprint = report.ict_footprint || { units: [], people: [], assets: [] };
    const footprintAssets = footprint.assets || [];
    const remediatedIds = new Set(assets.map((a) => a.asset_identifier));
    const ictEmpty = !assets.length && !interfaces.length && !tools.length && !vendors.length
        && !footprintAssets.length;

    return (
        <Box as="article" maxW="1400px" mx="auto" p={6} bg="gray.50" textAlign="left" sx={{ '@media print': { bg: 'white', p: 0, maxW: '100%' } }}>
            <style>{`@media print { .report-no-print { display: none !important; } }`}</style>

            <VStack align="stretch" spacing={4}>
                {/* Header — identity via the shared block; the action buttons stay
                    page-owned (Copy/Print/Edit and the .report-no-print class are the
                    report's own concerns). */}
                <IndicatorIdentity
                    indicator={indicator}
                    campusName={campusName}
                    year={report.year}
                    action={
                        <HStack className="report-no-print" spacing={2} flexShrink={0}>
                                <CopyIndicatorReportButton report={report} />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="teal"
                                    title="Copy the shareable read-only public page for this report"
                                    onClick={() => {
                                        // Derive the public URL from the composite key ("1.1-web").
                                        const [numbers, suffix] = (indicator.composite_key || '').split('-');
                                        const [goalNum, siNum] = (numbers || '').split('.');
                                        const seg = { web: 'web', ins: 'instructional-materials', pro: 'procurement' }[suffix];
                                        if (!seg || !goalNum || !siNum) return;
                                        const url = `${window.location.origin}/ati/reports/public/${campus}/${report.year}/${seg}/${goalNum}/${siNum}`;
                                        navigator.clipboard.writeText(url);
                                        toast({
                                            title: 'Public link copied!',
                                            description: 'Shareable read-only report link copied to clipboard.',
                                            status: 'success', duration: 2000, isClosable: true,
                                        });
                                    }}
                                >
                                    Copy public link
                                </Button>
                                <Button size="sm" colorScheme="teal" onClick={() => window.print()}>Print report</Button>
                                <Button size="sm" variant="outline" colorScheme="teal" onClick={openEdit}>Edit</Button>
                            </HStack>
                    }
                />

                {/* Status & Administrative Review — five separated blocks:
                    maturity+flags · community of practice · administrative review ·
                    recommendations · expected evidence. Named subsections carry real h3s. */}
                <ReportSection id="sec-status" title="Status & Administrative Review">
                    <VStack align="stretch" spacing={5} divider={<StackDivider borderColor="gray.100" />}>
                        <Box>
                            <StatusSummary status={status} yse={yse} />
                        </Box>

                        <Box>
                            <CommunityOfPractice implementations={implementations} stakeholders={communityStakeholders} />
                        </Box>

                        <Box>
                            <SubHeading>Administrative review</SubHeading>
                            <HStack spacing={2} mt={2} flexWrap="wrap">
                                <Badge colorScheme={reviewComplete ? 'green' : 'yellow'}>{reviewComplete ? 'Complete' : 'Pending'}</Badge>
                                {(yse?.administrative_review_completed_date || completedBy) && (
                                    <Text fontSize="xs" color="gray.700">
                                        {yse?.administrative_review_completed_date ? `Completed ${yse.administrative_review_completed_date}` : 'Completed'}
                                        {completedBy ? ` by ${completedBy.name}` : ''}
                                    </Text>
                                )}
                            </HStack>
                            {yse?.admin_review_description && yse.admin_review_description !== 'No Review' && (
                                <Box mt={3}>
                                    <SubLabel>Evidence summary</SubLabel>
                                    <Text fontSize="2xs" color="gray.700" mt={0.5}>
                                        The ATI coordinator&apos;s account of the year&apos;s evidence.
                                    </Text>
                                    <Box mt={1} p={3} bg="blue.50" borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.400">
                                        <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap">{yse.admin_review_description}</Text>
                                    </Box>
                                </Box>
                            )}
                            {adminReviewNotes.length > 0 && (
                                <Box mt={3}>
                                    <SubLabel>Administrative review notes</SubLabel>
                                    <Text fontSize="2xs" color="gray.700" mt={0.5} mb={1}>
                                        Management-level observations recorded during review.
                                    </Text>
                                    <DataTable
                                        columns={['Review note', 'Author', 'Date']}
                                        rows={adminReviewNotes.map((n) => [
                                            <Text whiteSpace="pre-wrap">{n.content}</Text>,
                                            n.created_by?.name ? <Text>{n.created_by.name}</Text> : <Dash />,
                                            n.dateCreated ? <Text fontSize="2xs" color="gray.700">{n.dateCreated}</Text> : <Dash />,
                                        ])}
                                    />
                                </Box>
                            )}
                        </Box>

                        {concerns.filter((c) => c.status !== 'dismissed').length > 0 && (
                            <Box>
                                <SubHeading>Concerns ({concerns.filter((c) => c.status !== 'dismissed').length})</SubHeading>
                                <Box mt={2}>
                                    <DataTable
                                        columns={['Status', 'Concern', 'Raised', 'Outcome']}
                                        rows={concerns
                                            .filter((c) => c.status !== 'dismissed')
                                            .sort((a, b) => (a.status === 'open' ? -1 : 1) - (b.status === 'open' ? -1 : 1))
                                            .map((c) => [
                                                <Tag size="sm"
                                                     colorScheme={c.status === 'open' ? 'red' : 'green'}
                                                     variant="subtle">{c.status}</Tag>,
                                                <Box><Text fontWeight="medium" color="gray.800">{c.concern}</Text>{c.detail && <Text fontSize="2xs" color="gray.700" whiteSpace="pre-wrap">{c.detail}</Text>}</Box>,
                                                <Text fontSize="2xs">{[c.date_raised, c.raised_by?.name && `by ${c.raised_by.name}`].filter(Boolean).join(' ')}</Text>,
                                                c.became
                                                    ? <Text color="gray.700">Became {c.became.kind}: {c.became.text}</Text>
                                                    : (c.resolution ? <Text color="gray.700" whiteSpace="pre-wrap">{c.resolution}</Text> : <Dash />),
                                            ])}
                                    />
                                </Box>
                            </Box>
                        )}

                        {recommendations.filter((r) => r.status !== 'dismissed').length > 0 && (
                            <Box>
                                <SubHeading>Recommendations ({recommendations.filter((r) => r.status !== 'dismissed').length})</SubHeading>
                                <Box mt={2}>
                                    <DataTable
                                        columns={['Status', 'Recommendation', 'Raised', 'Resolution']}
                                        rows={recommendations
                                            .filter((r) => r.status !== 'dismissed')
                                            .sort((a, b) => (a.status === 'open' ? -1 : 1) - (b.status === 'open' ? -1 : 1))
                                            .map((r) => [
                                                <Tag size="sm"
                                                     colorScheme={r.status === 'open' ? 'orange' : 'green'}
                                                     variant="subtle">{r.status}</Tag>,
                                                <Box><Text fontWeight="medium" color="gray.800">{r.recommendation}</Text>{r.detail && <Text fontSize="2xs" color="gray.700" whiteSpace="pre-wrap">{r.detail}</Text>}</Box>,
                                                <Text fontSize="2xs">{[r.date_created, r.created_by?.name && `by ${r.created_by.name}`].filter(Boolean).join(' ')}</Text>,
                                                r.resolution ? <Text color="gray.700" whiteSpace="pre-wrap">{r.resolution}</Text> : <Dash />,
                                            ])}
                                    />
                                </Box>
                            </Box>
                        )}

                        <MaturityCriteria currentStatusLevelName={status?.status_level} />
                        <EvidenceCoverage coverage={report.evidence_coverage} />
                    </VStack>
                </ReportSection>

                {/* The companion guide's prose is no longer rendered here. It is the same
                    content as the coverage table under "Expected evidence at", which states
                    each requirement AND whether anything answers it — so the prose was the
                    weaker copy of a section already on the page. The *_example strings remain
                    on the indicator as the authored source, and are still edited in Settings. */}

                {/* People */}
                <ReportSection id="sec-people" title="People" count={implementers.length}>
                    <PeopleTable implementers={implementers} />
                </ReportSection>

                {/* Implementation Evidence */}
                <ReportSection id="sec-impl" title="Implementation Evidence" count={implementations.length}>
                    {implementations.length ? (
                        <VStack align="stretch" spacing={3}>
                            {implementations.length > 0 && implementations.every((impl) => impl.retired) && (
                                <Badge
                                    alignSelf="flex-start"
                                    colorScheme="orange"
                                    variant="solid"
                                    fontSize="2xs"
                                    borderRadius="full"
                                    px={2}
                                    title="Every implementation linked to this indicator is retired — no active work addresses it"
                                >
                                    ⚠ All implementations retired
                                </Badge>
                            )}
                            {/* Retired sink to the bottom — ordered by get_indicator_report,
                                so the in-app report, public page and export all agree. */}
                            {implementations.map((impl) => (
                                <ImplementationCard key={`${impl.type}-${impl.unique_id}`} impl={impl}
                                    requirementsByHandle={requirementsByHandle}
                                    onOpenImplementation={(im) => navigate(getImplementationURL(im.type, im.unique_id, campus))} />
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
                            {footprintAssets.length > 0 && (
                                <Box>
                                    <SubLabel>
                                        Unit portfolio ({footprintAssets.length})
                                        {(footprint.units || []).length > 0 && ` — ${footprint.units.map((u) => u.name).join(', ')}`}
                                    </SubLabel>
                                    <Text fontSize="2xs" color="gray.700" mt={0.5}>
                                        The §508 register of the responsible unit(s) behind this indicator&apos;s
                                        internally-controlled evidence. &quot;No work wired&quot; = answered for, but
                                        untouched by this indicator&apos;s implementations.
                                    </Text>
                                    <Box mt={1}>
                                        <DataTable
                                            columns={['Asset', 'Scope', 'Stewarded by', 'Work here']}
                                            rows={footprintAssets.map((a) => [
                                                <Box><Text fontWeight="semibold" color="gray.800">{a.title}</Text><Text fontSize="2xs" color="gray.700" fontFamily="mono">{a.asset_identifier}</Text></Box>,
                                                a.scope ? <Text>{a.scope}</Text> : <Dash />,
                                                <VStack align="stretch" spacing={0.5}>
                                                    {(a.stewards || []).map((s) => (
                                                        <Text key={s.name} fontSize="2xs">{s.name} · {s.capacities.join(', ')}</Text>
                                                    ))}
                                                </VStack>,
                                                remediatedIds.has(a.asset_identifier)
                                                    ? <Tag size="sm" colorScheme="green" variant="subtle">remediated</Tag>
                                                    : <Tag size="sm" colorScheme="orange" variant="subtle">no work wired</Tag>,
                                            ])}
                                        />
                                    </Box>
                                </Box>
                            )}
                            {assets.length > 0 && (
                                <Box>
                                    <SubLabel>Assets ({assets.length})</SubLabel>
                                    <Box mt={1}>
                                        <AssetsTable assets={assets} />
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
                                                <Box><Text fontWeight="semibold" color="gray.800">{i.title}</Text><Text fontSize="2xs" color="gray.700" fontFamily="mono">{i.interface_identifier}</Text></Box>,
                                                i.function ? <Text>{i.function}</Text> : <Dash />,
                                                [...(i.coverage_domains || []), ...(i.audience || [])].length ? <Text>{[...(i.coverage_domains || []), ...(i.audience || [])].join(', ')}</Text> : <Dash />,
                                                i.description ? <Text color="gray.700" whiteSpace="pre-wrap">{i.description}</Text> : <Dash />,
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
                                                t.tool_identifier ? <Text fontFamily="mono" color="gray.700">{t.tool_identifier}</Text> : <Dash />,
                                                t.description ? <Text color="gray.700" whiteSpace="pre-wrap">{t.description}</Text> : <Dash />,
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
                                                        {v.sales_contact_email && <Link href={`mailto:${v.sales_contact_email}`} color="teal.700" fontSize="2xs">Sales: {v.sales_contact_email}</Link>}
                                                        {v.technical_contact_email && <Link href={`mailto:${v.technical_contact_email}`} color="teal.700" fontSize="2xs">Tech: {v.technical_contact_email}</Link>}
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
                    <PlansAccomplishments plans={plans} accomplishments={accomplishments} />
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
