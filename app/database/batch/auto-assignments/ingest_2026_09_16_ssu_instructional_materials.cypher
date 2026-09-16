// =====================================================================================
// Ingest: Sonoma Instructional Materials Working Group, 2026-09-16.
// Source: MeetingMinutes "Sonoma Instructional Materials Working Group 9/16"
//         unique_id 530510aa4cc74e5cb6635fe365b637f1 (in the graph, not yet ingested)
// Run by Daniel Fontaine. Manifest approved 2026-09-16.
//
// ANCHORS
//   Year 2025-2026 (current reporting year), campus ssu, WGP 2025-2026-ssu-ins.
//   The minutes node already carries its WGP edge, the Academic Technology community and
//   three participants. Enriched here, not recreated.
//
// TITLE vs CONTENT
//   The minutes are titled "Instructional Materials Working Group". The content describes
//   the ATI Steering Committee's first session of the semester, concentrating on
//   instructional materials. Recorded in a note; nothing renamed.
//
// FOUR PEOPLE CREATED
//   Supplied by the recorder after the meeting, because the transcript names three of them
//   by first name only and does not name the fourth at all:
//     Kyle Falbo              falbok@sonoma.edu              Educational Technology Application Expert
//     Ayesha Rabadi-Raol      rabadiraol@sonoma.edu          Associate Professor
//     Kim D. Hester Williams  kim.hester.williams@sonoma.edu Professor, Literature
//     Youngmin Chun           chuny@sonoma.edu               Assistant Professor
//   employee_id values are randomly generated 9-digit numbers, checked against the graph
//   for collision before writing. They are NOT real employee numbers.
//   All four are created as committee members: active = true and
//   non_committee_member_active = false is what the roster read treats as committee
//   membership. neomodel defaults do not apply to raw Cypher, so every default is set here.
//   Youngmin Chun is NOT named anywhere in the transcript body. The transcript does say the
//   session opened with introductions for new and returning members, and the recorder
//   supplied all four together as the roster, so all four are wired as participants.
//
// IDENTITY RESOLUTIONS (existing nodes, none created)
//   "Sandy Ayala" -> Sandra Ayala · "Timothy" -> Tim Hensel · "John" -> John Lynch
//   "Noelia" -> Noelia Franzen · "Steve" -> Steve Higginbotham (Barnes & Noble Bookstore
//   Manager, which matches the book-order reporting) · "Brent" -> Brent Boyer (DSES).
//
// TWO NAMES DELIBERATELY NOT ACTED ON
//   "the departure of director Sean Hicks": the graph holds Shawn Hicks, SFSU Director of
//   Web and Mobile Applications, active = true. Almost certainly the same person by role.
//   No active flag is flipped on a transcript's say-so; the departure is recorded in a note.
//   "Kristen Denver", who built the accessible template, is historical and owns no current
//   work, so she stays in note prose with no node.
//
// NO IMPLEMENTATIONS CREATED
//   Every operating thing named already exists: Student Remediation Team (CTET),
//   Canvas Course Remediation (CTET), CTET Accessibility Workshop Series, Accessible
//   Syllabus Policy and Template, SSU Alternative Services, SSU Universal Access Services,
//   Textbook Adoption Reporting via Bookstore (SSU), Instructional Materials Subcommittee
//   (SSU), SSU ATI Program Overview (Committee & Ambassadors), APARC Committee, Course
//   Modality. UDOIT Advantage and Panopto already exist as Tools. This meeting reports
//   status against that machinery; it does not add to it.
//
// QUESTIONS SETTLED: 0 of 11.
//   Eleven Query nodes are open under 2025-2026-ssu-ins. Each was walked against the
//   source: the Canvas Remediation Manual export, the before-and-after PDF pair, the Verbit
//   site licence, the New Faculty Orientation agenda, both President Report questions, the
//   text-extractable orientation source file, the automated-captions determination, the
//   named executive sponsor, the sixth key component, and ownership of the Canvas PD
//   sequence. None is answered. The closest is the President Report: Daniel described a
//   centralised cross-campus dashboard, which is adjacent, but nothing says whether Sonoma
//   keeps producing its own report.
//
// TWO QUERIES WITH NO answerable_by
//   The RTP recognition question names deans and chairs collectively rather than a person.
//   The Zoom question is held by Kyle Falbo, who is created by this file, so that one IS
//   wired. Only the RTP query is left without the edge, and its detail carries the reason.
//
// DOWN-ROUTED
//   Small action items (Sandy's 4:45 blurb, compiling minutes to the ATI drive, forwarding
//   the PWAC information) -> notes. Ongoing operations already modelled as implementations
//   (Tim overseeing the student team, Steve continuing book orders, Noelia continuing
//   conversions) -> notes. Every figure -> note prose, no Metric nodes: running mid-semester
//   totals with no exportable artifact. The large accessibility event -> note, because the
//   start-small counter-proposal is what the group adopted.
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. PEOPLE
// -------------------------------------------------------------------------------------

