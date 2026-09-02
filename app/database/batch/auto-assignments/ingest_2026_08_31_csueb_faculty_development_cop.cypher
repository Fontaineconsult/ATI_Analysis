// ===========================================================================
// Ingest: CSU East Bay - Faculty Development Community of Practice
// Source:  MeetingMinutes fe48944ef3fe4991980bcfe937549784 (2026-08-31)
// Guide:   InterviewGuide 736501f69a51400ba0e9c9d39325e7ba (already resulted_in)
// Ingested by: Daniel Fontaine, 2026-09-01
// ---------------------------------------------------------------------------
// RECON
//   Reporting year 2025-2026 (2026-2027 is scaffolded; reporting continues here).
//   WGP 2025-2026-csueb-ins confirmed. All six discussed YSEs exist.
//   No Recommendation and no Concern existed on any of them before this batch.
//
// SOURCE TEXT (this is what separates this pass from the first)
//   13 CSUEB pages were mirrored into raw_text on 2026-09-01 (46,675 chars)
//   before routing. Six decisions moved as a result:
//     1. Online Campus publishes a standing workshop calendar with six drop-in
//        Accessibility Working Sessions, UDOIT/TidyUp and an Accessibility
//        Compliance Update - 8.12 Procedures is artifact-backed, not testimony.
//     2. Faculty Development ran a five-session Title II accessibility series in
//        AY 2024-25 that NOBODY in the interview mentioned. Recorded separately
//        as Project ba5b4154887840ff95942dce230ccb20, evidencing
//        2024-2025-8.12-ins-csueb at strength 2, dated 2024-12-10 -> 2025-04-10.
//     3. Faculty Learning Circles pay 800 USD lead / 500 USD participant and
//        Working Groups paid 800/400, across themes that contain no
//        accessibility - which reframes R1 from find-funding to add-a-theme.
//     4. The calendar reads UDOIT and TidyUp; the transcript ASR rendered it as
//        UDOIT and Ally. TidyUp is real, Ally is down-routed to prose.
//     5. The syllabus page confirms the gap AND names the mechanism: common
//        elements are loaded into every Canvas course shell each term.
//     6. ScreenSteps presents as CSUEB Online Tools Help with no top-level
//        accessibility category, though it is cited at strength 3 on 8.3-ins.
//
// HEADER TYPO IN THE SOURCE
//   The minutes Purpose line lists indicator 8.1; the section beneath it is
//   about faculty orientation, which is 8.11-ins. A different, real 8.1-ins
//   exists at csueb (executive communication campaign). Anchored to 8.11-ins.
//
// IDENTITY
//   Resolved to existing nodes: Zach Oshri, Dawna Komorosky, Cheryl Saelee,
//   Daniel Fontaine, Pamela Baird, Shara Cheng.
//   Created here: Serena Kohgadai (SPELLING AS GIVEN - the transcript rendered
//   it Serena Kogadai; the chat-log spelling is used and needs verification),
//   Mark Robinson (contact details supplied by the user 2026-09-01).
//   Prose only, deliberately no node: Amara Miller - Cheryl asked that her name
//   not be committed to a written goal before she is approached.
//   Benjamin Smith (Academic Senate Chair) is named in R2 detail as the decider
//   but does no ATI work, so carries no node.
//
// JUDGMENT CALLS
//   R1 and R3 are REVIEWER ASKS, not proposals made in the room - both are
//   grounded in published fact plus the room's discussion, but nobody connected
//   them live. R2 is Zach Oshri's own recommendation (S3).
//   Cheryl's goal statement is a Plan, not a Recommendation: it carries owner
//   commitment language.
//   7.3-ins is flagged as under-graded via N7 rather than by inventing an
//   implementation - Zach described the practice, but where the examples are
//   hosted was not established.
// ===========================================================================


// --------------------------------------------------------------------- PEOPLE
MERGE (sk:Person {name: "Shara Cheng"})
SET sk.email = "shara.cheng@csueastbay.edu";

