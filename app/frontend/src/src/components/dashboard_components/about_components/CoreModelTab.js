import React, { useContext } from 'react';
import { Box, Flex, List, ListItem, Spinner, Text, Badge } from '@chakra-ui/react';
import { StatusLevelContext } from '../../../context/StatusLevelContext';
import { getStatusColor } from '../../../services/utils/statusColors';
import { AboutPage, Card, Section, Para, CodePattern, TermDef, Figure } from './aboutPrimitives';
import coreChainDiagram from '../../../assets/img/core-chain.svg';
import maturityLadderDiagram from '../../../assets/img/maturity-ladder.svg';

// The conceptual spine of the graph: governance → goals → indicators →
// year-scoped evidence → status maturity. Status-level definitions render live
// from the database so this page never drifts from the real rubric.
function CoreModelTab() {
    const { statusLevels, loading: statusLoading, error: statusError } = useContext(StatusLevelContext);

    return (
        <AboutPage
            title="Core Model"
            lede="The spine of the knowledge graph: where requirements come from, how they become measurable, and how progress is recorded year by year."
        >
            <Card title="The chain, end to end">
                <Para>
                    Everything in the app hangs off one chain. Read it left to right as
                    &quot;why → what → how measured → what we did → how mature&quot;:
                </Para>
                <Figure
                    src={coreChainDiagram}
                    alt="The core chain: Governance informs a Goal, which is supported by a Success Indicator. YearSuccessEvidence, the hub, tracks that indicator one per year per campus, is evidenced by implementations, and carries a maturity Status Level. It is scoped by Academic Year and Campus."
                    caption="The core chain — requirements are shared and stable; evidence and status are re-recorded every year, per campus."
                    maxW="900px"
                />
                <CodePattern>
{`Law / Directive / Policy ──informs──▶ Goal ──supported_by──▶ SuccessIndicator
                                                                    ▲
                                              YearSuccessEvidence ──tracks
                                              │  (one per indicator × year × campus)
                                              ├──evidence_in_year──▶ AcademicYear
                                              ├──evidence_at_campus─▶ Campus
                                              ├──status_is──────────▶ StatusLevel
                                              ◀──is_evidence_for──── Process / Project /
                                                                     Procedure / Service / …`}
                </CodePattern>
                <Para>
                    Each layer is explained below. The key design choice: requirements (goals,
                    indicators) are <i>shared and stable</i>, while progress (evidence, status) is
                    <i> re-recorded every academic year per campus</i> — so history is never
                    overwritten, and year-over-year comparison is built in.
                </Para>
            </Card>

            <Card title="Governance — where requirements come from">
                <Para>
                    Governance nodes are the legal and policy sources that justify the work. They
                    inform Goals, which keeps every downstream effort traceable to a mandate.
                </Para>
                <TermDef term="Law">
                    A formal, enforceable rule from a legislative authority — the ADA, Section 504
                    and 508 of the Rehabilitation Act, the 2024 Title II rule.
                </TermDef>
                <TermDef term="Case">
                    A legal decision interpreting those laws; precedent that shapes what compliance
                    means in practice.
                </TermDef>
                <TermDef term="Directive">
                    An official instruction from an authority such as the CSU Chancellor&apos;s
                    Office — the ATI coded memoranda are the canonical examples.
                </TermDef>
                <TermDef term="External Policy">
                    A policy adopted outside the campus (CSU-wide or otherwise) that governs
                    accessibility decisions.
                </TermDef>
                <TermDef term="Guideline">
                    Recommended practices and technical standards used to evaluate accessibility —
                    WCAG above all. Components reference the specific guidelines they must satisfy.
                </TermDef>
                <TermDef term="Memo">
                    An internal written communication recording decisions or instructions about
                    accessibility practice.
                </TermDef>
            </Card>

            <Card title="Goals and Success Indicators — making it measurable">
                <Para>
                    A <b>Goal</b> is a broad objective within a working group&apos;s priority area
                    (e.g. &quot;ongoing monitoring of web accessibility&quot;). Each goal is broken
                    into <b>Success Indicators</b> — the specific, numbered benchmarks the
                    Chancellor&apos;s Office actually measures (e.g. indicator 5.2 under web).
                    Indicators are the unit everything else attaches to.
                </Para>
                <Para>
                    Indicators carry a <b>composite key</b> of their goal number and working-group
                    abbreviation (<code>web</code>, <code>ins</code>, <code>pro</code>):
                </Para>
                <CodePattern>{`composite_key:  "5.2-web"      (indicator 5.2, Web working group)`}</CodePattern>
                <Para>
                    Indicators can be marked <i>removed</i> when the Chancellor&apos;s Office
                    retires them; they stay in the graph so historical evidence keeps its meaning.
                </Para>
            </Card>

            <Card title="YearSuccessEvidence (YSE) — the heart of the system">
                <Para>
                    A <b>YearSuccessEvidence</b> node is the campus&apos;s answer to one question:
                    <i> &quot;Where does this campus stand on this indicator, this year?&quot;</i>{' '}
                    There is exactly one YSE per (success indicator × academic year × campus), with
                    identity baked into its identifier:
                </Para>
                <CodePattern>{`year_identifier:  "2025-2026-5.2-web-sfsu"
                   └─ year ─┘ └indicator┘ └campus┘`}</CodePattern>
                <Para>Everything about that year&apos;s standing hangs off the YSE:</Para>
                <List spacing={1} pl={5} styleType="disc" fontSize="sm" color="gray.700" mb={2}>
                    <ListItem>
                        a <b>status level</b> (the maturity rung — see below);
                    </ListItem>
                    <ListItem>
                        <b>implementations</b> that serve as evidence (processes, projects,
                        procedures, services, policies, TAAPs — via <code>is_evidence_for</code>);
                    </ListItem>
                    <ListItem>
                        <b>annotations</b> — notes, messages, and metrics giving context;
                    </ListItem>
                    <ListItem>
                        <b>people</b> — who is assigned to implement, who may review, who completed
                        administrative review;
                    </ListItem>
                    <ListItem>
                        <b>working flags</b> — worked on this year, planned for next year, ready
                        for admin review — plus a priority level (Top / High / Neutral / Low).
                    </ListItem>
                </List>
                <Para>
                    Because YSEs are per-year, the same indicator can be &quot;Initiated&quot; in
                    2024-2025 and &quot;Defined&quot; in 2025-2026 without either record losing
                    fidelity. The campus-plan view uses this to show previous-year status next to
                    the current one.
                </Para>
            </Card>

            <Card title="Status Levels — the maturity ladder">
                <Para>
                    Status is a six-rung <b>capability maturity</b> ladder, not a done/not-done
                    flag. A rung is claimed only when its requirements are met — and per
                    Chancellor&apos;s Office direction, statuses are set conservatively. Each rung
                    defines what must be true of <i>procedures</i>, <i>resources</i>, and{' '}
                    <i>documentation</i> at that level. The definitions below are live from the
                    database — they are the actual rubric used at review time.
                </Para>
                <Figure
                    src={maturityLadderDiagram}
                    alt="A six-rung ascending staircase on a red-to-green ramp: Not Started (0), Initiated (1), Defined (2), Established (3, the baseline target), Managed (4), Optimizing (5). Status is a position on a journey, not a done/not-done flag."
                    caption="Status is a six-rung capability-maturity ladder — Established is the baseline target; every rung requires evidence."
                    maxW="820px"
                />
                {statusLoading ? (
                    <Flex align="center" gap={2} py={3}>
                        <Spinner size="sm" color="teal.500" />
                        <Text fontSize="sm" color="gray.600">Loading status level definitions…</Text>
                    </Flex>
                ) : statusError ? (
                    <Text fontSize="sm" color="red.600">{statusError}</Text>
                ) : (
                    <Box>
                        {[...statusLevels]
                            .sort((a, b) => a.status_value - b.status_value)
                            .map((level) => {
                                const categories = [
                                    { name: 'Procedures', descriptions: level.procedure_descriptions, requirements: level.procedure_requirements },
                                    { name: 'Resources', descriptions: level.resource_descriptions, requirements: level.resource_requirements },
                                    { name: 'Documentation', descriptions: level.documentation_descriptions, requirements: level.documentation_requirements },
                                    { name: 'Documentation Evidence', descriptions: level.documentation_evidence_descriptions, requirements: level.documentation_evidence_requirements },
                                ];
                                return (
                                    <Box
                                        key={level.unique_id || level.status_level}
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        borderLeftWidth="4px"
                                        borderLeftColor={getStatusColor(level.status_level)}
                                        borderRadius="md"
                                        p={3}
                                        mb={3}
                                    >
                                        <Flex align="center" gap={2} mb={2}>
                                            <Text fontSize="sm" fontWeight="bold" color="gray.800">
                                                {level.status_level}
                                            </Text>
                                            <Badge fontSize="2xs" colorScheme="gray">
                                                level {level.status_value}
                                            </Badge>
                                        </Flex>
                                        {categories.map((category) => {
                                            const hasContent =
                                                (category.descriptions && category.descriptions.length > 0) ||
                                                (category.requirements && category.requirements.length > 0);
                                            if (!hasContent) return null;
                                            return (
                                                <Box key={category.name} mb={2}>
                                                    <Text
                                                        fontSize="2xs"
                                                        fontWeight="semibold"
                                                        color="teal.700"
                                                        textTransform="uppercase"
                                                        letterSpacing="wide"
                                                    >
                                                        {category.name}
                                                    </Text>
                                                    <List spacing={0.5} pl={4} styleType="disc" fontSize="xs" color="gray.700">
                                                        {(category.descriptions || []).map((item, i) => (
                                                            <ListItem key={`d-${i}`}>{item.description}</ListItem>
                                                        ))}
                                                        {(category.requirements || []).map((item, i) => (
                                                            <ListItem key={`r-${i}`}>
                                                                <b>Required:</b> {item.requirement_description}
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>
                                            );
                                        })}
                                        {level.notes?.length > 0 && (
                                            <Box>
                                                <Text
                                                    fontSize="2xs"
                                                    fontWeight="semibold"
                                                    color="teal.700"
                                                    textTransform="uppercase"
                                                    letterSpacing="wide"
                                                >
                                                    Notes
                                                </Text>
                                                <List spacing={0.5} pl={4} styleType="disc" fontSize="xs" color="gray.700">
                                                    {level.notes.map((note, i) => (
                                                        <ListItem key={i}>{note.content}</ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                    </Box>
                )}
            </Card>

            <Card title="Scoping nodes — year, campus, working group">
                <Section title="AcademicYear">
                    <Para>
                        The annual reporting cycle (&quot;2025-2026&quot;). Evidence, plans,
                        metrics, and accomplishments are all scoped to one. The year selector in
                        the header controls which slice of the graph you are looking at.
                    </Para>
                </Section>
                <Section title="Campus">
                    <Para>
                        The institution scope. Evidence and plans are per-campus; reference data
                        (indicators, status levels, working groups) is shared across campuses. The
                        campus selector in the header (and the URL) controls this scope.
                    </Para>
                </Section>
                <Section title="ATIWorkingGroup">
                    <Para>
                        The three committees — Web, Instructional Materials, Procurement — that own
                        the priority areas. People participate in working groups; goals belong to
                        them; and implementations and interfaces can name an{' '}
                        <i>accountable working group</i>, which is deliberately an assignment (an
                        edge), never part of a thing&apos;s identity.
                    </Para>
                </Section>
            </Card>

            <Card title="Composite identifiers — how identity works">
                <Para>
                    Nodes whose identity spans several facts get a single composite identifier
                    with a unique index, built by shared helpers so the format never drifts. The
                    identifier is <b>immutable</b> — renaming a coordinate means creating a new
                    node, which is intentional: it keeps history honest.
                </Para>
                <CodePattern>
{`YearSuccessEvidence   2025-2026-5.2-web-sfsu          year + indicator + campus
CampusPlan            2025-2026-sfsu                   year + campus
WorkingGroupPlan      2025-2026-sfsu-web               year + campus + group
Asset                 canvas-sfsu                      title + scope locus
Interface             canvas-sfsu--course-shells--teaching-and-learning--course-home
Component             <interface_identifier>--video-player
Tool                  pope-tech`}
                </CodePattern>
            </Card>
        </AboutPage>
    );
}

export default CoreModelTab;
