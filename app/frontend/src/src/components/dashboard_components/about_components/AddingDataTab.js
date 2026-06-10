import React from 'react';
import { Alert, AlertIcon, List, ListItem, Link } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AboutPage, Card, Section, Para } from './aboutPrimitives';

// Practical recipes: where in the UI each kind of thing is created, and the
// conventions that keep the graph trustworthy.
function AddingDataTab() {
    const { campus } = useParams();
    const prefix = campus ? `/${campus}` : '';

    return (
        <AboutPage
            title="Adding Data"
            lede="Where each kind of record is created, step by step, and the conventions that keep the graph reliable."
        >
            <Card title="Before you start">
                <List spacing={1} pl={5} styleType="disc" fontSize="sm" color="gray.700">
                    <ListItem>
                        Check the <b>campus</b> and <b>academic year</b> selectors in the header —
                        evidence, plans, and annotations land in whichever scope is selected.
                    </ListItem>
                    <ListItem>
                        Set who you are with the person selector (&quot;Notating as…&quot;), so
                        notes and updates are attributed correctly.
                    </ListItem>
                    <ListItem>
                        <b>Search before creating.</b> Most things you want to add — a service, a
                        document, a vendor — may already exist and just need to be linked. The
                        graph&apos;s value comes from connections to shared nodes, not duplicates.
                    </ListItem>
                </List>
            </Card>

            <Card title="Recording evidence on an indicator">
                <Para>
                    The most common task: documenting where the campus stands on a success
                    indicator.
                </Para>
                <List spacing={1} pl={5} styleType="decimal" fontSize="sm" color="gray.700">
                    <ListItem>
                        Open the <Link as={RouterLink} to={`${prefix}/dashboard/web/goal/1`} color="teal.600" textDecoration="underline">Dashboard</Link>{' '}
                        and pick the working group (Web, Instructional Materials, or Procurement),
                        then navigate to the goal and indicator.
                    </ListItem>
                    <ListItem>
                        On the indicator&apos;s evidence panel, attach an <b>implementation</b> —
                        link an existing one or create a new Process, Project, Procedure, Service,
                        Guidance, Tracking, or Internal Policy. Choose the category by what the
                        thing <i>is</i> (see Evidence &amp; Implementations); when unsure, say so
                        in a note.
                    </ListItem>
                    <ListItem>
                        Add <b>supporting documentation</b> to the implementation: documents,
                        webpages, and metrics count as documented evidence; notes and messages add
                        context.
                    </ListItem>
                    <ListItem>
                        Use <b>Annotations</b> on the indicator for observations, plans, and
                        anything reviewers should know.
                    </ListItem>
                    <ListItem>
                        Assign the people working on it as <b>implementers</b>, and set the working
                        flags (worked on this year / planned for next year) and priority.
                    </ListItem>
                    <ListItem>
                        When the record is defensible, mark it <b>ready for admin review</b>.
                    </ListItem>
                </List>
                <Alert status="info" borderRadius="md" fontSize="sm" mt={3}>
                    <AlertIcon />
                    Status levels are claims, not aspirations — a rung is selected only when its
                    rubric requirements are met, and reviewers will lower statuses that overreach.
                    When in doubt, claim the lower rung and note the trajectory.
                </Alert>
            </Card>

            <Card title="Maintaining implementations, people, and governance">
                <Para>
                    The <b>ATI Explorer</b> is where the shared entities live. Each area follows
                    the same pattern: a searchable list with an Add button on the left, detail and
                    editing on the right.
                </Para>
                <Section title="Implementations">
                    <Para>
                        Create and edit implementation nodes independent of any one indicator: set
                        the owner, the participant team and their roles, the accountable working
                        group, maturity-model dimensions, and year-scoped documentation. Link them
                        to the interfaces they remediate and the tools they use.
                    </Para>
                </Section>
                <Section title="People">
                    <Para>
                        Add committee members and other participants, set their working groups,
                        roles (with whether the role appears in their position description), campus,
                        active status, and approval rights.
                    </Para>
                </Section>
                <Section title="Governance">
                    <Para>
                        Record laws, cases, directives, external policies, memos, and guidelines,
                        and connect them to the goals they inform — this is what keeps every effort
                        traceable to a mandate.
                    </Para>
                </Section>
                <Section title="Plans">
                    <Para>
                        Create plan work-items, set their lifecycle status, attach progress notes,
                        link them to the evidence they target, and connect Asana tasks for
                        read-only subtask sync.
                    </Para>
                </Section>
            </Card>

            <Card title="Building the asset inventory">
                <Para>
                    In the Explorer&apos;s <b>Assets</b> area (tabs for Assets, Interfaces,
                    Components, TAAPs, Tools, Vendors), work top-down:
                </Para>
                <List spacing={1} pl={5} styleType="decimal" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Create the asset</b> — title, class, scope (scope is part of identity:
                        the campus Canvas instance and the systemwide one are different assets).
                        Assign stewards for whichever of the four capacities (procured / developed
                        / maintained / used) you know; leave the rest empty rather than guessing.
                    </ListItem>
                    <ListItem>
                        <b>Add its interfaces</b> — the distinct surfaces people interact with.
                        Choose the four identity coordinates carefully (backing asset, locus,
                        function, title): they cannot be edited later. Audience, coverage domains,
                        provenance, and working-group accountability can be refined any time.
                    </ListItem>
                    <ListItem>
                        <b>Add components</b> where WCAG-level tracking is useful — the video
                        player, the form — and link the guidelines they must satisfy.
                    </ListItem>
                    <ListItem>
                        <b>Connect remediation</b> — link existing implementations to the
                        interfaces they remediate; this is what clears the elevation warning.
                    </ListItem>
                    <ListItem>
                        <b>Create a TAAP</b> when full conformance isn&apos;t achievable now: pick
                        the covered asset, the outcome, owner and signer, and a review-due date.
                        Link it to the indicator evidence it supports.
                    </ListItem>
                </List>
            </Card>

            <Card title="Working the campus plan">
                <List spacing={1} pl={5} styleType="decimal" fontSize="sm" color="gray.700">
                    <ListItem>
                        Open <Link as={RouterLink} to={`${prefix}/dashboard/campus-plan`} color="teal.600" textDecoration="underline">Campus Plan</Link>{' '}
                        for the selected year (created automatically at rollover).
                    </ListItem>
                    <ListItem>
                        For each working group: add <b>prioritized indicators</b> with a rationale,
                        assign the <b>group lead</b>, and attach the constituent plans.
                    </ListItem>
                    <ListItem>
                        Set the <b>executive sponsor</b> and write the executive summary.
                    </ListItem>
                    <ListItem>
                        Through the year, add dated <b>progress updates</b> with a trajectory on
                        each prioritized item — these are append-only and become the plan&apos;s
                        narrative.
                    </ListItem>
                </List>
            </Card>

            <Card title="Conventions that keep the graph trustworthy">
                <List spacing={2} pl={5} styleType="disc" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Identifiers are immutable.</b> Composite identities (evidence, plans,
                        assets, interfaces, components) are built from their coordinates at
                        creation. To &quot;rename&quot; one, create the correct node and retire the
                        old.
                    </ListItem>
                    <ListItem>
                        <b>Deprecate, don&apos;t delete.</b> Documentation that is obsolete gets
                        marked deprecated so history survives; deletion is for mistakes.
                    </ListItem>
                    <ListItem>
                        <b>Absence is information.</b> An indicator with no evidence, an asset with
                        no remediation, an unassigned steward — these are the signals the app
                        exists to surface. Never invent a connection to silence a warning.
                    </ListItem>
                    <ListItem>
                        <b>Prefer linking to creating.</b> One service node connected to five
                        indicators is correct; five copies are noise.
                    </ListItem>
                    <ListItem>
                        <b>Write notes liberally.</b> Notes are cheap context for future committee
                        members and reviewers — observations, uncertainty, rationale. They never
                        inflate evidence, so there is no penalty for candor.
                    </ListItem>
                </List>
            </Card>
        </AboutPage>
    );
}

export default AddingDataTab;
