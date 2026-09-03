// =====================================================================================
// Ontology ingest: Sonoma State - Instructional Materials & Faculty Development CoP
// Meeting date 2026-09-03. Ingested 2026-09-03 by Daniel Fontaine.
//
// SOURCE
//   MeetingMinutes unique_id 1b2bb494575a4f30b012f2d4878868ed (33,271 chars).
//   Already wired before this file ran: minutes_under_plan -> 2025-2026-ssu-ins,
//   minutes_recorded_by -> Daniel Fontaine, participated_in <- Lynch / Ayala / Hensel,
//   pertains_to -> Faculty Development, resulted_in <- InterviewGuide
//   102bec0f46184989b7315fc25f283fd4. No minutes node is created here. It is stamped.
//
// ANCHORS
//   Academic year 2025-2026 (the reporting year, not the rolled 2026-2027).
//   Campus ssu. WorkingGroupPlan 2025-2026-ssu-ins (5987ac1c763a4cdc9ab66a1cc3d4adef).
//
// RECON FINDINGS THAT CHANGED THE ROUTING
//   1. The minutes head a section "8.13" and then quote the text of 8.3-ins. Both
//      indicators exist at SSU and they differ. 8.13-ins reads "integrates
//      accessibility information into academic technology activities". Everything in
//      that section is routed to 8.3-ins. Nothing here touches 8.13-ins.
//   2. Steve Higginbotham already exists and already implements 7.1, 5.12, 5.15 and
//      4.11-ins-ssu. The action item to log him as a contact was already satisfied.
//   3. SSU had zero Query nodes before this file. These are its first.
//   4. meeting_followup_table derives "discussed" from Notes shared between the
//      minutes and a YSE. Every YSE carrying an ask below therefore gets a
//      dual-attached Note, or the ask would be invisible to the follow-up.
//
// IDENTITY MAPPINGS
//   "Sandy" / "Sandy Ayala"     -> Sandra Ayala (exists, ayalas@sonoma.edu)
//   "Timothy"                   -> Tim Hensel (exists, dd4d0e0da2ce4334863611a95ffc4d93)
//   "Brent" (DSS)               -> Brent Boyer (exists, Director of Disability Services)
//   "Amanda"                    -> Amanda McGowan (exists, ati_role Executive Sponsor)
//   "Steve Higginbotham"        -> exists, Barnes & Noble Bookstore Manager
//   Justin Lipp, Barbara Butler -> NO NODE. Departed, own no current work. Prose only.
//   "Willie Pang"               -> NO PERSON NODE. The referent is the application,
//                                  recorded as the Tool "PDF Accessibility Remediation".
//
// JUDGMENT CALLS
//   - The CTET workshop series is NOT wired to 8.14. That indicator covers employees
//     with accessible instructional materials responsibilities, not faculty. Student
//     worker training goes there instead, because student assistants doing remediation
//     are exactly those employees.
//   - 7.3 is NOT downgraded here. StatusLevel moves only through administrative review,
//     so the downgrade is recorded as an open Recommendation.
//   - "The Ladder" is kept as the node title. No participant recognised the word, but
//     the title is traceable to the CTET page it was built from on 2026-09-02, and
//     renaming would trade one invented name for another. The name dispute and the
//     discontinued completion letters are corrected in the description and in Notes.
//   - The before/after PDF pair is BOTH a Plan (Tim will do the work) and an
//     artifact_request Query (Tim offered an artifact that has not arrived). The
//     follow-up gap table reads Queries and not Plans, so without the Query the
//     offered artifact would be unchaseable.
//   - Ally is NOT created as a Tool. The workshop list names "Tidy Up (Ally)" while a
//     June 2026 note records SSU moving off Ally onto UDOIT. That contradiction is
//     recorded as a Note and a verification flag, not as a node.
//
// AS-HEARD FLAGS CARRIED FORWARD
//   - The sixth of Sandy's "six key components" was implied but never stated on the
//     recording. Recorded as unconfirmed, with an open Query.
//   - The March 20 Faculty Learning Community stipend was said as 350 then corrected
//     live to 300 against the program documentation. 300 is recorded.
//   - The PDF Accessibility Remediation application is a client-rendered single page
//     app. Its served HTML carries only the title "PDF Accessibility" and the /home/
//     path returns 404 to a direct fetch, so no source text was captured and no
//     feature list is asserted.
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. PERSON AND ROLE UPDATES
// -------------------------------------------------------------------------------------

MATCH (p:Person {name: "Tim Hensel"})
SET p.title = "Accessibility Specialist"
WITH p
MATCH (r:Role {handle: "role:accessibility-specialist"})
MERGE (p)-[h:holds_role]->(r)
SET h.in_position_description = true,
    h.pd_description = "Formally added to the position description on 2026-09-02, the day before the 2026-09-03 meeting, with the title changed to Accessibility Specialist. Covers accessible instructional materials responsibilities at CTET, including the student remediation team and the Canvas remediation programme. Supersedes the earlier informal absorption of these duties.",
    h.added_date = date("2026-09-02");

MATCH (p:Person {name: "Sandra Ayala"})
SET p.ati_role = "Faculty Fellow, funded through the CTEP budget for instructional materials committee work. Chair of the SSU ATI committee since roughly 2011. Co-organises the instructional materials committee with Tim Hensel.",
    p.non_committee_member_active = true;


// -------------------------------------------------------------------------------------
// 2. TOOL: PDF Accessibility Remediation
// -------------------------------------------------------------------------------------

MERGE (t:Tool {tool_identifier: "pdf-accessibility-remediation"})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", ""),
              t.title = "PDF Accessibility Remediation",
              t.description = "Web application for remediating PDF accessibility, hosted on AWS Amplify under a CSU account at https://csu.d2ljzoawo09xv6.amplifyapp.com/home/. Referred to at Sonoma State as Willie Pang PDF remediator. John Lynch named it on 2026-09-03 as one of the tools CTET shows faculty directly for self-service PDF work, alongside UDOIT and Panopto. The application is client-rendered and its served HTML carries only the title PDF Accessibility, so no feature list is recorded here.";

