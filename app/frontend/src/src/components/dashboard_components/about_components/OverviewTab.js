import React from 'react';
import { List, ListItem, Box } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Link } from '@chakra-ui/react';
import { AboutPage, Card, Section, Para } from './aboutPrimitives';

function OverviewTab() {
    const { campus } = useParams();
    const prefix = campus ? `/${campus}` : '';

    return (
        <AboutPage
            title="About this Application"
            lede="What the Accessible Technology Initiative is, what this application does, and how to think about the information inside it."
        >
            <Card title="The Accessible Technology Initiative (ATI)">
                <Para>
                    The Accessible Technology Initiative is the CSU&apos;s commitment to providing
                    equal access to information technology and services for all students, staff,
                    faculty, and the general public, as mandated by the ADA, Section 504, and
                    Section 508 of the Rehabilitation Act. The 2024 Title II rule (which adopts
                    WCAG 2.1 AA as the technical standard for public entities) raises the stakes:
                    accessibility is no longer aspirational policy but a concrete, dated legal
                    obligation.
                </Para>
                <Para>
                    Each campus is required to appoint an executive sponsor, maintain an ATI
                    committee, develop annual implementation plans, report progress, and work
                    toward a baseline maturity of &quot;Established&quot; on key success
                    indicators. The work is organized into three priority areas, each owned by a
                    working group:
                </Para>
                <List spacing={1} pl={5} styleType="disc" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Web</b> — evaluating and repairing inaccessible web content, ensuring
                        new development complies with Section 508 / WCAG, and monitoring over time.
                    </ListItem>
                    <ListItem>
                        <b>Instructional Materials</b> — timely adoption of accessible course
                        materials, LMS and course-site accessibility, and faculty support.
                    </ListItem>
                    <ListItem>
                        <b>Procurement</b> — Section 508 compliance for ICT purchases, equally
                        effective alternate access planning, and training for procurement
                        stakeholders.
                    </ListItem>
                </List>
            </Card>

            <Card title="What this application is">
                <Para>
                    This application is the campus&apos;s <b>institutional memory for accessibility
                    work</b>: a knowledge graph that records what the law and the Chancellor&apos;s
                    Office require, what the campus has actually built in response, how mature each
                    capability is, and who is responsible for what. It is a backstage working store
                    — the audiences who need the information (committees, executives, the
                    Chancellor&apos;s Office) receive tailored reports and exports generated from
                    it, rather than browsing it raw.
                </Para>
                <Para>It exists to answer four kinds of questions:</Para>
                <List spacing={1} pl={5} styleType="decimal" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Compliance</b> — for each success indicator the Chancellor&apos;s Office
                        measures, what evidence do we have this year, and at what maturity level?
                    </ListItem>
                    <ListItem>
                        <b>Accountability</b> — who stewards each system, who fixes problems when
                        they arise, and where does responsibility rise to the institution because
                        nobody closer can act?
                    </ListItem>
                    <ListItem>
                        <b>Planning</b> — what did each working group prioritize this year, what is
                        the trajectory of that work, and what was accomplished?
                    </ListItem>
                    <ListItem>
                        <b>Gaps</b> — which indicators have no evidence, which assets have no
                        remediation path, which interfaces nobody has claimed. The interface is
                        deliberately <i>diagnostic-first</i>: counts turn red at zero, warnings
                        surface before detail.
                    </ListItem>
                </List>
            </Card>

            <Card title="How to think about it">
                <Para>
                    The database is a <b>graph</b>, not a set of tables. Every meaningful thing —
                    a law, a goal, a success indicator, a year of evidence, a process, a PDF, a
                    person, a Canvas instance — is a <b>node</b>, and the relationships between
                    them are first-class <b>edges</b>. That structure is the point: it lets the
                    app trace a chain like <i>this federal rule informed this goal, which is
                    measured by this indicator, which this year&apos;s evidence tracks, which this
                    captioning service implements, which this person owns</i> — and equally to
                    notice when a link in that chain is missing.
                </Para>
                <Para>Three framing ideas recur everywhere:</Para>
                <List spacing={2} pl={5} styleType="disc" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Evidence is annual and campus-scoped.</b> Progress is recorded per
                        success indicator, per academic year, per campus, in a node called
                        YearSuccessEvidence (YSE). Each year the slate rolls forward and the
                        campus re-demonstrates where it stands.
                    </ListItem>
                    <ListItem>
                        <b>Maturity, not checkboxes.</b> Status uses a six-rung capability-maturity
                        ladder (Not Started → Initiated → Defined → Established → Managed →
                        Optimizing). The honest question is not &quot;did we do something?&quot;
                        but &quot;is this a defined, managed, improving capability?&quot; — and
                        statuses are deliberately set conservatively to reflect reality.
                    </ListItem>
                    <ListItem>
                        <b>Responsibility is modeled, not assumed.</b> Who <i>stewards</i> a system
                        is recorded separately from who <i>remediates</i> it, so the gap between
                        the two — a stewarded asset nobody can fix — becomes a visible signal that
                        responsibility has risen to the institution.
                    </ListItem>
                </List>
            </Card>

            <Card title="Where things live">
                <Section title="Dashboard">
                    <Para>
                        The day-to-day workspace, scoped by the campus and academic year selected
                        in the header. Browse each working group&apos;s goals and success
                        indicators, attach evidence and documentation, review status levels, and
                        manage the annual <Link as={RouterLink} to={`${prefix}/dashboard/campus-plan`} color="teal.600" textDecoration="underline">Campus Plan</Link>.
                        Reports and the copy-ready report builder live here too.
                    </Para>
                </Section>
                <Section title="ATI Explorer">
                    <Para>
                        The structural side of the graph: implementations, plans, people,
                        governance sources, and the asset inventory (assets, interfaces,
                        components, TAAPs, tools, vendors). Use it to maintain the entities that
                        evidence points at.
                    </Para>
                </Section>
                <Section title="About (this area)">
                    <Para>
                        Reference material: the data model, what each category means, and recipes
                        for adding data. Start with <b>Core Model</b> if you are new — everything
                        else builds on it.
                    </Para>
                </Section>
            </Card>

            <Card title="The annual rhythm">
                <Box fontSize="sm" color="gray.700">
                    <List spacing={1} pl={5} styleType="decimal">
                        <ListItem>
                            <b>Rollover</b> — at the start of an academic year, evidence nodes are
                            duplicated forward for every campus, campus plans are stubbed, and
                            administrative review flags reset.
                        </ListItem>
                        <ListItem>
                            <b>Prioritize</b> — each working group selects the success indicators
                            it will focus on this year and records its rationale in the campus
                            plan.
                        </ListItem>
                        <ListItem>
                            <b>Work and document</b> — implementations are created or extended,
                            evidence and documentation accumulate on each indicator&apos;s YSE,
                            and dated progress updates record trajectory.
                        </ListItem>
                        <ListItem>
                            <b>Review</b> — designated reviewers complete administrative review of
                            each YSE, confirming the status level and evidence are defensible.
                        </ListItem>
                        <ListItem>
                            <b>Report</b> — reports and exports are generated for the committee,
                            campus leadership, and the Chancellor&apos;s Office.
                        </ListItem>
                    </List>
                </Box>
            </Card>
        </AboutPage>
    );
}

export default OverviewTab;
