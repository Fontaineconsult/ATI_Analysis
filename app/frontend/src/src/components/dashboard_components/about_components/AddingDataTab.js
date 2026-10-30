import React from 'react';
import { Alert, AlertIcon, List, ListItem, Link } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AboutPage, Card, Section, Para, Figure, TermDef } from './aboutPrimitives';
import indicatorHeaderImg from '../../../assets/img/adding-data/indicator-header.png';
import responsiblePersonsImg from '../../../assets/img/adding-data/responsible-persons.png';
import implementationsCardImg from '../../../assets/img/adding-data/implementations-card.png';
import addImplementationCreateImg from '../../../assets/img/adding-data/add-implementation-create.png';
import addImplementationLinkImg from '../../../assets/img/adding-data/add-implementation-link.png';
import evidenceDetailImg from '../../../assets/img/adding-data/evidence-detail.png';
import documentationViewerImg from '../../../assets/img/adding-data/documentation-viewer.png';
import addDocumentFormImg from '../../../assets/img/adding-data/add-document-form.png';
import annotationsNotesImg from '../../../assets/img/adding-data/annotations-notes.png';
import addNoteFormImg from '../../../assets/img/adding-data/add-note-form.png';
import annotationsPlansImg from '../../../assets/img/adding-data/annotations-plans.png';

const listProps = { spacing: 1, pl: 5, fontSize: 'sm', color: 'gray.700' };