MERGE (mr:Person {name: "Mark Robinson"})
ON CREATE SET mr.unique_id = replace(randomUUID(), "-", ""),
              mr.active = true,
              mr.can_approve_yse = false,
              mr.non_committee_member_active = false
SET mr.email = "mark.robinson@csueastbay.edu",
    mr.title = "Academic Senate Coordinator";

MERGE (serena:Person {name: "Serena Kohgadai"})
ON CREATE SET serena.unique_id = replace(randomUUID(), "-", ""),
              serena.active = true,
              serena.can_approve_yse = false,
              serena.non_committee_member_active = false,
              serena.ati_role = "eLearning Specialist, Online Campus - helps faculty check and remediate courses and delivers accessibility training. Name spelling as given in the chat log; verify.";

MATCH (p:Person) WHERE p.name IN ["Mark Robinson", "Serena Kohgadai"]
MATCH (c:Campus {abbreviation: "csueb"})
MERGE (p)-[:works_at_campus]->(c);


// ------------------------------------------------------------ RECOMMENDATIONS
// R1 - reviewer's ask, grounded in the published Learning Circle programme.
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MERGE (y)-[:has_recommendation]->(r1:Recommendation {
  recommendation: "Add accessibility as a Faculty Learning Circle focus area."})
ON CREATE SET r1.unique_id = replace(randomUUID(), "-", ""),
              r1.status = "open",
              r1.date_created = date("2026-08-31"),
              r1.detail = "Faculty Development already runs a funded, recurring vehicle for exactly this kind of change. Faculty Learning Circles pay 800 dollars a semester to a lead faculty facilitator and 500 dollars to each participant, and the preceding Faculty Working Groups paid 800 and 400. None of the current focus areas - belonging and student engagement, sustaining ourselves while supporting students, and intentional teaching using AI - addresses accessibility. Adding accessibility as a focus area would put peer-to-peer advocacy on a compensated footing rather than asking faculty to absorb the work, which is the obstacle that has kept a faculty champion from emerging. Closing this means an accessibility circle listed in a future call with a named lead facilitator; the next move belongs to the Director of Faculty Development, who sets the focus areas.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MATCH (r1:Recommendation {recommendation: "Add accessibility as a Faculty Learning Circle focus area."})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (r1)-[:created_by]->(dan);

// R2 - Zach Oshri's own recommendation, made in the meeting (S3).
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MERGE (y)-[:has_recommendation]->(r2:Recommendation {
  recommendation: "Seek an Academic Senate requirement that faculty complete a modest annual accessibility training."})
ON CREATE SET r2.unique_id = replace(randomUUID(), "-", ""),
              r2.status = "open",
              r2.date_created = date("2026-08-31"),
              r2.detail = "Accessibility training at East Bay is provided but voluntary, and the sessions that run are lightly attended. The content is not the gap: Online Campus publishes a standing semester calendar carrying UDOIT and TidyUp training, six drop-in Canvas accessibility working sessions and a compliance update, and Faculty Development delivered a five-session Title II series in AY 2024-25. A Senate-adopted expectation of roughly one hour per year would give that existing programming an audience its owners have no authority to compel. The requirement has to originate with the Academic Senate, because neither Faculty Development nor Online Campus can mandate faculty participation. Any mandated session must fall inside an active contract period, which narrows the practical window to the start of term. Closing this means a Senate resolution setting the annual expectation together with a per-person completion record, since the campus currently keeps headcounts only; the next move is raising it with Academic Senate chair Benjamin Smith, reachable through Senate coordinator Mark Robinson.";

MATCH (r2:Recommendation {recommendation: "Seek an Academic Senate requirement that faculty complete a modest annual accessibility training."})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (r2)-[:created_by]->(dan);

// R3 - reviewer's ask; the mechanism comes from the syllabus page source text.
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-csueb"})
MERGE (y)-[:has_recommendation]->(r3:Recommendation {
  recommendation: "Add accessibility language to the common syllabus elements loaded into every Canvas course shell."})