MERGE (p:Person {name: "Kyle Falbo"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.email = "falbok@sonoma.edu",
              p.title = "Educational Technology Application Expert",
              p.employee_id = "648354269",
              p.active = true,
              p.can_approve_yse = false,
              p.non_committee_member_active = false;

MERGE (p:Person {name: "Ayesha Rabadi-Raol"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.email = "rabadiraol@sonoma.edu",
              p.title = "Associate Professor",
              p.employee_id = "894785306",
              p.active = true,
              p.can_approve_yse = false,
              p.non_committee_member_active = false;

MERGE (p:Person {name: "Kim D. Hester Williams"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.email = "kim.hester.williams@sonoma.edu",
              p.title = "Professor, Literature",
              p.employee_id = "111786244",
              p.active = true,
              p.can_approve_yse = false,
              p.non_committee_member_active = false;

MERGE (p:Person {name: "Youngmin Chun"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.email = "chuny@sonoma.edu",
              p.title = "Assistant Professor",
              p.employee_id = "773756328",
              p.active = true,
              p.can_approve_yse = false,
              p.non_committee_member_active = false;

MATCH (c:Campus {abbreviation: "ssu"})
MATCH (p:Person) WHERE p.name IN ["Kyle Falbo", "Ayesha Rabadi-Raol", "Kim D. Hester Williams", "Youngmin Chun"]
MERGE (p)-[:works_at_campus]->(c);


// -------------------------------------------------------------------------------------
// 2. MEETING WIRING
// -------------------------------------------------------------------------------------

// NO recorded_by statement here, deliberately. The minutes already carry
// minutes_recorded_by -> Daniel Fontaine, and every other MeetingMinutes in the graph has
// exactly one recorder. An earlier draft of this file added Sandra Ayala as a second,
// because the recon query asked for `recorded_by` when the predicate is
// `minutes_recorded_by`, bound nothing, and read as "no recorder set". The edge was
// removed. Sandra Ayala's commitment to recap the meeting and file the minutes is recorded
// in the action-items note instead, which is where it belongs.

MATCH (mm:MeetingMinutes {unique_id: "530510aa4cc74e5cb6635fe365b637f1"})
MATCH (p:Person) WHERE p.name IN [
  "Sandra Ayala", "John Lynch", "Daniel Fontaine", "Tim Hensel", "Noelia Franzen",
  "Steve Higginbotham", "Brent Boyer",
  "Kyle Falbo", "Ayesha Rabadi-Raol", "Kim D. Hester Williams", "Youngmin Chun"]
MERGE (p)-[:participated_in]->(mm);


// -------------------------------------------------------------------------------------
// 3. NOTES
// -------------------------------------------------------------------------------------

MERGE (n:Note {name: "ati-committee-semester-kickoff-sep-2026-yse:2025-2026-9.2-ins-ssu-3e71b8c5"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "First ATI Steering Committee session of the semester, chaired by Sandra Ayala, with introductions for new and returning members drawn from faculty, staff, disability services and educational technology. The committee covers instructional materials, procurement and web accessibility; this session concentrated on instructional materials. The minutes are filed under the title Instructional Materials Working Group, which describes the session's focus rather than the body that met.";

MERGE (n:Note {name: "ssu-accessibility-decade-history-sep-2026-yse:2025-2026-9.2-ins-ssu-a04f26d9"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Sandra Ayala gave a decade-long account of the campus's accessibility work. She served as the ATI representative on the Student Affairs Committee and the Academic Technology Committee, ran an ambassador programme for new faculty, and engaged APARC on course modality during COVID. The remediation programme began with hired staff and a Universal Access Hub under the library. COVID disrupted that operation and it later became a student-led team working from an accessible template built by Kristen Denver, who is no longer at the campus. The team has used both incentives and enforcement to move adoption.";

MERGE (n:Note {name: "chancellors-office-audit-history-sep-2026-yse:2025-2026-9.2-ins-ssu-7c53d1a8"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Sandra Ayala described a Chancellor's Office audit roughly eight years ago that found the campus out of compliance on 136 of 156 required items. She raised it as the low point the current programme was built out of. The figure is her recollection on the call and is not sourced to the audit document here.";

MERGE (n:Note {name: "student-remediation-team-status-sep-2026-yse:2025-2026-6.8-ins-ssu-b91e7f34"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Tim Hensel reported seven students working course remediation with UDOIT. Five courses have been completed since the semester began, most finishing above 99 percent compliance. These are running totals partway through the semester rather than a closed set, and no export backs them.";

MERGE (n:Note {name: "ctet-workshops-and-udoit-visibility-sep-2026-yse:2025-2026-8.12-ins-ssu-5d28a0f6"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Tim Hensel announced accessibility workshops of 30 to 45 minutes, short enough to help faculty with Panopto and UDOIT without disrupting their workload. Kim D. Hester Williams asked how to see a course's accessibility percentage; Tim Hensel explained it is visible inside Canvas through UDOIT's navigation.";

MERGE (n:Note {name: "ally-to-udoit-transition-sep-2026-yse:2025-2026-6.7-ins-ssu-e6b4c209"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Sandra Ayala listed software trials across the past decade, including the move from Ally to UDOIT as the automated course accessibility checker. UDOIT is the tool the student remediation team works from now.";

MERGE (n:Note {name: "obi-dashboard-and-indicator-grading-sep-2026-yse:2025-2026-9.2-ins-ssu-c17d64ba"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Daniel Fontaine described his role tracking and organising ATI data, capturing meeting transcripts and tracking success indicators for instructional materials across the three campuses, and the centralised dashboard the three campuses now report through. He proposed reviewing and grading the indicators with committee input, and prioritising five or six high-priority indicators for the coming months. He also noted that web and procurement are centralised within SFBRN.";

MERGE (n:Note {name: "web-procurement-centralisation-and-departure-sep-2026-yse:2025-2026-9.2-ins-ssu-0f9a3e71"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Daniel Fontaine reported the departure of director Sean Hicks alongside the centralisation of web and procurement within SFBRN. The graph holds Shawn Hicks, SF State Director of Web and Mobile Applications, still marked active. The two are almost certainly the same person and the spelling in the transcript is unverified, so no record was changed. Confirm the departure and the spelling before altering his record.";

MERGE (n:Note {name: "presidential-web-advisory-committee-sep-2026-yse:2025-2026-9.2-ins-ssu-4a8c5e02"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Kyle Falbo described Sonoma State's Presidential Web Advisory Committee and asked to be added to the web working group. He will forward the committee's information to Daniel Fontaine and Amanda McGowan.";

MERGE (n:Note {name: "dses-staffing-alt-media-sep-2026-yse:2025-2026-4.5-ins-ssu-d735b96e"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Brent Boyer reported staff changes in Disability Services for Students, with alt media production leaning more heavily on student assistants as a result. Noelia Franzen continues converting textbooks and materials into alternate formats. Sandra Ayala described the long-standing arrangement with Steve Higginbotham on book ordering for students with disabilities, which is what gives alt media production its lead time.";

MERGE (n:Note {name: "fall-book-orders-and-seawolf-bundle-sep-2026-yse:2025-2026-1.6-ins-ssu-92c4a8f1"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Steve Higginbotham reported 81 percent of course book orders procured for the fall semester, with 250 orders outstanding. Participation in the Seawolf bundle stands at 3,250 students and 44,000 credit hours. Figures are as stated on the call; no export backs them.";

MERGE (n:Note {name: "accessibility-event-scope-decision-sep-2026-yse:2025-2026-8.1-ins-ssu-6b0e14d7"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Sandra Ayala proposed a large-scale campus accessibility event drawing in community members, faculty, students and other campus organisations. Ayesha Rabadi-Raol argued for starting with smaller collaborations alongside existing organisations such as the Hub and the CAICE office rather than staging a large event first. The group adopted the smaller-first approach and deferred any large event. John Lynch offered to book space through CTET and support faculty participation.";

MERGE (n:Note {name: "accessibility-logo-and-student-input-sep-2026-yse:2025-2026-8.1-ins-ssu-1c96f5b3"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Sandra Ayala proposed redesigning the accessibility logo and producing new promotional material, with students consulted on both the design and the language. Kyle Falbo will approach Associated Students for participation. She also asked the committee to bring new communication ideas to the next meeting, and raised engaging deans and chairs to create incentives for faculty who adopt accessible course practices.";

MERGE (n:Note {name: "committee-action-items-sep-2026-yse:2025-2026-9.2-ins-ssu-8e42d70c"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Smaller commitments from the session, recorded here rather than as tracked plans. Sandra Ayala will send a blurb to Kyle Falbo for the Associated Students meeting on Friday by 4:45pm, and will recap the meeting and add minutes to the ATI drive folder. Kyle Falbo will forward the Presidential Web Advisory Committee information to Daniel Fontaine and Amanda McGowan. Tim Hensel will reach out to faculty who want to run UDOIT in their courses and add them to the remediation queue. Steve Higginbotham continues working with faculty on timely book orders and with Disability Services on alternate formats. Noelia Franzen continues alternate format conversion.";

// Attach every note to the minutes and stamp its author.
MATCH (mm:MeetingMinutes {unique_id: "530510aa4cc74e5cb6635fe365b637f1"})
MATCH (author:Person {name: "Daniel Fontaine"})
MATCH (n:Note) WHERE n.name ENDS WITH "-3e71b8c5" OR n.name ENDS WITH "-a04f26d9" OR n.name ENDS WITH "-7c53d1a8"
   OR n.name ENDS WITH "-b91e7f34" OR n.name ENDS WITH "-5d28a0f6" OR n.name ENDS WITH "-e6b4c209"
   OR n.name ENDS WITH "-c17d64ba" OR n.name ENDS WITH "-0f9a3e71" OR n.name ENDS WITH "-4a8c5e02"
   OR n.name ENDS WITH "-d735b96e" OR n.name ENDS WITH "-92c4a8f1" OR n.name ENDS WITH "-6b0e14d7"
   OR n.name ENDS WITH "-1c96f5b3" OR n.name ENDS WITH "-8e42d70c"
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author);

// Bind each note to the YSE named in its own name.
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-9.2-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.8-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-6.8-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.12-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-8.12-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-6.7-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-6.7-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-4.5-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.6-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-1.6-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.1-ins-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-8.1-ins-ssu" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);


// -------------------------------------------------------------------------------------
// 4. PLANS  (MERGE on `description`, the unique index on Plan — NOT `name`)
// -------------------------------------------------------------------------------------

MERGE (p:Plan {description: "Write and publish the ATI communication plan for the campus, with responsibilities divided among committee members rather than held by the chair alone. It covers how accessibility work is promoted to faculty, students and campus organisations, and includes the redesigned accessibility logo and the promotional material that goes with it, with students consulted on design and language. Done when the plan is written, responsibilities are assigned by name, and the committee has adopted it. Sandra Ayala asked every member to bring ideas to the next meeting."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Publish the ATI communication plan",
              p.plan_status = "In Progress",
              p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false;

MERGE (p:Plan {description: "Put an ATI table or presence at two or three campus events this semester, working alongside organisations that already run events rather than staging a new one. Ayesha Rabadi-Raol identifies the events and sends the list to John Lynch, who books CTET time and space and supports faculty participation. Done when the events are identified, booked, and staffed. A larger standalone accessibility event was proposed and deferred in favour of this approach."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Establish an ATI presence at two or three campus events this semester",
              p.plan_status = "In Progress",
              p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false;

MERGE (p:Plan {description: "Seat a student representative on the ATI steering committee. Kyle Falbo approaches Associated Students and Sandra Ayala offered to help recruit. Done when a named student is attending committee meetings. The committee wants student input on the accessibility logo and on the language used in campus communication, which is the immediate reason for the seat."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Recruit a student representative to the ATI committee",
              p.plan_status = "Not Started",
              p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false;

MERGE (p:Plan {description: "Get the coded success indicators for instructional materials reviewed and signed off by the Sonoma committee. Daniel Fontaine shares the dashboard and the reporting process with John Lynch and Sandra Ayala, then sends a first pass of the coded indicators for review. Done when John Lynch or Sandra Ayala has signed off on the first pass. Five or six high-priority indicators are then chosen for work over the coming months, and indicator grades are updated as later meetings supply evidence."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SSU: Review and sign off the coded success indicators for instructional materials",
              p.plan_status = "In Progress",
              p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false;

MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MATCH (p:Plan) WHERE p.name IN [
  "SSU: Publish the ATI communication plan",
  "SSU: Establish an ATI presence at two or three campus events this semester",
  "SSU: Recruit a student representative to the ATI committee",
  "SSU: Review and sign off the coded success indicators for instructional materials"]
MERGE (p)-[:in_academic_year]->(ay)
MERGE (wgp)-[:includes_plan]->(p);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.1-ins-ssu"})
MATCH (p:Plan) WHERE p.name IN [
  "SSU: Publish the ATI communication plan",
  "SSU: Establish an ATI presence at two or three campus events this semester"]
MERGE (p)-[:furthers_yse]->(y);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-ssu"})
MATCH (p:Plan) WHERE p.name IN [
  "SSU: Recruit a student representative to the ATI committee",
  "SSU: Review and sign off the coded success indicators for instructional materials"]
MERGE (p)-[:furthers_yse]->(y);


// -------------------------------------------------------------------------------------
// 5. QUERIES
// -------------------------------------------------------------------------------------

MERGE (q:Query {question: "How can accessible course practices be recognised in faculty RTP files?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "policy_decision",
              q.date_raised = date("2026-09-16"),
              q.detail = "Sandra Ayala raised recognition in retention, tenure and promotion files as the incentive most likely to move faculty adoption beyond the willing. Nothing in the RTP process currently credits accessible course practice. Settling it needs deans and chairs, who hold the criteria, and no individual was named as the decider, which is why no person carries this question.";

MATCH (q:Query {question: "How can accessible course practices be recognised in faculty RTP files?"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.1-ins-ssu"})
MATCH (raiser:Person {name: "Sandra Ayala"})
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser);

MERGE (q:Query {question: "What do the Zoom accessibility changes require of Sonoma State?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "information_gap",
              q.date_raised = date("2026-09-16"),
              q.detail = "Kyle Falbo raised changes to Zoom's accessibility on the call and the group deferred the subject to a later meeting. What changed, and what it obliges the campus to do about captioning and audio and video content, is unrecorded.";

MATCH (q:Query {question: "What do the Zoom accessibility changes require of Sonoma State?"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-ins"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.11-ins-ssu"})
MATCH (raiser:Person {name: "Kyle Falbo"})
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(raiser);


// -------------------------------------------------------------------------------------
// 6. CONCERN  (no natural key; MERGE on the has_concern pattern)
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-ssu"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "Alternate media production at Sonoma now leans on student assistants after Disability Services staff changes."})
ON CREATE SET c.unique_id = replace(randomUUID(), "-", ""),
              c.status = "open",
              c.date_raised = date("2026-09-16"),
              c.detail = "Brent Boyer reported staff changes in Disability Services for Students, with alt media production relying more on student assistants as a result. Student staffing turns over each year and carries no continuity of training. Nobody proposed a fix, no replacement hiring was named, and no decision is pending that would settle it. This bears on 4.5-ins because the indicator asks that alternate media production staff get timely access to instructional materials, and the constraint has moved from access to capacity.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.5-ins-ssu"})-[:has_concern]->(c:Concern {concern: "Alternate media production at Sonoma now leans on student assistants after Disability Services staff changes."})
MATCH (raiser:Person {name: "Brent Boyer"})
MERGE (c)-[:raised_by]->(raiser);


// -------------------------------------------------------------------------------------
// 7. STAMP
// -------------------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {unique_id: "530510aa4cc74e5cb6635fe365b637f1"})
SET mm.ontology_ingested = true,
    mm.ontology_ingest_date = date("2026-09-16"),
    mm.ontology_ingest_note = "4 people created (Kyle Falbo, Ayesha Rabadi-Raol, Kim D. Hester Williams, Youngmin Chun, all committee members, randomised 9-digit employee ids), 14 notes, 4 plans, 2 queries, 1 concern. No implementation created: every operating thing named already exists. 0 of 11 open queries settled.";