// How to record evidence on an indicator, area by area, with a screenshot of
// each part of the indicator panel. Screenshots come from SFSU 6.2-ins.
function AddingDataTab() {
    const { campus } = useParams();
    const prefix = campus ? `/${campus}` : '';

    return (
        <AboutPage
            title="Adding Data"
            lede="How to record a campus's evidence on a success indicator: the implementations that do the work, the documentation that proves it, and the annotations that explain it."
        >
            <Card title="Before you start">
                <List {...listProps} styleType="disc">
                    <ListItem>
                        Check the <b>campus</b> and <b>academic year</b> selectors in the header.
                        Everything you add lands in the campus and year that are selected.
                    </ListItem>
                    <ListItem>
                        Check the <b>Notating as</b> name in the header. Notes and updates are
                        attributed to that person.
                    </ListItem>
                    <ListItem>
                        <b>Search before creating.</b> The service, document or page you want to add
                        may already exist. Link the existing record instead of making a copy.
                    </ListItem>
                </List>
            </Card>

            <Card title="1. Open the indicator">
                <Para>
                    Open the <Link as={RouterLink} to={`${prefix}/dashboard/web/goal/1`} color="teal.600" textDecoration="underline">Dashboard</Link>,
                    pick a working group, then pick a goal. The left column lists the goal&apos;s
                    indicators. Select one to open its panel on the right.
                </Para>
                <Figure
                    src={indicatorHeaderImg}
                    alt="Indicator header for 6.2-ins. It shows the indicator text, an Initiated status badge, a Ready for review badge, a status dropdown, View, Unmark ready and Review buttons, and the status ladder from Not Started to Optimizing."
                    caption="The indicator header: status, review state, and the status ladder."
                />
                <Para>
                    The header shows the indicator text and its current status. The status ladder
                    below it marks where the indicator sits from Not Started to Optimizing.
                    <b> View</b> opens the report page for the indicator. <b>Mark ready for review</b> tells
                    the reviewers the entry is complete. <b>Review</b> opens the approval page.
                </Para>
                <Para>
                    Open the <b>Companion Guide</b> under the header before adding anything. It
                    lists the examples of evidence the Chancellor&apos;s Office expects and what
                    the Established, Managed and Optimizing levels look like for this indicator.
                </Para>
            </Card>

            <Card title="2. Name the responsible people">
                <Figure
                    src={responsiblePersonsImg}
                    alt="Responsible Persons card with a person selector, an Assign button, and a table listing Andrew Roderick, AVP Academic Technology, with a Remove button."
                    caption="Responsible Persons: who answers for this indicator this year."
                    maxW="640px"
                />
                <Para>
                    Choose a person in the selector and press <b>Assign</b>. Responsible persons
                    are accountable for the indicator&apos;s evidence this year. They are not
                    everyone who works on it. People who do the work are recorded on the
                    implementation itself.
                </Para>
            </Card>

            <Card title="3. Add implementations">
                <Para>
                    An <b>implementation</b> is the work the campus does that answers the
                    indicator. It is the core of the evidence. Choose the type by what the work
                    is.
                </Para>
                <TermDef term="Process">A repeatable workflow that runs without a fixed end, such as course remediation each term.</TermDef>
                <TermDef term="Procedure">A written, step-by-step method, such as a purchasing review checklist.</TermDef>
                <TermDef term="Service">A standing capability people request on demand, such as captioning or consultation.</TermDef>
                <TermDef term="Guidance">Advice or training material, such as a faculty guide or workshop.</TermDef>
                <TermDef term="Project">Time-bound work with an end state, such as a platform rollout.</TermDef>
                <TermDef term="Internal Policy">A campus mandate, such as a syllabus or textbook adoption policy.</TermDef>
                <TermDef term="Tracking">A register or record set that tracks the work, such as a remediation log.</TermDef>

                <Section title="The implementations card">
                    <Figure
                        src={implementationsCardImg}
                        alt="Implementations card showing seven implementations. Type filter chips for Tracking, Guidance, Process, Project, Procedure, InternalPolicy and Service. The Procedure filter is selected and shows SFBRN CSUBuy IT Accessibility Review Procedure, tagged External, with strength 1 Indirect Support, control External, documentation counts Doc 3, Web 1, Note 4, and view, evidence detail and remove buttons."
                        caption="The implementations card, filtered to Procedure."
                    />
                    <Para>
                        The chips filter the table by type. Each row has four things to set.
                    </Para>
                    <List {...listProps} styleType="disc">
                        <ListItem>
                            <b>Strength</b> rates how well this work answers this indicator: 0 No
                            Contribution, 1 Indirect Support, 2 Partial, or 3 Full. Rate the link,
                            not the quality of the work. A strong program can be indirect support
                            for an indicator about something else.
                        </ListItem>
                        <ListItem>
                            <b>Control</b> says who runs the work. Internal means the campus runs it.
                            External means the campus relies on work it does not control, such as
                            SFBRN, the Chancellor&apos;s Office or a vendor. External rows carry a
                            purple tag.
                        </ListItem>
                        <ListItem>
                            <b>Documentation</b> counts what is attached: Doc, Web, Note, Msg and
                            Met. A row with no Doc or Web is undocumented.
                        </ListItem>
                        <ListItem>
                            <b>Actions</b>: the eye opens the documentation, the check button opens
                            the evidence detail, and the bin removes the implementation from this
                            indicator. Removing unlinks it. The implementation itself is kept.
                        </ListItem>
                    </List>
                </Section>

                <Section title="Create a new implementation, or link an existing one">
                    <Para>
                        Press <b>Add</b> on the card. The dialog has two tabs.
                    </Para>
                    <Figure
                        src={addImplementationLinkImg}
                        alt="Manage Implementation dialog on the Link Existing tab, with Type, Select Existing and Evidence Strength fields and a Link to Success Indicator button."
                        caption="Link Existing: attach work that is already recorded."
                        maxW="480px"
                    />
                    <Para>
                        Use <b>Link Existing</b> first. Pick the type, pick the implementation, and
                        set a strength. One service linked to five indicators is correct. Five
                        copies of it are not.
                    </Para>
                    <Figure
                        src={addImplementationCreateImg}
                        alt="Manage Implementation dialog on the Create New tab, with Type, Title and Description fields and Cancel, Create Only and Create & Assign buttons."
                        caption="Create New: record work that is not in the graph yet."
                        maxW="480px"
                    />
                    <Para>
                        Use <b>Create New</b> when the work is not recorded anywhere. <b>Create &amp; Assign</b> creates
                        it and links it to this indicator. <b>Create Only</b> creates it without a link.
                    </Para>
                    <Para>
                        Write the description as two or three sentences saying what the work is,
                        who runs it and who it serves. Leave out history and meeting dates. Those
                        go in a note.
                    </Para>
                </Section>

                <Section title="Record how the work answers the indicator">
                    <Figure
                        src={evidenceDetailImg}
                        alt="Evidence Detail dialog for SFBRN CSUBuy IT Accessibility Review Procedure. A text box answers how this work answers the indicator. Below it, four Established requirements, Position, Budget, Procedures and Output, each with a checkbox."
                        caption="Evidence detail: the rationale and the requirements this work covers."
                        maxW="480px"
                    />
                    <Para>
                        The check button in the Actions column opens <b>Evidence Detail</b>. Write
                        one or two sentences on how this work answers this indicator. Then tick the
                        parts of the Established bar the work delivers.
                    </Para>
                    <Para>
                        The rationale belongs to this link only. The same procedure can answer a
                        procurement indicator fully and a course-materials indicator in part, for
                        different reasons. Tick a requirement only when the work delivers it. A
                        written procedure does not show that a position is assigned or that a
                        budget is funded.
                    </Para>
                </Section>
            </Card>

            <Card title="4. Add documentation to an implementation">
                <Para>
                    Documentation is what turns a described practice into evidence. Press the eye
                    button on an implementation row to open its <b>Documentation Viewer</b>.
                </Para>
                <Figure
                    src={documentationViewerImg}
                    alt="Documentation Viewer with tabs Documents 3, Webpages 1, Notes 4, Messages 0 and Metrics 0. The Documents tab lists three documents with links, source text capture dates, and badges for Source Text, In 2025-2026 and Global, plus an Add Document button."
                    caption="The Documentation Viewer for one implementation."
                />
                <List {...listProps} styleType="disc">
                    <ListItem><b>Documents</b>: procedures, policies, forms, reports and templates.</ListItem>
                    <ListItem><b>Webpages</b>: public or campus pages that describe or deliver the work.</ListItem>
                    <ListItem><b>Notes</b>: context about the implementation that holds wherever it is used.</ListItem>
                    <ListItem><b>Messages</b>: emails or announcements that show the work happening.</ListItem>
                    <ListItem><b>Metrics</b>: counts and measures the work produces.</ListItem>
                </List>
                <Para mt={2}>
                    Documents and webpages count as documented evidence. Notes and messages add
                    context but do not count as documentation.
                </Para>

                <Section title="Add a document">
                    <Figure
                        src={addDocumentFormImg}
                        alt="Add Document form with Document Name, Description, Maintained By, Date Created, File Path, URI Path, Attached File and Source Text fields, and flags for Include in 2025-2026 report, Include in all reports, Admin review doc, Milestones doc and Depreciated."
                        caption="The Add Document form."
                        maxW="480px"
                    />
                    <List {...listProps} styleType="decimal">
                        <ListItem>Give the document its real title.</ListItem>
                        <ListItem>Choose who maintains it.</ListItem>
                        <ListItem>
                            Add a link in <b>URI Path</b>, or attach the file. Attached files are
                            stored in the app and can be downloaded from the list.
                        </ListItem>
                        <ListItem>
                            If the document sits behind a sign-on, paste its text into <b>Source
                            Text</b>. Reviewers can then read it. The original stays the record.
                        </ListItem>
                        <ListItem>Set the flags, then press <b>Add Document</b>.</ListItem>
                    </List>
                    <Para mt={2}>
                        <b>Include in the current year&apos;s report</b> attaches the document to this
                        year only. <b>Include in all reports (global)</b> shows it in every year.
                        Mark a document <b>Admin review doc</b> when it records a review, and{' '}
                        <b>Milestones doc</b> when it carries milestones or measures.
                    </Para>
                    <Para>
                        Webpages use the same form with a URL in place of the file. When a page is
                        taken down, set <b>No longer exists</b> instead of deleting it.
                    </Para>
                </Section>
            </Card>

            <Card title="5. Use annotations">
                <Para>
                    Annotations sit at the bottom of the indicator panel. They hold what the
                    reviewers should know about this indicator this year. They never count as
                    evidence, so write them freely.
                </Para>
                <Figure
                    src={annotationsNotesImg}
                    alt="Annotations card with tabs Notes 5, Messages 0, Metrics 0, Plans 1, Concerns 0, Recommendations 0 and Queries 0. The Notes tab shows an Add New Note button and three notes, two marked In Report."
                    caption="Annotations, open on the Notes tab. Each tab shows its count."
                />
                <TermDef term="Notes">
                    Observations, status updates, history and uncertainty. Use a note when the
                    fact is true but does not fit anywhere else.
                </TermDef>
                <TermDef term="Messages">Emails and announcements about this indicator.</TermDef>
                <TermDef term="Metrics">Counts and measures recorded for the indicator.</TermDef>
                <TermDef term="Plans">
                    Work someone has committed to do. Name a plan as a task that can be finished,
                    such as &quot;Publish the course materials checklist&quot;.
                </TermDef>
                <TermDef term="Concerns">
                    A problem with no fix yet: nobody has said what would solve it. A concern
                    should later become a recommendation or a plan, or be dismissed with a reason.
                </TermDef>
                <TermDef term="Recommendations">
                    A named change to make before the next review cycle. Recommendations are
                    resolved as addressed or dismissed. They are never deleted.
                </TermDef>
                <TermDef term="Queries">
                    Open questions whose answers would move the evidence forward. They are
                    raised under a working group plan, so they are read-only here.
                </TermDef>

                <Section title="Add a note">
                    <Figure
                        src={addNoteFormImg}
                        alt="Add New Note form with Note Name, Date Created, Depreciation Date and Note Content fields, an Include in Report switch that is on, a Deprecated switch that is off, and Submit and Cancel buttons."
                        caption="The note form opens in place under Add New Note."
                    />
                    <List {...listProps} styleType="decimal">
                        <ListItem>Open the Notes tab and press <b>Add New Note</b>.</ListItem>
                        <ListItem>Give the note a short name that says what it is about.</ListItem>
                        <ListItem>
                            Write the content. Start with who said it and when, then state one fact
                            per sentence.
                        </ListItem>
                        <ListItem>
                            Leave <b>Include in Report</b> on if the note should appear on the
                            public report. Turn it off for working notes.
                        </ListItem>
                        <ListItem>Press <b>Submit</b>.</ListItem>
                    </List>
                    <Para mt={2}>
                        When a note goes out of date, edit it and turn on <b>Deprecated</b>. That
                        keeps the history.
                    </Para>
                    <Para>
                        Put a note on the indicator when it is about this year&apos;s entry. Put it
                        on the implementation, through its Documentation Viewer, when it is about
                        the work. Implementation notes appear on every indicator that work
                        answers.
                    </Para>
                </Section>

                <Section title="Add a plan">
                    <Figure
                        src={annotationsPlansImg}
                        alt="Plans tab with an Add Plan button and one plan, Make sure accessibility information is included in all course approval processes, with badges On Hold, 4 Indicators and an Asana link."
                        caption="The Plans tab. A plan can serve several indicators."
                    />
                    <Para>
                        Press <b>Add Plan</b>. Write the name as a task, describe what must happen
                        and how you will know it is done, and set its status. One plan can serve
                        several indicators, and the badge counts them. Link an Asana task to sync
                        its subtasks for reading.
                    </Para>
                    <Para>
                        A plan never raises the status. It names the gap the work will close.
                    </Para>
                </Section>
            </Card>

            <Card title="6. Mark the entry ready for review">
                <Para>
                    When the evidence supports the status you have chosen, press{' '}
                    <b>Mark ready for review</b> in the indicator header. The row turns yellow in
                    the reports, and reviewers pick it up from there.
                </Para>
                <Alert status="info" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    A status is a claim the evidence must support. Choose a level only when every
                    part of its bar is met. When in doubt, choose the lower level and record what
                    is missing in a note.
                </Alert>
            </Card>

            <Card title="Other records">
                <Section title="ATI Explorer">
                    <Para>
                        The <b>ATI Explorer</b> holds the shared records: implementations, people,
                        governance and plans. Use it to edit an implementation&apos;s owner, team
                        and roles, or to add a person, law or policy. Each area has a searchable
                        list on the left and the detail on the right.
                    </Para>
                </Section>
                <Section title="Assets">
                    <Para>
                        In the Explorer&apos;s <b>Assets</b> area, create the asset first and name
                        its stewards. Then add its interfaces and components, and link the
                        implementations that remediate it. Create a TAAP when the asset cannot
                        conform yet. An interface&apos;s identity cannot be changed after it is
                        created.
                    </Para>
                </Section>
                <Section title="Campus plan">
                    <Para>
                        Open <Link as={RouterLink} to={`${prefix}/dashboard/campus-plan`} color="teal.600" textDecoration="underline">Campus Plan</Link>{' '}
                        for the selected year. For each working group, add the prioritized
                        indicators with a rationale and assign the group lead. Add dated progress
                        updates through the year.
                    </Para>
                </Section>
            </Card>

            <Card title="Rules that keep the records reliable">
                <List spacing={2} pl={5} styleType="disc" fontSize="sm" color="gray.700">
                    <ListItem>
                        <b>Link before you create.</b> One record linked many times is correct.
                        Copies split the evidence.
                    </ListItem>
                    <ListItem>
                        <b>Deprecate instead of deleting.</b> Mark old documents, pages and notes
                        deprecated so the history survives. Delete only mistakes.
                    </ListItem>
                    <ListItem>
                        <b>Leave gaps visible.</b> A missing document or an unassigned role is
                        information. Do not add a link to clear a warning.
                    </ListItem>
                    <ListItem>
                        <b>Identifiers do not change.</b> To rename a record with a composite
                        identity, create the correct one and retire the old one.
                    </ListItem>
                </List>
            </Card>
        </AboutPage>
    );
}

export default AddingDataTab;