ON CREATE SET r3.unique_id = replace(randomUUID(), "-", ""),
              r3.status = "open",
              r3.date_created = date("2026-08-31"),
              r3.detail = "The Revised Policy on Course Syllabus has two parts, and the first is a set of common elements that the university loads into every Canvas course shell each term. That insertion point already reaches every course without asking any instructor to act. Neither the policy resource nor its required elements currently carry accessibility or disability accommodation language, and the campus has no central syllabus database that would let anyone check coverage after the fact. Adding a short accessibility and accommodation statement to the common elements would make the reach universal and automatic rather than dependent on training attendance. Closing this means the accessibility statement appearing in the loaded common elements for a subsequent term; the next move is a request to the Academic Senate committee that owns the syllabus policy.";

MATCH (r3:Recommendation {recommendation: "Add accessibility language to the common syllabus elements loaded into every Canvas course shell."})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (r3)-[:created_by]->(dan);


// ----------------------------------------------------------------------- PLAN
// Cheryl Saelee's drafted goal. MERGE on description - that is the unique index
// on Plan, NOT name.
MERGE (pl:Plan {description: "Faculty Development and Online Campus jointly design and deliver an established training on creating accessible instructional materials, covering WCAG requirements, remediation technique by document type, and the campus procurement process for selecting accessible tools. The training is to be built into new faculty orientation more formally than the current invited-guest arrangement, and the group agreed to explore a lecturer-specific orientation that could carry it, since lecturers currently have no orientation of any kind. Owned jointly by the Director of Faculty Development and the Online Campus ATI Coordinator. Done when the training has a fixed slot, a named deliverer and a syllabus of its own, and has run once."})
ON CREATE SET pl.unique_id = replace(randomUUID(), "-", ""),
              pl.name = "CSUEB: Deliver a joint Faculty Development and Online Campus accessible-materials training",
              pl.plan_status = "Not Started",
              pl.is_key_plan = false,
              pl.is_campus_plan = false,
              pl.abandoned = false;

MATCH (pl:Plan) WHERE pl.name = "CSUEB: Deliver a joint Faculty Development and Online Campus accessible-materials training"
MATCH (ay:AcademicYear {name: "2025-2026"})
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan) WHERE pl.name = "CSUEB: Deliver a joint Faculty Development and Online Campus accessible-materials training"
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-csueb-ins"})
MERGE (wgp)-[:includes_plan]->(pl);

MATCH (pl:Plan) WHERE pl.name = "CSUEB: Deliver a joint Faculty Development and Online Campus accessible-materials training"
MATCH (y:YearSuccessEvidence) WHERE y.year_identifier IN ["2025-2026-8.11-ins-csueb", "2025-2026-8.12-ins-csueb"]
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------- NOTES
// N1 - the attendance constraint (8.12). Builds on the existing 08-19 note.
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MERGE (n1:Note {name: "csueb-fd-attendance-constraint-aug-2026-yse:2025-2026-8.12-ins-csueb-7c41b8e2"})
ON CREATE SET n1.unique_id = replace(randomUUID(), "-", ""),
              n1.date_created = date("2026-08-31"),
              n1.include_in_report = true,
              n1.content = "Attendance, not provision, is the binding constraint on faculty accessibility training at East Bay. Cheryl Saelee confirmed attendance is not tracked by individual - only headcounts are kept - and described the sessions as not required and very lightly attended. Dawna Komorosky said the team has experimented with scheduling during university hour to maximise availability and encourages participation, but has no ability to mandate attendance, which would require authority above her role. Zach Oshri called attendance the core problem to fix: faculty who do attend generally find the content useful and most go on to apply it, though a subset does not retain it. His overall characterisation of the current state was not horrible, but not great. On a faculty champion model he was sceptical for East Bay specifically, because faculty who do this work well tend to be adjunct or non-tenured and the work carries no compensation for people who are already not well paid. Cheryl named one existing peer advocate, a department chair in sociology who has pushed her own faculty on accessibility and attempted to hire a student assistant for departmental remediation, an effort that did not fully succeed. Cheryl asked that this person not be named in a written goal before being approached, and that request is honoured here and in the graph. Cheryl also said she does not consider improving attendance to be low-hanging fruit given the structural difficulty.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n1:Note {name: "csueb-fd-attendance-constraint-aug-2026-yse:2025-2026-8.12-ins-csueb-7c41b8e2"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n1)
