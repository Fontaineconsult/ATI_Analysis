import React from 'react';
import { List, ListItem, Alert, AlertIcon } from '@chakra-ui/react';
import { AboutPage, Card, Section, Para, CodePattern, TermDef } from './aboutPrimitives';

// What counts as evidence, the seven implementation categories, the five
// documentation artifact types, and the review workflow.
function EvidenceImplementationsTab() {
    return (
        <AboutPage
            title="Evidence & Implementations"
            lede="Evidence is concrete work, classified by what kind of thing it is. This page explains the categories, what does and does not count, and how evidence is reviewed."
        >
            <Card title="What counts as evidence">
                <Para>
                    An indicator&apos;s evidence is the set of <b>implementation nodes</b> linked
                    to its YearSuccessEvidence. An implementation is something the campus actually
                    operates or produced — a process, a project, a service — not a statement of
                    intent. The same implementation can be evidence for several indicators, and
                    can persist across years (a captioning service keeps being evidence every year
                    it runs).
                </Para>
                <CodePattern>
{`Process / Project / Procedure / Service /
InternalPolicy / Guidance / Tracking / TAAP  ──is_evidence_for──▶  YearSuccessEvidence`}
                </CodePattern>
                <Alert status="info" borderRadius="md" fontSize="sm" mb={2}>
                    <AlertIcon />
                    Notes and messages attached to an indicator are context, not evidence — they
                    record observations and communications but do not count toward documented
                    implementation evidence. Documents, webpages, and metrics attached to an
                    implementation are its supporting documentation.
                </Alert>
            </Card>

            <Card title="The seven implementation categories">
                <Para>
                    Every implementation is classified by what kind of thing it is. The
                    distinctions matter because maturity reads differently for each — a one-off
                    project is weaker evidence of an &quot;Established&quot; capability than an
                    ongoing process.
                </Para>
                <TermDef term="Process" badge="ongoing">
                    A repeatable workflow with no endpoint that operationalizes an accessibility
                    commitment — e.g. a standing web-scanning and repair cycle. Often documented
                    step-by-step and may include constituent procedures.
                </TermDef>
                <TermDef term="Project" badge="temporary">
                    A focused effort with a start, an end, and a deliverable — e.g. a one-time
                    PDF accessibility review of a site. Strong evidence of initiative; weaker
                    evidence of sustained capability.
                </TermDef>
                <TermDef term="Procedure" badge="instructions">
                    Documented step-by-step instructions for performing a task consistently —
                    e.g. how to run an accessibility check before publishing. Procedures
                    standardize work and are often included inside processes and services.
                </TermDef>
                <TermDef term="Service" badge="ongoing">
                    An ongoing capability offered on demand — e.g. an accessible media conversion
                    service or a document remediation desk. Continuously available, usually
                    staffed.
                </TermDef>
                <TermDef term="Internal Policy" badge="mandate">
                    Formal rules the institution itself adopted, creating enforceable internal
                    obligations — distinct from external policy, which lives in the governance
                    layer.
                </TermDef>
                <TermDef term="Guidance" badge="advisory">
                    Practical advisory material — tips, FAQs, presentations, how-tos — that helps
                    people do accessible work but does not mandate it. Guidance can reference the
                    processes, procedures, and services it explains.
                </TermDef>
                <TermDef term="Tracking" badge="monitoring">
                    A system or method for monitoring the progress of accessibility work itself —
                    dashboards, trackers, periodic audits.
                </TermDef>
                <Para mt={2}>
                    Two related node types round out the picture: a <b>Plan</b> is intended future
                    work (it furthers goals and can be attached to a campus plan), and an{' '}
                    <b>Accomplishment</b> is a documented achievement in a given year. Plans become
                    evidence when they are executed and the resulting work is recorded as an
                    implementation.
                </Para>
            </Card>

            <Card title="What hangs off an implementation">
                <List spacing={1} pl={5} styleType="disc" fontSize="sm" color="gray.700" mb={2}>
                    <ListItem>
                        <b>Owner</b> — the person answerable for it (<i>owned_by</i>).
                    </ListItem>
                    <ListItem>
                        <b>Participants</b> — the working team, each tagged with the role they play
                        (developer, captioner, QA specialist, …).
                    </ListItem>
                    <ListItem>
                        <b>Accountable working group</b> — which committee answers for the work.
                        Deliberately separate from ownership: a person owns it, a committee is
                        accountable.
                    </ListItem>
                    <ListItem>
                        <b>Dimensions</b> — classification against the W3C Accessibility Maturity
                        Model&apos;s seven dimensions (Communications, Governance &amp; Oversight,
                        ICT Development Lifecycle, Knowledge &amp; Skills, Personnel, Procurement,
                        Support), orthogonal to working groups.
                    </ListItem>
                    <ListItem>
                        <b>Supporting documentation</b> — documents, webpages, notes, and messages
                        (see below).
                    </ListItem>
                    <ListItem>
                        <b>Remediation targets</b> — the interfaces an implementation remediates,
                        and the tools it uses (see Assets &amp; Interfaces).
                    </ListItem>
                </List>
            </Card>

            <Card title="Documentation artifacts">
                <Para>
                    Five artifact types document implementations and annotate evidence. Each can be
                    marked deprecated (kept for history, excluded from current reporting) and
                    flagged for inclusion in reports.
                </Para>
                <TermDef term="Document" badge="evidence">
                    A file — policy text, report, meeting minutes, training material. Identified by
                    content hash, with a file path or URI.
                </TermDef>
                <TermDef term="Webpage" badge="evidence">
                    A live URL — a service page, a published procedure, a public guidance page. Can
                    be marked &quot;no longer exists&quot; when link rot strikes.
                </TermDef>
                <TermDef term="Metric" badge="evidence">
                    A quantitative measurement — scan counts, remediation totals, training
                    attendance — stored as a single value or a tabular/graphical/descriptive data
                    set, scoped to an academic year.
                </TermDef>
                <TermDef term="Note" badge="context only">
                    A free-form annotation: observations, planning thoughts, meeting highlights.
                    Notes are where committee members record anything useful — but they do not
                    count as implementation evidence.
                </TermDef>
                <TermDef term="Message" badge="context only">
                    A captured communication — email, memo, announcement — preserving who said what
                    about the ATI. Context, not evidence.
                </TermDef>
                <Section title="Year scoping">
                    <Para>
                        A documentation link can be <i>included in</i> or <i>excluded from</i>{' '}
                        specific academic years. This lets one long-lived implementation show
                        exactly the documentation that was relevant in each reporting year, instead
                        of accumulating an undifferentiated pile.
                    </Para>
                </Section>
            </Card>

            <Card title="The review workflow">
                <Para>
                    Each YSE moves through a lightweight annual review so that the status the
                    campus reports is one someone has actually defended:
                </Para>
                <List spacing={1} pl={5} styleType="decimal" fontSize="sm" color="gray.700" mb={2}>
                    <ListItem>
                        Implementers (assigned via <i>implements</i>) attach evidence, annotations,
                        and documentation through the year, and set the working flags — worked on
                        this year, planned for next year.
                    </ListItem>
                    <ListItem>
                        When the record is complete, it is marked <b>ready for admin review</b>.
                    </ListItem>
                    <ListItem>
                        A designated reviewer (a person with approval rights, assigned via{' '}
                        <i>can_be_reviewed_by</i>) examines the evidence against the status-level
                        rubric, writes a review description, and marks{' '}
                        <b>administrative review complete</b> — recording who reviewed and when.
                    </ListItem>
                    <ListItem>
                        At rollover, review flags reset and the cycle begins again for the new
                        year.
                    </ListItem>
                </List>
            </Card>
        </AboutPage>
    );
}

export default EvidenceImplementationsTab;
