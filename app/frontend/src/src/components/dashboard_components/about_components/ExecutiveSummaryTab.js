import React from 'react';
import { Box, List, ListItem, Text } from '@chakra-ui/react';
import { AboutPage, Card, Para, VocabTable } from './aboutPrimitives';

// Executive-leadership framing of the system, distilled from
// app/database/ontology/executive-summary.md: lead with the compliance
// system-of-record + maturity-engine value proposition (the obligations
// leadership already feels), and position the knowledge/reasoning layer as
// what makes that system of record trustworthy — not as the headline.

// Familiar enterprise categories the system is usually compared to, and what
// each one captures or misses. Rendered via VocabTable for the canon look.
const CATEGORY_LABELS = {
    'system-of-record': 'System of Record (SoR)',
    'grc': 'GRC / Compliance Management',
    'maturity': 'Maturity / Capability Management',
    'kms': 'Knowledge Management (KMS)',
    'ppm': 'Program / Portfolio Management (PPM)',
};

const CATEGORY_NOTES = {
    'system-of-record':
        'The closest fit. The authoritative source for the campus’s accessibility ' +
        'compliance posture — when there is a question about where we stand, the ' +
        'answer lives here, definitively.',
    'grc':
        'Captures the obligations-evidence-accountability tracking, but generic GRC ' +
        'platforms cannot encode the ATI framework, the legal reasoning, or the ' +
        'maturity model that make the data defensible.',
    'maturity':
        'Captures the trajectory spine: status is a six-rung capability-maturity ' +
        'ladder (CSU ATI framework, grounded in the W3C Accessibility Maturity ' +
        'Model), so progress reads as organizational capability, not checkboxes.',
    'kms':
        'Captures the institutional-memory layer — the framework, principles, and ' +
        'determinations are encoded so they persist beyond any individual’s tenure.',
    'ppm':
        'Captures plan and implementation tracking per working group and year, but ' +
        'misses the compliance grounding and the knowledge layer entirely.',
};

function ExecutiveSummaryTab() {
    return (
        <AboutPage
            title="Executive Summary"
            lede="What this system is in executive terms, and the value proposition it represents for campus leadership."
        >
            <Card title="In one sentence">
                <Text
                    fontSize="md"
                    color="gray.800"
                    fontStyle="italic"
                    borderLeftWidth="3px"
                    borderLeftColor="teal.500"
                    pl={4}
                    py={1}
                    mb={2}
                >
                    An accessibility governance and compliance system of record that
                    encodes not just what we&apos;ve done, but the legal obligations,
                    institutional framework, and organizational maturity behind it.
                </Text>
                <Para>
                    &quot;System of record&quot; is the operative term: this is the
                    authoritative source of truth for whether and how the campus meets
                    its accessibility obligations. When an auditor, the Chancellor&apos;s
                    Office, or campus counsel asks where we stand, the answer lives
                    here — definitively, with the evidence and reasoning attached.
                </Para>
            </Card>

            <Card title="The value proposition">
                <List spacing={2} pl={5} styleType="decimal" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Audit-readiness as standing infrastructure.</b> The 2024 ADA
                        Title II rule makes WCAG 2.1 AA a dated legal obligation
                        (compliance required by 2026&ndash;2027), and OCR exposure is
                        real. This system maintains, year over year, the linkage from
                        each legal obligation to the campus work that answers it — so
                        audit response is a report, not a scramble.
                    </ListItem>
                    <ListItem>
                        <b>A maturity engine, not a checklist.</b> Progress is measured
                        on a capability-maturity ladder (Not Started &rarr; Optimizing)
                        per success indicator, per year. Leadership sees trajectory —
                        is the campus moving up the maturity curve? — which is the
                        narrative the Chancellor&apos;s Office measures and the one
                        that justifies sustained investment.
                    </ListItem>
                    <ListItem>
                        <b>Accountability made visible.</b> Who stewards each system is
                        recorded separately from who can fix it, so the riskiest
                        situation an institution faces — a known-inaccessible system
                        nobody is resourced to remediate — surfaces as an explicit
                        signal instead of being discovered in a complaint.
                    </ListItem>
                    <ListItem>
                        <b>Institutional memory that survives turnover.</b> The
                        framework, determinations, and rationale behind every status
                        call are encoded in the system, not in any one coordinator&apos;s
                        head. The compliance posture stays defensible through staff
                        transitions.
                    </ListItem>
                </List>
            </Card>

            <Card title="How it maps to familiar categories">
                <Para>
                    The system is genuinely three things fused — a compliance system of
                    record, a knowledge-management layer, and a maturity/program-management
                    engine. Each familiar enterprise category captures one facet:
                </Para>
                <VocabTable
                    vocab={CATEGORY_LABELS}
                    notes={CATEGORY_NOTES}
                    keyHeader="Category"
                    labelHeader="Term"
                    notesHeader="What it captures here"
                />
            </Card>

            <Card title="Why this is built, not bought">
                <Para>
                    The natural question is &quot;why not procure a commercial GRC
                    platform?&quot; The answer is that this system doesn&apos;t just
                    store compliance data — <b>it reasons in the institution&apos;s own
                    terms</b>. It encodes the CSU ATI framework, the legal grounding
                    (ADA, Sections 504/508, Title II), the W3C accessibility maturity
                    model, and the campus&apos;s own model of systems, interfaces, and
                    responsibility. Generic tools carry the data; this carries the
                    reasoning that makes the data defensible.
                </Para>
                <Para mb={0}>
                    That knowledge layer is not the headline — reliable compliance
                    infrastructure is. But it is what makes the system of record
                    trustworthy and durable: every status, every determination, and
                    every responsibility assignment traces back to the obligation and
                    the principle that justify it.
                </Para>
            </Card>

            <Card title="What to ask of it" bg="teal.50" borderColor="teal.100">
                <Para mb={0}>
                    A useful executive test: pick any obligation the campus carries —
                    the Title II deadline, a procurement requirement, a captioning
                    mandate — and ask <i>what are we doing about it, how mature is that
                    capability, who owns it, and where is the evidence?</i> This system
                    exists so that all four answers come back, current, from one place.
                </Para>
            </Card>

            <Box fontSize="xs" color="gray.500" px={1}>
                For the operational view of what the application does day-to-day, see
                the Overview tab; for the underlying data model, see Core Model.
            </Box>
        </AboutPage>
    );
}

export default ExecutiveSummaryTab;