MERGE (mm)-[:has_note]->(n1)
MERGE (n1)-[:created_by]->(dan);

// N2 - the Title II series nobody mentioned (8.12).
MERGE (n2:Note {name: "csueb-title-ii-series-unmentioned-aug-2026-yse:2025-2026-8.12-ins-csueb-3f92d17a"})
ON CREATE SET n2.unique_id = replace(randomUUID(), "-", ""),
              n2.date_created = date("2026-08-31"),
              n2.include_in_report = true,
              n2.content = "Faculty Development published a five-session Title II accessibility workshop series for AY 2024-25 on its own Programs page: an LMS accessibility standards workshop in December 2024, UDL 101 and UDL 102 in February and March 2025, a Faculty Panel on Accessibility in March 2025, and a session on accessible technology selection and the purchasing process in April 2025. Neither the Director of Faculty Development nor the ATI Coordinator raised this series during the 2026-08-31 interview, in a conversation specifically about what recurs in faculty development. It was found afterwards by mirroring the page source text. It is recorded as a completed Project evidencing 2024-2025-8.12-ins-csueb at partial strength, because the campus publishes it as an AY 2024-25 series with no successor listing. Whether it ran again in AY 2025-26 is unconfirmed and should be settled with Dawna Komorosky or Cheryl Saelee before any grade relies on it. That an evidenced, funded series can be invisible to both its own office and the ATI Coordinator within eighteen months is itself the finding worth carrying forward.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n2:Note {name: "csueb-title-ii-series-unmentioned-aug-2026-yse:2025-2026-8.12-ins-csueb-3f92d17a"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n2)
MERGE (mm)-[:has_note]->(n2)
MERGE (n2)-[:created_by]->(dan);

// N3 - orientation coverage gap (8.11).
MERGE (n3:Note {name: "csueb-orientation-coverage-gap-aug-2026-yse:2025-2026-8.11-ins-csueb-b5e07c93"})
ON CREATE SET n3.unique_id = replace(randomUUID(), "-", ""),
              n3.date_created = date("2026-08-31"),
              n3.include_in_report = true,
              n3.content = "New Faculty Orientation is offered to tenure-track faculty only. There is no lecturer equivalent, and Daniel Fontaine asked that this be recorded specifically. Dawna Komorosky runs the orientation and invites Accessibility Services to participate, so new faculty do receive information from them during the week; Cheryl Saelee presents and introduces UDOIT, aiming at awareness that Title II obligations exist and that a scanning tool is available, without going into remediation technique. The accessibility segment is therefore an invitation rather than an assigned responsibility, and it sits in nobody's position description. Dawna clarified that orientation itself runs Monday to Wednesday of the week, with campus entities presenting for one to two hours each, and that Back to the Bay is a related but distinct part of the broader week; the published Programs page describes Back to the Bay as the annual event held on the last Thursday before fall instruction, co-sponsored since 2003 by Academic Affairs, Faculty Development and Online Campus. The published New Faculty Orientation description carries no accessibility content at all. Faculty in Extension and Continuing Education are excluded from Faculty Development programming by published eligibility rules, which matches Cheryl's account that Extension faculty do not go through the RTP process. For the past two years an accessibility-specific workshop of roughly an hour has run within this programming, covering remediation practice and requirements; attendance is not compulsory because faculty self-select sessions. Cheryl confirmed an attendee list and a slide deck exist and can be provided - both are still outstanding as artifacts.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.11-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n3:Note {name: "csueb-orientation-coverage-gap-aug-2026-yse:2025-2026-8.11-ins-csueb-b5e07c93"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n3)
MERGE (mm)-[:has_note]->(n3)
MERGE (n3)-[:created_by]->(dan);