MERGE (d:Document {uri_path: "https://csu.d2ljzoawo09xv6.amplifyapp.com/home/"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.name = "PDF Accessibility Remediation (CSU)",
              d.description = "Landing page for the CSU-hosted PDF accessibility remediation application. Client-rendered single page app. The served HTML carries the title PDF Accessibility and no body content, and the /home/ path returns 404 to a direct fetch, so source text must be pasted by hand.",
              d.include_in_report = true,
              d.is_administrative_review_documentation = false,
              d.is_milestone_and_measures_documentation = false;

MATCH (t:Tool {tool_identifier: "pdf-accessibility-remediation"})
MATCH (d:Document {uri_path: "https://csu.d2ljzoawo09xv6.amplifyapp.com/home/"})
MERGE (t)-[:describes_tool]->(d);


// -------------------------------------------------------------------------------------
// 3. IMPLEMENTATIONS
// -------------------------------------------------------------------------------------

// 3.1 CTET Accessibility Workshop Series (Service, S1)
MERGE (s:Service {title: "CTET Accessibility Workshop Series"})
ON CREATE SET s.unique_id = replace(randomUUID(), "-", ""),
              s.retired = false
SET s.description = "Recurring accessibility workshop programme run by the Center for Teaching and Educational Technology at Sonoma State, open to faculty and staff across the semester. Four distinct workshop types run regularly: UDOIT, Tidy Up, Principles of Accessibility, and Panopto. Each type runs roughly three to four sessions per semester, landing at about twelve sessions per semester. December is not scheduled. Accessibility content is also carried inside other workshop types rather than only as standalone sessions, particularly the AI-focused workshops, of which Sandra Ayala has run at least half a dozen on using AI to support accessible content creation and equitable teaching. A paid one-day accessibility-focused faculty development session ran the day before spring break in 2026, delivered jointly by John Lynch and Sandra Ayala and including hands-on AI-assisted accessibility work. Attested by Tim Hensel and John Lynch on 2026-09-03.";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (o:Person {name: "John Lynch"})
MERGE (s)-[:owned_by]->(o);

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (c:CommunityOfPractice {name: "Faculty Development"})
MERGE (s)-[:accountable_community]->(c);

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MERGE (s)-[e:is_evidence_for]->(y)
SET e.strength = 3, e.control = "internal";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (s)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-ssu"})
MERGE (s)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (p:Person {name: "John Lynch"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(s)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Runs and delivers CTET accessibility workshops.";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (p:Person {name: "Tim Hensel"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(s)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Delivers the UDOIT, Tidy Up and Panopto workshop strands.";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (p:Person {name: "Sandra Ayala"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(s)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Has run accessibility workshops at Sonoma for roughly fifteen years, including AI and accessibility sessions and the March 2026 paid faculty learning community.";

MATCH (s:Service {title: "CTET Accessibility Workshop Series"})
MATCH (t:Tool) WHERE t.tool_identifier IN ["udoit-advantage", "panopto", "pdf-accessibility-remediation"]
MERGE (s)-[:uses_tool]->(t);


// 3.2 New Faculty Orientation Accessibility Segment (Process, S1)
MERGE (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
ON CREATE SET pr.unique_id = replace(randomUUID(), "-", ""),
              pr.retired = false
SET pr.description = "Accessibility content delivered inside Sonoma State New Faculty Orientation each year. John Lynch personally runs the Canvas orientation segment and includes a fifteen-minute discussion of what accessibility means and how to implement it in Canvas, with pointers to further CTET resources. Disability Services delivers a separate full one-hour presentation on compliance obligations relating to students with disabilities. Textbook ordering deadlines for early adoption are covered as part of the same orientation. Universal Design for Learning content is delivered by John Lynch. Sandra Ayala has presented at orientation in various years and historically ran department-level introductory meetings at the start of each semester, each followed by a UDL-focused workshop. John Lynch confirmed on 2026-09-03 that he is the officially responsible person for the orientation.";

MATCH (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
MATCH (o:Person {name: "John Lynch"})
MERGE (pr)-[:owned_by]->(o);

MATCH (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
MATCH (c:CommunityOfPractice {name: "Faculty Development"})
MERGE (pr)-[:accountable_community]->(c);

MATCH (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.11-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 3, e.control = "internal";

MATCH (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
MATCH (p:Person {name: "John Lynch"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(pr)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Delivers the Canvas accessibility segment and the UDL content.";

MATCH (pr:Process {title: "New Faculty Orientation Accessibility Segment (SSU)"})
MATCH (p:Person {name: "Brent Boyer"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(pr)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Disability Services delivers the one-hour compliance presentation within orientation.";


// 3.3 CTET Student Worker Accessibility Training (Process, S1)
MERGE (pr:Process {title: "CTET Student Worker Accessibility Training"})
ON CREATE SET pr.unique_id = replace(randomUUID(), "-", ""),
              pr.retired = false
SET pr.description = "Checklist-based training that student workers on the CTET remediation team complete, managed directly by Tim Hensel. Students demonstrate defined competencies by set dates. Tim Hensel enrols students in external accessibility coursework whenever it becomes available. In summer 2026 that included Cityscape-affiliated courses and University of Utah accessibility coursework, which Tim Hensel completed alongside a student. The Canvas Remediation Manual is the written training path for this team. Attested by Tim Hensel and John Lynch on 2026-09-03.";

MATCH (pr:Process {title: "CTET Student Worker Accessibility Training"})
MATCH (o:Person {name: "Tim Hensel"})
MERGE (pr)-[:owned_by]->(o);

MATCH (pr:Process {title: "CTET Student Worker Accessibility Training"})
MATCH (c:CommunityOfPractice {name: "Faculty Development"})
MERGE (pr)-[:accountable_community]->(c);

MATCH (pr:Process {title: "CTET Student Worker Accessibility Training"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.14-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (pr:Process {title: "CTET Student Worker Accessibility Training"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (pr:Process {title: "CTET Student Worker Accessibility Training"})
MATCH (p:Person {name: "Tim Hensel"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(pr)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Manages the checklist, enrols students in external coursework, and QA-checks their output.";


// 3.4 ATI Faculty Responsibilities Video (Guidance, S1)
MERGE (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
ON CREATE SET g.unique_id = replace(randomUUID(), "-", ""),
              g.retired = false
SET g.description = "AI-generated video produced by Sandra Ayala and distributed to all Sonoma State faculty at the start of each year, organising faculty instructional-materials responsibilities around six core items. Five were stated on the record on 2026-09-03: ordering textbooks in a timely fashion, minimising PDF use, proper document formatting, captioning videos, and alt text for images in presentations. The sixth was prompted by John Lynch as the accessible syllabus but was not completed on the recording, so it is recorded here as unconfirmed. The video is reinforced through presentations at New Faculty Orientation and standalone workshops, and through physical signage and banners reminding faculty to order books through the bookstore. A printed piece titled Accessible Technology Initiative at Sonoma State University circulates alongside it, currently only as a photographed image rather than extractable text.";

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
MATCH (o:Person {name: "Sandra Ayala"})
MERGE (g)-[:owned_by]->(o);

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
MATCH (c:CommunityOfPractice {name: "Faculty Development"})
MERGE (g)-[:accountable_community]->(c);

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (g)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-ssu"})
MERGE (g)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.1-ins-ssu"})
MERGE (g)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (g:Guidance {title: "ATI Faculty Responsibilities Video (six key components)"})
MATCH (p:Person {name: "Sandra Ayala"})
MERGE (p)-[w:worked_on {role_handle: "role:instructor-trainer"}]->(g)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Produced the video and presents its content at orientation and in workshops.";


// 3.5 Instructional Materials Subcommittee (Process, S1)
MERGE (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
ON CREATE SET pr.unique_id = replace(randomUUID(), "-", ""),
              pr.retired = false
SET pr.description = "Sonoma State standing subcommittee for instructional materials accessibility. John Lynch identified it on 2026-09-03 as the process that satisfies the training-materials indicator: it meets regularly, sets annual priorities, and documents them in an Instructional Material Plan submitted each year, including last year. Sandra Ayala has chaired ATI committee work at Sonoma since roughly 2011, with membership and cadence varying between monthly and quarterly. Standing participants include Disability Services and the bookstore, whose manager Steve Higginbotham has sat on the committee for nearly a decade. Day-to-day organisation was delegated on 2026-09-03 to Sandra Ayala and Tim Hensel. Instructional materials remains under Sonoma governance, unlike web and procurement which have moved into SFBRN.";

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
MATCH (o:Person {name: "John Lynch"})
MERGE (pr)-[:owned_by]->(o);

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
MATCH (c:CommunityOfPractice {name: "Faculty Development"})
MERGE (pr)-[:accountable_community]->(c);

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.3-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 3, e.control = "internal";

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
MATCH (p:Person {name: "Sandra Ayala"})
MERGE (p)-[w:worked_on {role_handle: "role:project-manager"}]->(pr)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Chairs the committee and co-organises meetings as Faculty Fellow.";

MATCH (pr:Process {title: "Instructional Materials Subcommittee (SSU)"})
MATCH (p:Person {name: "Tim Hensel"})
MERGE (p)-[w:worked_on {role_handle: "role:accessibility-specialist"}]->(pr)
ON CREATE SET w.added_date = date("2026-09-03"),
              w.note = "Co-organises meetings alongside Sandra Ayala.";


// 3.6 Textbook Adoption Reporting via Bookstore (Process, S1)
MERGE (pr:Process {title: "Textbook Adoption Reporting via Bookstore (SSU)"})
ON CREATE SET pr.unique_id = replace(randomUUID(), "-", ""),
              pr.retired = false
SET pr.description = "Adoption data pipeline running from the Sonoma State bookstore to campus administration and faculty. Steve Higginbotham, the bookstore manager, builds spreadsheets of textbook adoption data and sends them to deans, who push them out to faculty. Sonoma reinforces the same message through Canvas banners and repeated reminders at dean and department-meeting level. The relationship began when Sandra Ayala visited the bookstore to track order data by hand and cross-reference it against Disability Services remediation page counts, which was unsustainable and led to inviting the bookstore manager onto the ATI committee. He has been a member for nearly a decade. Attested by Sandra Ayala on 2026-09-03.";

MATCH (pr:Process {title: "Textbook Adoption Reporting via Bookstore (SSU)"})
MATCH (o:Person {name: "Steve Higginbotham"})
MERGE (pr)-[:owned_by]->(o);

MATCH (pr:Process {title: "Textbook Adoption Reporting via Bookstore (SSU)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.6-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 3, e.control = "internal";

MATCH (pr:Process {title: "Textbook Adoption Reporting via Bookstore (SSU)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.1-ins-ssu"})
MERGE (pr)-[e:is_evidence_for]->(y)
SET e.strength = 2, e.control = "internal";


// -------------------------------------------------------------------------------------
// 4. EVIDENCE LINK QUALIFICATION
// -------------------------------------------------------------------------------------

// John Lynch stated that EquatIO is licensed by Disability Services, not CTET. The
// evidence owners rely on a practice they do not control.
MATCH (s {unique_id: "1ed9e30eadaf486fbac585e57df43285"})-[e:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-ssu"})
SET e.control = "external";


// -------------------------------------------------------------------------------------
// 5. CORRECTIONS FORCED BY THE MEETING
// -------------------------------------------------------------------------------------

// Completion letters are no longer issued. Participation is tracked internally, since
// completing the programme is the eligibility gate for QLT review.
MATCH (s {unique_id: "407119b5316d45f69710530392f1a027"})
SET s.description = "Sonoma State three-tier faculty professional development sequence, run by the Center for Teaching and Educational Technology, each level paid.\n\nLevel 1, Canvas Design Foundations: an asynchronous course covering course layout, assessments, engagement, resources, and accessibility. A 300 dollar stipend. Fall 2025 ran as a two-week intensive (13 to 26 October, 15 to 20 hours weekly) and a four-week course (13 October to 9 November, 6 to 8 hours weekly).\n\nLevel 2, Online Facilitation Fundamentals: online teaching strategies and technology integration. Requires Level 1 completed or in progress. A 300 dollar stipend. Fall 2025 ran 10 to 24 November as an intensive and 10 November to 7 December as a four-week course.\n\nLevel 3, QLT Faculty Learning Community: participants apply the QLT rubric to their own Canvas courses. Requires Levels 1 and 2. A 400 dollar stipend. Cohorts ran 20 October to 16 November 2025 and 12 to 25 January 2026.\n\nAccessibility is taught inside Level 1 rather than as a separate offering, and the QLT rubric applied at Level 3 carries accessibility criteria. SSU also pays the 750 dollar external review fee for faculty who go on to QLT certification, which is recorded separately as CTET QLT Certification. John Lynch confirmed on 2026-09-03 that the 300, 300, 400 and 750 dollar amounts still hold, and that the external review is active with business faculty this year.\n\nCorrected 2026-09-03: completion letters are no longer issued. Participation is tracked internally instead, because completing the programme is the eligibility gate for QLT review, which makes a separate completion letter redundant. The earlier description claimed a completion letter at each level.\n\nThe word Ladder is not a name Sonoma uses. It was carried into this record from a prior transcript and was not recognised by John Lynch, Sandra Ayala or Tim Hensel on 2026-09-03. John Lynch believes it referred to a diagram at the foot of a related document. The title is retained because it is traceable to the CTET online and hybrid teaching page this node was built from on 2026-09-02.";

// Tim Hensel confirmed on 2026-09-03 that he still needs the access link, so the plan
// was not complete.
MATCH (p:Plan {unique_id: "440acc2a8fd24241971dd0c96c595980"})
SET p.plan_status = "In Progress",
    p.completed_date = null,
    p.completion_notes = "Reopened 2026-09-03. Recorded as Completed in error. Tim Hensel confirmed at the Sonoma meeting that the California Community College training resource access link has not reached him and that he still wants the content for both student and faculty workshops.";


// -------------------------------------------------------------------------------------
// 6. PLANS
// -------------------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.3-ins-ssu"})
MERGE (p:Plan {description: "Save a real before-and-after PDF pair from routine remediation work and publish it as a durable example artifact for faculty. Student workers already pull PDFs out of courses, so the as-found file and its remediated version can be kept rather than discarded. One in-progress case is a handwritten document. Done when at least one paired example is stored somewhere faculty can reach and is linked from a CTET page. Tim Hensel proposed this and owns it."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Publish a before-and-after PDF remediation example",
              p.plan_status = "Not Started",
              p.is_key_plan = false,
              p.is_campus_plan = false,
              p.abandoned = false
MERGE (wgp)-[:includes_plan]->(p)
MERGE (p)-[:in_academic_year]->(ay)
MERGE (p)-[:furthers_yse]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.8-ins-ssu"})
MERGE (p:Plan {description: "Provision a network-mounted drive for CTET remediation files, accessible to all relevant staff and hosted centrally rather than on individual workstations. Remediation work currently sits on individual computers under single sign-on, so a student worker leaving mid-task strands the file and the next person restarts it. John Lynch confirmed that CTET now sits under SFBRN, so the request routes through Daniel Fontaine and Amanda McGowan. Done when the share is mounted and the remediation team is working from it."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Provision a shared network drive for CTET remediation files",
              p.plan_status = "Not Started",
              p.is_key_plan = false,
              p.is_campus_plan = false,
              p.abandoned = false
MERGE (wgp)-[:includes_plan]->(p)
MERGE (p)-[:in_academic_year]->(ay)
MERGE (p)-[:furthers_yse]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.3-ins-ssu"})
MERGE (p:Plan {description: "Restart the recurring Sonoma instructional materials committee meetings on a fixed cadence, with Disability Services and the bookstore as standing participants and Daniel Fontaine invited so activity is recorded and reported to SFBRN. John Lynch delegated organisation to Sandra Ayala and Tim Hensel on 2026-09-03 and both agreed. The group deliberately held the 2026-09-03 session before reconstituting, in order to understand how the SFBRN structure works. Done when a recurring meeting is scheduled and the first one has taken place with Daniel Fontaine on the invitation."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Reconstitute the recurring instructional materials committee meetings",
              p.plan_status = "In Progress",
              p.is_key_plan = false,
              p.is_campus_plan = false,
              p.abandoned = false
MERGE (wgp)-[:includes_plan]->(p)
MERGE (p)-[:in_academic_year]->(ay)
MERGE (p)-[:furthers_yse]->(y);


// -------------------------------------------------------------------------------------
// 7. QUERIES
// -------------------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Has any formal determination been made that automated captions meet accessibility standards?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "information_gap",
              q.date_raised = date("2026-09-03"),
              q.detail = "John Lynch raised this against the case for a Verbit site license. If nobody has determined that automated captions from Panopto, Verbit or any other source actually meet accessibility standards, then a site license may be paying for output no better than the automated captions Panopto already produces. The answer decides whether the Verbit request is worth making. Brent Boyer in Disability Services is pursuing the site license and is closest to the determination."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.11-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "Brent Boyer"})
MERGE (q)-[:answerable_by]->(a)
WITH q
MATCH (rb:Person {name: "John Lynch"})
MERGE (q)-[:query_raised_by]->(rb);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Will CTET get a Verbit site license, or continue without one?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "resource_request",
              q.date_raised = date("2026-09-03"),
              q.detail = "Disability Services holds two individual Verbit licenses. CTET holds none and Tim Hensel reports the team is functioning without it. John Lynch has spoken with Brent Boyer, who is interested in pursuing a site license because Disability Services is understaffed for standard accommodation request volume and sees automated Panopto captioning through Verbit as a way to offload some of that. The decision depends on the automated-caption determination recorded separately."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.11-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person) WHERE a.name IN ["Brent Boyer", "Amanda McGowan"]
MERGE (q)-[:answerable_by]->(a);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Can you send the New Faculty Orientation agenda?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "artifact_request",
              q.date_raised = date("2026-09-03"),
              q.detail = "John Lynch confirmed on 2026-09-03 that he can share the agenda. The orientation accessibility segment is described fluently and is now recorded as an implementation, but 8.11 has no stored artifact behind it. The agenda is the document that moves Documentation off empty. An attendance list for the same cycle would additionally answer Documentation evidence."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.11-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "John Lynch"})
MERGE (q)-[:answerable_by]->(a);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Where is the text-extractable source file for the ATI faculty orientation document?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "artifact_request",
              q.date_raised = date("2026-09-03"),
              q.detail = "The printed piece titled Accessible Technology Initiative at Sonoma State University is circulating as a photographed image rather than extractable text, which is not an accessible format. Sandra Ayala suspects it may be the cover of her faculty responsibilities video rather than a standalone document. Neither she nor John Lynch had the source file to hand, and John Lynch agreed to track it down."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "John Lynch"})
MERGE (q)-[:answerable_by]->(a);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Can you send prior years of the Sonoma President Report materials?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "artifact_request",
              q.date_raised = date("2026-09-03"),
              q.detail = "Sandra Ayala agreed on 2026-09-03 to send them. The format moved over time from freeform narrative to a template built around bullet-pointed markers, with items either met or not met against the expectation for the year. The prior materials show what Sonoma has been reporting and in what shape, which matters while it is unsettled whether Sonoma keeps producing its own report."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "Sandra Ayala"})
MERGE (q)-[:answerable_by]->(a);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Does each campus still need a named executive sponsor, and who holds Sonoma?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "policy_decision",
              q.date_raised = date("2026-09-03"),
              q.detail = "Sandra Ayala raised this. The role was historically an Associate Vice President level appointment approved by the campus president, giving one accountable person who could escalate ATI issues directly to the Chancellor Office rather than staff pushing through informal channels. Sonoma last filled it with Justin Lipp, who qualified only because he had moved into a title that technically allowed it. John Lynch is already listed publicly as Sonoma executive sponsor contact and is willing to hold the role, but wants explicit permission from Amanda McGowan first and believes it would sit better with a Provost-level or senior SFBRN person."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "Amanda McGowan"})
MERGE (q)-[:answerable_by]->(a)
WITH q
MATCH (rb:Person {name: "Sandra Ayala"})
MERGE (q)-[:query_raised_by]->(rb);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Will Sonoma continue producing its own President Report from the tracking data?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "policy_decision",
              q.date_raised = date("2026-09-03"),
              q.detail = "Left unresolved on 2026-09-03. Web and procurement reporting have moved into SFBRN and are handled centrally. Instructional materials has not been centralised and remains under Sonoma governance. Whether the campus President Report stays a Sonoma output built from this data, or moves elsewhere, decides who owns the reporting work for the year."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "Amanda McGowan"})
MERGE (q)-[:answerable_by]->(a);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "What is the sixth of the six key components in the faculty responsibilities video?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "information_gap",
              q.date_raised = date("2026-09-03"),
              q.detail = "Five were stated on the recording: ordering textbooks in a timely fashion, minimising PDF use, proper document formatting, captioning videos, and alt text for images in presentations. John Lynch prompted the accessible syllabus as the sixth but the item was not completed on the record. The video is distributed to all faculty each year, so the list should be recorded accurately."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person) WHERE a.name IN ["Sandra Ayala", "John Lynch"]
MERGE (q)-[:answerable_by]->(a);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MERGE (q:Query {question: "Can you send the before-and-after PDF remediation example pair once it exists?"})-[:raised_under_plan]->(wgp)
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "artifact_request",
              q.date_raised = date("2026-09-03"),
              q.detail = "Tim Hensel offered this on 2026-09-03 and it has not arrived. Student workers already pull PDFs out of courses during routine remediation, so keeping an as-found file alongside its remediated version costs little. One in-progress case is a handwritten document. This is the artifact that would move 7.3 off a bare template claim, and the work behind it is tracked as a separate plan."
WITH q
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.3-ins-ssu"})
MERGE (q)-[:addresses_evidence]->(y)
WITH q
MATCH (a:Person {name: "Tim Hensel"})
MERGE (q)-[:answerable_by]->(a);


// -------------------------------------------------------------------------------------
// 8. CONCERNS
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.14-ins-ssu"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "No formal ongoing training process exists for staff employees with accessible instructional materials responsibilities."})
ON CREATE SET c.unique_id = replace(randomUUID(), "-", ""),
              c.status = "open",
              c.date_raised = date("2026-09-03"),
              c.detail = "Student workers have a structured checklist-based path. Staff do not. Staff are encouraged to identify and pursue opportunities as they arise, and funding follows case by case, as when Tim Hensel was funded to attend the Monterey ATI conference this year. Nobody named a change that would close this. John Lynch acknowledged the gap without proposing a programme, and no budget line or release-time allocation exists for staff accessibility training. John Lynch is the person who would own a fix, as director of the unit that employs these staff."
WITH c
MATCH (rb:Person {name: "John Lynch"})
MERGE (c)-[:raised_by]->(rb);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "No executive committee exists to receive and approve the annual instructional materials plan."})
ON CREATE SET c.unique_id = replace(randomUUID(), "-", ""),
              c.status = "open",
              c.date_raised = date("2026-09-03"),
              c.detail = "Instructional materials governance requires an annual plan submitted to and approved by an executive committee. Sonoma has no such committee and neither does SFBRN. John Lynch has raised it with Amanda McGowan directly. Daniel Fontaine hopes to establish one in 2027 but is not securing executive engagement at the SFBRN level. John Lynch will not approach counterparts at SF State and East Bay without Amanda McGowan explicit go-ahead. Sandra Ayala notes that a named executive sponsor has little practical function while the committee it would interface with does not exist, which makes the sponsor question downstream of this one. Amanda McGowan is the person who would own a fix."
WITH c
MATCH (rb:Person {name: "John Lynch"})
MERGE (c)-[:raised_by]->(rb);


// -------------------------------------------------------------------------------------
// 9. RECOMMENDATIONS
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.3-ins-ssu"})
MERGE (y)-[:has_recommendation]->(r:Recommendation {recommendation: "Lower 7.3-ins to Defined until example accessible materials exist."})
ON CREATE SET r.unique_id = replace(randomUUID(), "-", ""),
              r.status = "open",
              r.date_created = date("2026-09-03"),
              r.detail = "The indicator asks for a process to create, distribute and update examples of accessible instructional materials. Sonoma has an accessible syllabus template that is shared in several places and promoted annually. It has no created, distributed and maintained example artifacts. John Lynch stated directly that Sonoma does not produce comparative before-and-after examples and that current guidance is closer to use this template or use a Canvas page instead of a PDF. Established requires a standard practice with complete documentation, and a template alone does not meet it. Restoring Established needs at least one example pair stored where faculty can reach it, with a named owner who refreshes it. The next move is Daniel Fontaine raising the change through administrative review."
WITH r
MATCH (cb:Person {name: "Daniel Fontaine"})
MERGE (r)-[:created_by]->(cb);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MERGE (y)-[:has_recommendation]->(r:Recommendation {recommendation: "Recognise faculty accessibility work in Retention, Tenure and Promotion evaluation."})
ON CREATE SET r.unique_id = replace(randomUUID(), "-", ""),
              r.status = "open",
              r.date_created = date("2026-09-03"),
              r.detail = "Faculty engagement with accessibility work currently rests on individual goodwill. Sandra Ayala has run accessibility workshops at Sonoma for roughly fifteen years and reports attendance swinging from over twenty to as few as three, tracking campus conditions such as presidential transition and programme cuts rather than the value of the sessions. The same pattern appeared during COVID, when faculty prioritised getting courses online over making them accessible. Closing this means accessibility contribution counting in RTP or an equivalent institutional recognition mechanism. The precedent is the syllabus accessibility requirement, which the team pushed through as policy rather than encouragement. The next move sits with the Academic Senate and the Provost office."
WITH r
MATCH (cb:Person {name: "Sandra Ayala"})
MERGE (r)-[:created_by]->(cb);


// -------------------------------------------------------------------------------------
// 10. NOTES
//
// Every Note is attached to BOTH the YearSuccessEvidence and the MeetingMinutes. That
// dual attachment is what makes the indicator visible to meeting_followup_table, which
// derives "discussed" from notes shared between the minutes and a YSE. A YSE carrying an
// ask but no shared note would be silently absent from the follow-up.
// -------------------------------------------------------------------------------------

// --- 8.3-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-sfbrn-boundary-im-local-sep-2026-yse:2025-2026-8.3-ins-ssu-3f7a21c9"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Web and procurement have both formally moved into SFBRN and are handled centrally, so Sonoma no longer manages those reporting streams separately. Instructional materials has not been centralised and remains fully under Sonoma governance. Daniel Fontaine role in instructional materials is to collect, document and grade what Sonoma already does, with no operational input, which is the opposite of his role in web and procurement. Reports remain separate per campus for now because web and procurement details differ by campus even though the underlying system is shared."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-im-subcommittee-is-the-process-sep-2026-yse:2025-2026-8.3-ins-ssu-b18d4e02"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch identified the Instructional Materials Subcommittee as the process this indicator asks for, using the language of the indicator directly. The subcommittee meets regularly, sets annual priorities, and documents them in an Instructional Material Plan submitted each year including last year. His summary of current practice alongside it: regular CTET trainings published on the CTET events calendar, Canvas-based communications to faculty about textbook ordering deadlines, an active remediation workflow both automatic and by request, and public presentations on accessibility at campus events delivered mainly by Sandra Ayala. No standalone printed handouts were produced this past year."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-canvas-manual-still-unlinked-sep-2026-yse:2025-2026-8.3-ins-ssu-6c93a7f1"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "The Canvas Remediation Manual still carries no documentation node and no link. It was not asked for on 2026-09-03, so it remains the standing Documentation gap on this indicator from the 2026-09-02 review. It is a Canvas course, so nobody outside CTET can reach it. A June 2026 note records it being updated for the Ally to UDOIT and YuJa to Panopto tool changes, so the version in use may differ from the version described."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-six-key-components-video-sep-2026-yse:2025-2026-8.3-ins-ssu-e50b2d84"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Sandra Ayala organises faculty guidance around six core responsibilities in an AI-generated video distributed to all faculty at the start of each year. Five were stated on the record: ordering textbooks in a timely fashion, minimising PDF use, proper document formatting, captioning videos, and alt text for images in presentations. John Lynch prompted the accessible syllabus as the sixth but the item was not completed on the recording, so it is held as unconfirmed. The video is reinforced through orientation presentations, standalone workshops, and physical signage reminding faculty to order books through the bookstore."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 8.11-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.11-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-nfo-accessibility-segment-sep-2026-yse:2025-2026-8.11-ins-ssu-9a4c15b7"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch runs the Canvas orientation segment at New Faculty Orientation and includes a fifteen-minute discussion of what accessibility means and how to implement it in Canvas, with pointers to further CTET resources. Disability Services separately delivers a full one-hour presentation on compliance obligations relating to students with disabilities. Textbook ordering deadlines for early adoption are also covered. John Lynch confirmed he is the officially responsible person and that Universal Design for Learning content is delivered by him. Sandra Ayala has presented at orientation in various years and historically ran department-level introductory meetings each semester, each followed by a UDL workshop. This closes the Procedures and Resources elements. Documentation and Documentation evidence stay empty until the agenda and an attendance list arrive."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 8.12-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-workshop-cadence-and-types-sep-2026-yse:2025-2026-8.12-ins-ssu-2d68f30e"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Four distinct CTET workshop types run regularly through the semester: UDOIT, Tidy Up, Principles of Accessibility, and Panopto. Each runs roughly three to four sessions per semester, landing at about twelve sessions per semester. December is not scheduled. Faculty Learning Communities run roughly annually toward QLT certification, which carries accessibility as a certification component. Sandra Ayala notes accessibility content is increasingly carried inside other workshop types rather than existing only as standalone sessions, particularly AI-focused workshops, of which she has run at least half a dozen on using AI to support accessible content creation and equitable teaching."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-ladder-name-not-used-on-campus-sep-2026-yse:2025-2026-8.12-ins-ssu-77b1c9a5"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = false,
              n.content = "The word Ladder is not a name Sonoma uses. Neither John Lynch, Sandra Ayala nor Tim Hensel recognised it when it was read back to them. John Lynch believes it referred to a diagram at the foot of a related document rather than a formally named programme, and that the phrasing entered our record as a transcription artifact from a prior conversation. The underlying programme is real and was confirmed in detail. The node title is retained because it is traceable to the CTET online and hybrid teaching page the node was built from on 2026-09-02, and renaming would substitute one invented name for another. Reconsider the title if the campus supplies its own."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-completion-letters-discontinued-sep-2026-yse:2025-2026-8.12-ins-ssu-c4e07b23"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Completion letters are no longer issued. John Lynch confirmed participation is tracked internally instead, because faculty must complete the programme to be eligible for QLT review, which makes a separate completion letter redundant. Our record claimed a completion letter at each level and has been corrected. The stipend structure holds: 300 dollars at Level 1, 300 at Level 2, 400 at Level 3, and a 750 dollar external QLT review fee paid by SSU, currently active with business faculty this year and with accessibility explicitly included in that review. The Documentation evidence element now needs an internal participation record rather than a letter."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-march-flc-paid-session-sep-2026-yse:2025-2026-8.12-ins-ssu-18fa6d90"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "A paid one-day accessibility-focused faculty development session ran on 20 March 2026, the day before spring break, delivered jointly by John Lynch and Sandra Ayala and including hands-on AI-assisted accessibility work. Participating faculty were paid a 300 dollar stipend. John Lynch first said 350 and corrected himself to 300 against the programme documentation he opened during the call, so 300 is authoritative. He also stated that a link he had already sent Daniel Fontaine documents this session. That link is not yet recorded as documentation on any node."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-attendance-varies-with-campus-context-sep-2026-yse:2025-2026-8.12-ins-ssu-a3d51e6c"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Sandra Ayala reports workshop attendance swinging from over twenty attendees to as few as three across the fifteen years she has run them. She attributes the swing to campus conditions rather than to the sessions, citing presidential transition and programme cuts as periods when faculty engagement dropped, and asks that the fluctuation not be read as declining programme value. During COVID faculty prioritised getting courses online over making them accessible. The counterweight she credits is the policy change requiring an accessible syllabus as a baseline, which the team pushed through."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 8.14-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.14-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-tim-pd-formalised-sep-2026-yse:2025-2026-8.14-ins-ssu-5b2e84df"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Tim Hensel position was formally updated on 2026-09-02 to include accessible instructional materials responsibilities, and his title is now Accessibility Specialist. The change was approved and official as of the day before this meeting. This is the Resources element the 2026-09-02 review recorded as unevidenced on this indicator and on 8.12: Established requires ATI tasks added to campus job descriptions, and there is now one. His role holding has been updated from informally absorbed to in position description."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.14-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-student-worker-training-sep-2026-yse:2025-2026-8.14-ins-ssu-0e7c39ab"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Student workers go through active checklist-based training that Tim Hensel manages directly, demonstrating defined competencies by set dates. He enrols students in external accessibility coursework whenever it is available. In summer 2026 that included Cityscape-affiliated courses and University of Utah accessibility coursework, which he completed alongside a student. This is the training that belongs on this indicator, because student assistants doing remediation are employees with accessible instructional materials responsibilities. The faculty workshop series is deliberately not wired here, since this indicator covers employees rather than faculty."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 7.3-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.3-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-no-before-after-examples-sep-2026-yse:2025-2026-7.3-ins-ssu-d92f4a17"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch stated directly that Sonoma does not produce comparative before-and-after examples. Current guidance is closer to use this template or use a Canvas page instead of a PDF. The accessible syllabus template is real, shared in multiple places and promoted annually, but a template is not the created, distributed and updated example set the indicator asks for. Sandra Ayala described a past hands-on exercise where participants deconstructed and rebuilt a PDF from scratch, which was unpopular and not repeated. John Lynch distinguished that from what the indicator requires, since it was a one-time training exercise rather than a durable artifact. Tim Hensel proposed saving a real as-found and remediated pair out of routine remediation work, which was adopted as the path forward."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 7.5-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-self-service-tool-set-sep-2026-yse:2025-2026-7.5-ins-ssu-46b8e0c3"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch named the tools CTET currently promotes to faculty for creating accessible content themselves: UDOIT, the CSU-hosted PDF accessibility remediation application referred to at Sonoma as Willie Pang PDF remediator and shown to faculty directly, and Panopto for video captioning. Adobe Acrobat is the standard PDF accessibility tool alongside them. These are promoted through CTET events and the website event history, with regular semester-based training scheduling. He noted he is not certain how the indicator distinction between faculty and instructional staff changes what is provided, since the same tools and training apply to both. Sandra Ayala separately teaches faculty to source born-accessible alternative formats through the library, or to run a PDF through the Adobe Word export and post the resulting Word document instead."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-equatio-licensed-by-dss-sep-2026-yse:2025-2026-7.5-ins-ssu-b7420fd8"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch confirmed EquatIO is licensed by Disability Services, not by CTET. The evidence link from the Equatio Math Tool to this indicator has been marked external on that basis, because the owners of this evidence rely on a practice another unit controls. The DSS boundary question from the interview guide was not otherwise settled: whether Accessible Content Remediation counts as part of the faculty-facing resource set or belongs to Disability Services alone was never put to John Lynch or Tim Hensel directly, so it carries forward."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 5.11-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.11-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-automated-caption-standard-unsettled-sep-2026-yse:2025-2026-5.11-ins-ssu-31c9a6e4"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Verbit is still not available to CTET. Disability Services holds two individual licenses and CTET has no site license, and Tim Hensel reports the team is functioning adequately without it. John Lynch has spoken with Brent Boyer, who is interested in pursuing a site license because Disability Services is understaffed for standard accommodation request volume and sees automated Panopto captioning through Verbit as a way to offload some of that. John Lynch raised the question underneath the request: whether anyone has formally determined that automated captions meet accessibility standards, or whether a site license would pay for output no better than the automated captions Panopto already produces. Both questions are open."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 9.2-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-no-executive-committee-sep-2026-yse:2025-2026-9.2-ins-ssu-8ad3f512"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch raised the structural gap: governance requires an annual instructional materials plan submitted to and approved by an executive committee, and Sonoma has none. He has been raising it with Amanda McGowan directly. Daniel Fontaine hopes to establish one in 2027 but is not securing executive engagement at SFBRN level. The interim mechanism proposed is the review and approval workflow in the tracking database itself, where each campus reviews its evidence before it is finalised, which lends the reporting legitimacy without waiting for the committee. Sandra Ayala raised the executive sponsor question as distinct: historically an Associate Vice President level role approved by the campus president, giving one accountable person who could escalate to the Chancellor Office. Sonoma last filled it with Justin Lipp, who qualified only because he had moved into a technically eligible title. John Lynch is already listed publicly as Sonoma executive sponsor contact and is willing to hold the role as a stopgap, with Amanda McGowan explicit permission, though he believes it belongs with a Provost-level or senior SFBRN person. Sandra Ayala notes the title has little function while the committee it interfaces with does not exist."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 9.3-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.3-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-im-committee-reconstituted-sep-2026-yse:2025-2026-9.3-ins-ssu-fc0e7b96"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "John Lynch handed day-to-day organisation of the instructional materials committee to Sandra Ayala and Tim Hensel, and both agreed. Sandra Ayala acts in her Faculty Fellow role, now compensated through the CTEP budget for this responsibility. Tim Hensel acts in his newly formalised Accessibility Specialist role. The committee will include Disability Services and the bookstore among standing participants, and Daniel Fontaine will be invited going forward so activity is recorded and reported to SFBRN. The group deliberately held this session first before reconstituting, in order to understand how the SFBRN structure will work. Sandra Ayala notes cadence has varied between monthly and quarterly over fifteen years. Five years ago meetings ran two hours, one hour combined across procurement, web and instructional materials and a second hour in subgroups, particularly in the fall when annual report content was developed. She valued the cross-pollination of the combined format and hopes it is not lost now the groups are split. Daniel Fontaine is targeting a cross-campus all-groups meeting early in 2027 to set shared goals and build the year plan collaboratively."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 1.6-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.6-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-bookstore-adoption-reporting-sep-2026-yse:2025-2026-1.6-ins-ssu-2e5814ca"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Sandra Ayala described the bookstore relationship as a significant and longstanding piece of evidence. Steve Higginbotham, the bookstore manager, has sat on the ATI and instructional materials committee for nearly a decade. The relationship began when she visited the bookstore in person to track order data by hand and cross-reference it against Disability Services remediation page counts, which was unsustainable and led to inviting him onto the committee. Since then he has proactively built spreadsheets of adoption data which flow to deans, who push them out to faculty. Sonoma reinforces this through Canvas banners and repeated reminders at dean and department-meeting level. This is a semester reporting pipeline to campus administration, which is what this indicator asks for, and nothing was previously wired to it."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 7.1-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.1-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-adoption-comms-to-faculty-sep-2026-yse:2025-2026-7.1-ins-ssu-97d6b3e1"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Sonoma has an active early textbook adoption policy, which Daniel Fontaine confirmed he already holds a copy of. Faculty responsibility for timely adoption is communicated through several channels at once: adoption data from the bookstore reaching deans who push it to faculty, Canvas banners, reminders at dean and department-meeting level, textbook ordering deadlines covered at New Faculty Orientation, and timely ordering as the first of the six responsibilities in Sandra Ayala faculty video. Steve Higginbotham already implements this indicator and the reporting pipeline behind it is now recorded as an implementation."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 8.1-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.1-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-faculty-responsibilities-video-sep-2026-yse:2025-2026-8.1-ins-ssu-4c1a8f75"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "Sandra Ayala AI-generated video is distributed to all faculty at the start of each year and is reinforced through presentations at New Faculty Orientation and standalone workshops, and through physical signage and banners. It is the closest thing Sonoma has to a standing campus-wide accessibility communication for instructional materials. A printed piece titled Accessible Technology Initiative at Sonoma State University circulates alongside it, covering accessibility basics, who benefits, why it matters, Universal Design for Learning, and available tools. That piece is currently circulating as a photographed image rather than extractable text, which is not an accessible format, and neither Sandra Ayala nor John Lynch had the source file to hand."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 6.7-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.7-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-udoit-snapshot-scope-clarified-sep-2026-yse:2025-2026-6.7-ins-ssu-e83b06da"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "The scope of the annual UDOIT snapshot was settled. Daniel Fontaine needs one high-level annual data point showing the overall accessibility level of active Canvas courses, comparable year over year, taken at a single point such as November. He does not need a detailed twenty-point breakdown or a longitudinal series. Tim Hensel had been assuming something closer to longitudinal tracking. Tim Hensel also clarified that Sonoma own before and after remediation tracking lives outside UDOIT, in a separate document logged per course, and that this is deliberate: the UDOIT live report skews when faculty add new content after remediation, which makes it unreliable as a single source for how much was remediated in a semester. That separate tracking remains valuable as proof of work even though it is not what the ATI metric needs."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.7-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-ally-udoit-contradiction-sep-2026-yse:2025-2026-6.7-ins-ssu-70de2913"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = false,
              n.content = "Verification flag. The CTET workshop list given on 2026-09-03 includes Tidy Up, which is an Ally feature, while a June 2026 note records Sonoma moving off Ally onto UDOIT and off YuJa onto Panopto. Both cannot be current. No Ally tool node was created on the strength of a workshop title. Confirm which caption and course-check tools faculty actually use now before wiring either, because the 2024-2025 note crediting the YuJa caption editing interface as a faculty resource may describe a tool the campus has left."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);

// --- 6.8-ins ---
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.8-ins-ssu"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (n:Note {name: "ssu-nondestructive-optout-remediation-sep-2026-yse:2025-2026-6.8-ins-ssu-1f95c74b"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.date_created = date("2026-09-03"),
              n.include_in_report = true,
              n.content = "The question of whether deans or chairs object to instructional staff modifying course content was answered fully. CTET remediation is explicitly non-destructive: the team marks up existing structure such as headers rather than converting content types, and does not convert PDFs into Canvas pages. Any conversion of that kind would require separate conversations with deans and instructors. John Lynch added that Sonoma has briefed deans and secured their buy-in for the programme, which runs on an opt-out basis rather than opt-in, and that deans are part of the semester alert chain notifying faculty when their courses will be remediated. He noted that producing a new file version is replacing the file in a narrow technical sense, while the remediation itself leaves content intact. Remediation files currently sit on individual workstations under single sign-on, so a student worker leaving mid-task strands the work, which is what the shared network drive plan addresses."
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(dan);


// -------------------------------------------------------------------------------------
// 11. STAMP THE SOURCE MINUTES AND CLOSE THE GUIDE
// -------------------------------------------------------------------------------------

MATCH (g:InterviewGuide {unique_id: "102bec0f46184989b7315fc25f283fd4"})
MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
MERGE (g)-[:resulted_in]->(mm);

MATCH (mm:MeetingMinutes {unique_id: "1b2bb494575a4f30b012f2d4878868ed"})
SET mm.ontology_ingested = true,
    mm.ontology_ingest_date = date("2026-09-03"),
    mm.ontology_ingest_note = "Ingested by /ontology-ingest 2026-09-03. 6 implementations created (CTET Accessibility Workshop Series, New Faculty Orientation Accessibility Segment, CTET Student Worker Accessibility Training, ATI Faculty Responsibilities Video, Instructional Materials Subcommittee, Textbook Adoption Reporting via Bookstore). 1 Tool created (PDF Accessibility Remediation) with 1 Document. 3 Plans created, 1 Plan reopened (CCC training resources, was wrongly Completed). 9 Queries created, the first Query nodes at SSU. 2 Concerns, 2 Recommendations, 24 Notes across 14 YSEs. 2 Person updates (Tim Hensel title and position description, Sandra Ayala ati_role). 2 corrections (Ladder completion letters discontinued, Equatio evidence link marked external). Section headed 8.13 in the minutes quotes the text of 8.3-ins and was routed to 8.3-ins.";