// N4 - Faculty Development's own site routes faculty to accessibility support (8.12).
MERGE (n4:Note {name: "csueb-fd-resources-routes-accessibility-sep-2026-yse:2025-2026-8.12-ins-csueb-d81a4f60"})
ON CREATE SET n4.unique_id = replace(randomUUID(), "-", ""),
              n4.date_created = date("2026-09-01"),
              n4.include_in_report = true,
              n4.content = "Faculty Development's own Resources page carries a substantive ADA Resources section, captured as source text on 2026-09-01. It states the April 24 2026 Title II compliance deadline, enumerates the course material categories that must be accessible, points faculty to the Online Campus Accessibility Compliance for Digital Teaching and Learning page for workshops and recordings, links the Accessible Course Materials Remediation form for PDF, Word and PowerPoint remediation in specific courses, links UDOIT as the Canvas app that identifies documents needing remediation, cites the CIC 47 textbook and instructional materials accessibility policy, names Cheryl Saelee of Online Campus as the contact, and directs readers to the Title II Workshops AY 2024-25 listing under Programs. This is published evidence that accessibility information is integrated into faculty development, and it was not raised in the interview. The page also documents the Google to Microsoft migration guidance, which is the same migration Dawna referenced as the reason Senate documents may move off Google Docs.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n4:Note {name: "csueb-fd-resources-routes-accessibility-sep-2026-yse:2025-2026-8.12-ins-csueb-d81a4f60"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n4)
MERGE (mm)-[:has_note]->(n4)
MERGE (n4)-[:created_by]->(dan);

// N5 - syllabus mechanism and gap (7.5).
MERGE (n5:Note {name: "csueb-syllabus-mechanism-and-gap-sep-2026-yse:2025-2026-7.5-ins-csueb-6a2c9be4"})
ON CREATE SET n5.unique_id = replace(randomUUID(), "-", ""),
              n5.date_created = date("2026-09-01"),
              n5.include_in_report = true,
              n5.content = "Dawna Komorosky confirmed East Bay has a syllabus policy with no accessibility component, and that sample syllabi are kept at department level rather than centrally. The Faculty Development syllabus page, captured as source text on 2026-09-01, corroborates this and supplies the mechanism that makes it actionable: the Revised Policy on Course Syllabus has two parts, the first being common syllabus elements that the university loads into every Canvas course shell each term, the second being required elements completed by the instructor. The page lists inclusive-syllabus topical guides including Universal Design for Learning, and four sample syllabi in History, Geology, Kinesiology and Accounting, but carries no accessibility or disability accommodation language in its required elements. There is no central accessible syllabus database. The loaded common elements are the natural insertion point, which is what recommendation R3 on this evidence proposes.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.5-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n5:Note {name: "csueb-syllabus-mechanism-and-gap-sep-2026-yse:2025-2026-7.5-ins-csueb-6a2c9be4"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n5)
MERGE (mm)-[:has_note]->(n5)
MERGE (n5)-[:created_by]->(dan);

// N6 - ScreenSteps evidence rating flag (8.3).
MERGE (n6:Note {name: "csueb-screensteps-rerate-flag-sep-2026-yse:2025-2026-8.3-ins-csueb-9d3e5a17"})
ON CREATE SET n6.unique_id = replace(randomUUID(), "-", ""),
              n6.date_created = date("2026-09-01"),
              n6.include_in_report = false,
              n6.content = "Data-quality flag rather than campus evidence. The ScreenSteps Faculty Guides node is titled Canvas and Accessibility and is cited as strength 3 evidence on 8.3-ins. Its live library, mirrored as source text on 2026-09-01, presents as CSUEB Online Tools Help and is organised around Canvas, Zoom, Turnitin, Panopto, GoReact, Adobe, Grackle Docs and iClicker, with featured articles on Canvas course setup and Blackboard migration. Accessibility does not appear as a top-level category or in the featured articles. The strength 3 rating on that evidence link should be re-examined against what the library actually contains, and the node title may be overstating its accessibility coverage.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.3-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n6:Note {name: "csueb-screensteps-rerate-flag-sep-2026-yse:2025-2026-8.3-ins-csueb-9d3e5a17"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n6)
MERGE (mm)-[:has_note]->(n6)
MERGE (n6)-[:created_by]->(dan);

// N7 - 7.3 is under-graded; Zach's example-based training practice.
MERGE (n7:Note {name: "csueb-accessible-examples-practice-aug-2026-yse:2025-2026-7.3-ins-csueb-4e8b06fc"})
ON CREATE SET n7.unique_id = replace(randomUUID(), "-", ""),
              n7.date_created = date("2026-08-31"),
              n7.include_in_report = true,
              n7.content = "This indicator is graded Defined against a note stating there is no formal process, and that note now looks out of date. Zach Oshri described, as current first-person practice, exactly what the indicator asks for. He breaks training apart by document type - Word, PowerPoint and others - covering the structural elements for each including headings, alternate text and tables, and extending to more advanced items such as document metadata, with the aim of genuinely fully compliant output rather than surface fixes. He maintains multiple example categories deliberately: documents that look accessible but are not, documents that are obviously inaccessible, and clean fully accessible examples. After each session he emails participants the working documents and the slides used, so attendees hold a clean reference copy plus step-by-step guidance for reproducing the standard themselves. That is creation, distribution and update of examples of accessible instructional materials. No implementation node has been created from this description because where the examples are hosted was not established in the meeting - Zach confirmed a previously logged link reflects the content, but only approximately. Obtaining that location is the artifact that would let this be wired properly and the grade revisited.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.3-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n7:Note {name: "csueb-accessible-examples-practice-aug-2026-yse:2025-2026-7.3-ins-csueb-4e8b06fc"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n7)
MERGE (mm)-[:has_note]->(n7)
MERGE (n7)-[:created_by]->(dan);

// N8 - professional development status (8.14).
MERGE (n8:Note {name: "csueb-pd-status-and-cic47-aug-2026-yse:2025-2026-8.14-ins-csueb-2b7f4c85"})
ON CREATE SET n8.unique_id = replace(randomUUID(), "-", ""),
              n8.date_created = date("2026-08-31"),
              n8.include_in_report = true,
              n8.content = "Asked whether there is budget or expectation for ongoing training in accessible instructional materials, Dawna Komorosky said no, not for her role. Zach Oshri confirmed he attends conferences related to this work, and confirmed that this is employer-funded with a role-based expectation of attending rather than a personal activity, which is the test for counting it as evidence. That is currently the only concrete professional development instance on the record for this indicator. The CIC 47 / FAC 14 / FDEC 5 policy dated February 13 2005 is wired as evidence here, but it is a policy rather than a professional development process, and it should be checked that it is not carrying the grade on its own. Dawna is not familiar with the document, does not sit on the Committee on Instruction and Curriculum, and does not know the current committee chairs; Cheryl Saelee recalled seeing it when it was approved but has not reviewed it since. The document exists only as a Google Doc rather than in a formal policy repository. Cheryl noted all East Bay Senate documents currently live in Google Docs; Dawna expects this to change over the next year as part of a broader Google to Microsoft move. PolicyStat is reportedly moving through procurement at East Bay. Follow-up contacts logged: Mark Robinson, Academic Senate Coordinator, and Benjamin Smith, Academic Senate Chair.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.14-ins-csueb"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MATCH (n8:Note {name: "csueb-pd-status-and-cic47-aug-2026-yse:2025-2026-8.14-ins-csueb-2b7f4c85"})
MATCH (dan:Person {name: "Daniel Fontaine"})
MERGE (y)-[:has_note]->(n8)
MERGE (mm)-[:has_note]->(n8)
MERGE (n8)-[:created_by]->(dan);


// ------------------------------------------------------ OPEN QUERY ANNOTATIONS
// None of the three open csueb-ins queries is settled by this source. Each gains
// what the meeting actually added; status deliberately unchanged.
MATCH (q:Query {unique_id: "2f536974-47bf-403f-83bd-d9568717c193"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MERGE (qn1:Note {name: "csueb-zero-cost-policy-optin-aug-2026-query-2f536974"})
ON CREATE SET qn1.unique_id = replace(randomUUID(), "-", ""),
              qn1.date_created = date("2026-08-31"),
              qn1.include_in_report = false,
              qn1.content = "Not settled. Dawna Komorosky believed a zero-cost / low-cost course materials policy exists; Cheryl Saelee confirmed it was written and presented but was uncertain whether it was formally signed into Academic Senate, believing it may have been. The formal adoption question therefore remains open. The meeting did add an enforcement answer to what was asked as an adoption question: Dawna confirmed the policy is opt-in, so faculty are encouraged but not required to participate. Mark Robinson, Academic Senate Coordinator, is the route to confirming the adoption record."
MERGE (q)-[:has_note]->(qn1)
MERGE (mm)-[:has_note]->(qn1);

MATCH (q:Query {unique_id: "c117d1ca-9f66-4a75-a517-ea63493d6072"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MERGE (qn2:Note {name: "csueb-textbook-owner-still-unnamed-aug-2026-query-c117d1ca"})
ON CREATE SET qn2.unique_id = replace(randomUUID(), "-", ""),
              qn2.date_created = date("2026-08-31"),
              qn2.include_in_report = false,
              qn2.content = "Not settled, and reinforced. Neither Dawna Komorosky nor Cheryl Saelee could confirm a single owner for timely textbook adoption. Dawna suggested the bookstore; Cheryl suggested it might be the library. Dawna proposed reaching out to someone named Kristen, without a surname. Daniel Fontaine noted this mirrors SF State, where no single person owns the process either and it gets picked up ad hoc. Two independent interviews at this campus have now failed to name an owner, which is itself the answer worth recording."
MERGE (q)-[:has_note]->(qn2)
MERGE (mm)-[:has_note]->(qn2);

MATCH (q:Query {unique_id: "b0ef0cf5-cacf-4e71-a0bc-9ff74e5780f0"})
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
MERGE (qn3:Note {name: "csueb-no-central-syllabus-database-sep-2026-query-b0ef0cf5"})
ON CREATE SET qn3.unique_id = replace(randomUUID(), "-", ""),
              qn3.date_created = date("2026-09-01"),
              qn3.include_in_report = false,
              qn3.content = "The East Bay half of this question is now firmly answered and the cross-campus half is not, so the query stays open. East Bay maintains no central accessible syllabus database. Dawna Komorosky confirmed there is a syllabus policy without an accessibility component, and that sample syllabi are held at department level. The Faculty Development syllabus page, mirrored as source text on 2026-09-01, corroborates this: it publishes four sample syllabi only, and its required elements carry no accessibility language. It also names the mechanism that matters for any future adoption - the university loads a set of common syllabus elements into every Canvas course shell each term. Which other CSU campuses maintain central syllabus databases remains unanswered."
MERGE (q)-[:has_note]->(qn3)
MERGE (mm)-[:has_note]->(qn3);


// ------------------------------------------------------------- STAMP THE SOURCE
MATCH (mm:MeetingMinutes {unique_id: "fe48944ef3fe4991980bcfe937549784"})
SET mm.ontology_ingested = true,
    mm.ontology_ingest_date = date("2026-09-01"),
    mm.ontology_ingest_note = "Ingested 2026-09-01 after mirroring 13 CSUEB pages into raw_text. Created: 3 Recommendations (8.12 x2, 7.5 x1), 1 Plan (furthers 8.11 and 8.12), 8 YSE notes, 3 open-query notes, 2 Person nodes (Mark Robinson, Serena Kohgadai - spelling as given), 1 email backfill (Shara Cheng). Recorded separately outside this file: Project Title II Faculty Workshop Series AY 2024-25 evidencing 2024-2025-8.12-ins-csueb at strength 2; 4 new Webpage nodes; 2 implementations retired (ICT Training Materials, Tutorials for creating accessible content). None of the 3 open csueb-ins queries was settled. Amara Miller deliberately not created as a node at Cheryl Saelee's request.";
