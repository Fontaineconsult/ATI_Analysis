// =====================================================================================
// Ingest: CSU East Bay Library, instructional materials accessibility, 2026-09-16.
// Source: MeetingMinutes "Meeting Notes: CSU East Bay - Library Instructional Materials
//         Accessibility", unique_id ba6f93a029c84ea989593415a3b8d5ee (not yet ingested).
// Run by Daniel Fontaine. Manifest approved 2026-09-16.
//
// THIS MEETING CLOSES A GUIDE
//   InterviewGuide 1ed3a444f71f400da4d234d7fe519e4c, "Interview: CSUEB Library, 7.11-ins
//   preliminary", prepped this session and had no resulted_in. The stamp step sets it.
//
// ANCHORS
//   Year 2025-2026, campus csueb, WGP 2025-2026-csueb-ins. The minutes already carry the
//   WGP edge, the Library community, Kristin Hart and Zach Oshri as participants, and
//   Daniel Fontaine as recorder. Enriched, not recreated.
//
// GUIDE COVERAGE, ELEMENT BY ELEMENT
//   Position   Partially answered. Kristin Hart named a person with some of this in their
//              job description. That person is Gr Keer, created below. How much is
//              operationalised is unconfirmed and is chased by a query. Daniel logged Zach
//              Oshri as de facto owner of library asset remediation.
//   Budget     Answered, and the answer is that there is no separate allocation. The work
//              routes to Zach Oshri and is absorbed into his existing ATI Coordinator role.
//              Against the maturity bar that is resources identified, not allocated.
//   Procedures Partially answered, plus a correction. Licensed content gets an ICT review
//              at purchase, now routed through CSU Buy. Open-access content enabled in Alma
//              is unknown. Barrier routing goes to Accessibility Services then Zach's team,
//              possibly scoped to interlibrary loan only. A form exists, unlocated.
//   Output     Answered, adversely, and it is the decisive finding. Zach Oshri's team has
//              received zero requests through the barrier pathway to date.
//
// A CORRECTION TO THE GUIDE'S OWN RECON
//   The guide's Position row said "Nothing named. Kristin Hart owns no implementation".
//   That was read off implementation ownership and missed the Person-to-YSE `implements`
//   edge. Both Kristin Hart AND Zach Oshri already implement 2025-2026-7.11-ins-csueb.
//   Those edges pre-date this meeting and are not created here. What the meeting adds is
//   that Zach is the operational remediation owner and the position-description question
//   is still open.
//
// PEOPLE
//   Gr Keer created. "Gurr Keer" in the transcript was Kristin Hart's spelling as heard.
//   Real identity supplied by the recorder afterwards. employee_id is a randomly generated
//   9-digit number, collision-checked, and is NOT a real employee number. She is created as
//   an ACTIVE NON-COMMITTEE member (active = true, non_committee_member_active = true),
//   because she is a librarian who may hold accessibility duties and is not on the ATI
//   committee. That is the opposite of the four Sonoma committee members created on the
//   same day; set non_committee_member_active = false if she should appear on the roster.
//   Not created: David Walker (Chancellor's Office), Jake and Jane (former committee
//   convenors), Jean, Rafael. All peripheral or historical, so note prose only.
//   "Pamela" resolves to Pamela Baird, already in the graph, who committed to nothing here.
//
// STATUS IS NOT TOUCHED
//   Daniel said on the call that Defined is too high for 7.11 and the evidence supports
//   Initiated. status_is moves only through admin review, so that judgment is filed as a
//   Recommendation naming Initiated as the target and documentation as the condition.
//
// QUESTIONS SETTLED: 2 of 3 the guide listed.
//   Settled: the zero-cost policy adoption, and textbook adoption ownership.
//   Left open: "Which CSU campuses maintain central syllabus databases, and should East Bay
//   adopt one?" is half answered. East Bay has none and is working toward one; the
//   cross-campus survey half is untouched. Annotated rather than settled, because settling
//   on half an answer loses the half nobody has done.
//
// A STALE NOTE IS SUPPRESSED
//   Note adf4e49ff3a845079a3d28215341b89b claims the Learning Commons handles conversion
//   for library assets. Kristin Hart and Zach Oshri both confirmed that is outdated.
//   include_in_report goes to false. The note is NOT deleted and NOT detached: it is the
//   record of what was believed, and it is attached to three years. A corrected note is
//   written alongside it.
//
// NO TOOLS
//   Alma, the ULSP, the ECC and CSU Buy stay in note prose. None is an asset that takes
//   remediation or a tool that provides it, following the ruling on P2P.
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. PERSON
// -------------------------------------------------------------------------------------

MERGE (p:Person {name: "Gr Keer"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.email = "gr.keer@csueastbay.edu",
              p.title = "Associate Librarian, Community Engagement & Outreach Librarian",
              p.employee_id = "587399556",
              p.active = true,
              p.can_approve_yse = false,
              p.non_committee_member_active = true;

MATCH (c:Campus {abbreviation: "csueb"})
MATCH (p:Person {name: "Gr Keer"})
MERGE (p)-[:works_at_campus]->(c);


// -------------------------------------------------------------------------------------
// 2. THE AFFORDABLE LEARNING COMMITTEE
// -------------------------------------------------------------------------------------

MERGE (pr:Process {title: "Affordable Learning Committee (CSUEB)"})
ON CREATE SET pr.unique_id = replace(randomUUID(), "-", ""),
              pr.description = "A CSU East Bay Academic Senate committee that leads Senate policy work on textbook adoption and oversees its implementation. It passed an amendment to the textbook adoption policy requiring faculty to tag zero-textbook-cost courses. It is the body a proposal to require syllabus deposit goes through.";

MATCH (pr:Process {title: "Affordable Learning Committee (CSUEB)"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.1-ins-csueb"})
MERGE (pr)-[:is_evidence_for]->(y);


// -------------------------------------------------------------------------------------
// 3. SETTLE THE TWO QUERIES THE GUIDE LISTED
// -------------------------------------------------------------------------------------

MATCH (q:Query {unique_id: "2f536974-47bf-403f-83bd-d9568717c193"})
MATCH (settler:Person {name: "Kristin Hart"})
SET q.status = "settled",
    q.date_settled = date("2026-09-16"),
    q.answer = "Yes. Kristin Hart confirmed the zero-cost and low-cost course materials policy has been formally adopted at CSU East Bay. The Affordable Learning Committee, an Academic Senate committee, subsequently passed an amendment requiring faculty to tag zero-textbook-cost courses."
MERGE (q)-[:query_settled_by]->(settler);

MATCH (q:Query {unique_id: "c117d1ca-9f66-4a75-a517-ea63493d6072"})
MATCH (settler:Person {name: "Kristin Hart"})
SET q.status = "settled",
    q.date_settled = date("2026-09-16"),
    q.answer = "Ownership is shared rather than held by one person. Kristin Hart and Zach Oshri discuss textbook adoption regularly and no single individual is named. The Affordable Learning Committee is the Academic Senate body that leads the policy work and oversees its implementation, so it is the stakeholder body to list against this process."
MERGE (q)-[:query_settled_by]->(settler);


// -------------------------------------------------------------------------------------
// 4. SUPPRESS THE STALE NOTE
// -------------------------------------------------------------------------------------

MATCH (n:Note {unique_id: "adf4e49ff3a845079a3d28215341b89b"})
SET n.include_in_report = false;


// -------------------------------------------------------------------------------------
// 5. NOTES
// -------------------------------------------------------------------------------------

MERGE (n:Note {name: "learning-commons-routing-corrected-sep-2026-yse:2025-2026-7.11-ins-csueb-c3a71e58"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Corrects the March 2026 note, which said the Learning Commons in the library assists with conversions when a library asset needs to be made accessible. Kristin Hart and Zach Oshri both confirmed that routing is outdated. A barrier now goes to Accessibility Services, which triages it and sends it to Zach Oshri's team. The Learning Commons is a general service and triage point that routes users to the right place rather than resolving accessibility problems itself, and Zach Oshri confirmed it does occasionally send work his way. The earlier note has been set to exclude from the report and left in place as the record of what was previously believed.";

MERGE (n:Note {name: "library-asset-remediation-ownership-sep-2026-yse:2025-2026-7.11-ins-csueb-9f24b6d1"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Zach Oshri is the de facto owner of library asset remediation for the university. Barriers route to him through Accessibility Services and his team resolves them. There is no separate staff time or funding for this work; it is absorbed into his existing ATI Coordinator role, which against the maturity bar is resources identified rather than allocated. Kristin Hart believes someone in the library has some digital accessibility responsibility written into their job description and named Gr Keer, Associate Librarian for Community Engagement and Outreach. How much of that is operationalised is unconfirmed. Kristin Hart and Zach Oshri were both already recorded as implementing this evidence record before the meeting.";

MERGE (n:Note {name: "barrier-pathway-zero-volume-sep-2026-yse:2025-2026-7.11-ins-csueb-5e08c9a3"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Zach Oshri's team has received zero requests through the library accessibility barrier pathway to date. The mechanism came out of a conversation East Bay had with the Chancellor's Office, most likely with David Walker, about barriers encountered through interlibrary loan. Zach Oshri was explicit that the mechanism as understood may be scoped to interlibrary loan content rather than all library assets. A form exists, per Kristin Hart, whose scope and location were not pinned down. Daniel Fontaine noted SF State has designated staff and a chatbot routing system and also sees few requests, so low volume may not be specific to East Bay. Whether zero requests means few barriers or a pathway that does not reach students is unresolved.";

MERGE (n:Note {name: "library-acquisition-review-routing-sep-2026-yse:2025-2026-7.11-ins-csueb-b74d2f06"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Most library content is licensed, bought either by the library directly or centrally through the CSU system on behalf of all campus libraries. Licensed content gets an accessibility review at the point of purchase, which Kristin Hart referred to as the ICT review and which checks the platform for accessibility features. Daniel Fontaine confirmed that review now routes through CSU Buy under the SFBRN structure. Whether freely available content curated into the library's platform gets any review is unknown.";

MERGE (n:Note {name: "library-platform-infrastructure-sep-2026-yse:2025-2026-7.11-ins-csueb-a19e5c74"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "The Unified Library Services Platform is managed centrally by the Chancellor's Office and delivers the Electronic Core Collection, which is content purchased centrally for all CSU libraries. Alma is the Unified Library Management System underneath it. Libraries can turn on open access collections within Alma, potentially locally as well as centrally. Kristin Hart's sense is that accessibility is probably considered when deciding to enable a collection, partly because open access carries no cost and so never triggers a procurement review, but she could not confirm it.";

MERGE (n:Note {name: "learning-commons-assistive-tech-lab-sep-2026-yse:2025-2026-7.11-ins-csueb-d820a4b7"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "The Learning Commons maintains an Assistive Technology Lab of accessible equipment and supports accessibility within tutoring and writing-centre services. It is organisationally separate from the library and, in Kristin Hart's assessment, is not directly relevant to this indicator, which concerns the library's own assets.";

MERGE (n:Note {name: "csueb-ati-committee-history-sep-2026-yse:2025-2026-9.2-ins-csueb-71c5b3e9"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Kristin Hart has been in her role about two years and was pulled into East Bay's ATI committee early on, convened first by Jake and later by Jane. Her account is that it existed mainly to fill out the annual reporting form, met infrequently, and felt perfunctory. It lost clarity once the Title II compliance deadline moved, leaving its ongoing purpose unclear. She asked directly who would complete the campus's October reporting form going forward.";

MERGE (n:Note {name: "sfbrn-centralisation-split-sep-2026-yse:2025-2026-9.2-ins-csueb-4b6f1d20"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Daniel Fontaine explained the current split. Web and procurement are fully centralised under SFBRN. Instructional materials, which includes the library, is not, and Amanda McGowan is working with Jean toward a formal directive for East Bay specifically. Daniel Fontaine collects and documents evidence for instructional materials but does not direct that work. Direction currently sits with Zach Oshri as East Bay's ATI coordinator, and the overlap between the two roles is still being worked out. Reporting is moving to a centralised process across the three campuses, replacing the old per-campus form.";

MERGE (n:Note {name: "textbook-adoption-shared-ownership-sep-2026-yse:2025-2026-1.1-ins-csueb-e5723a9c"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Textbook adoption ownership at East Bay is shared between Kristin Hart and Zach Oshri, who discuss it regularly, with no single named individual. The Affordable Learning Committee is the Academic Senate body that has led the related policy work and oversees its implementation. The zero-cost and low-cost course materials policy is formally adopted. Both facts settle queries that were open before this meeting.";

MERGE (n:Note {name: "central-syllabus-repository-state-sep-2026-yse:2025-2026-4.1-ins-csueb-08f6c2ba"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "East Bay has no central syllabus database today and is working toward one. Kristin Hart is asking the Affordable Learning Committee to consider requiring faculty to deposit syllabi into a central repository. The platform already exists; what is missing is the policy and the process to require its use. This answers half of the open question about central syllabus databases. The other half, which CSU campuses maintain one, is untouched, so that query stays open.";

MERGE (n:Note {name: "csueb-im-working-group-interest-sep-2026-yse:2025-2026-9.3-ins-csueb-6d194e8f"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.include_in_report = true, n.date_created = date("2026-09-16"),
              n.content = "Daniel Fontaine asked whether East Bay could form a dedicated instructional materials working group, noting Sonoma has started one. Zach Oshri had spoken with Rafael, who said no formal process is required and people simply convene one when needed. Kristin Hart asked whether this meant reforming the old ATI committee; Daniel Fontaine clarified it would be scoped to instructional materials, matching the SFBRN working-group structure. Her response was positive. She noted others, including Pamela, worked on related efforts before and would likely step up, and she can bring in additional library staff. Daniel Fontaine asked to be included once it is running.";

MATCH (mm:MeetingMinutes {unique_id: "ba6f93a029c84ea989593415a3b8d5ee"})
MATCH (author:Person {name: "Daniel Fontaine"})
MATCH (n:Note) WHERE n.date_created = date("2026-09-16") AND (
     n.name ENDS WITH "-c3a71e58" OR n.name ENDS WITH "-9f24b6d1" OR n.name ENDS WITH "-5e08c9a3"
  OR n.name ENDS WITH "-b74d2f06" OR n.name ENDS WITH "-a19e5c74" OR n.name ENDS WITH "-d820a4b7"
  OR n.name ENDS WITH "-71c5b3e9" OR n.name ENDS WITH "-4b6f1d20" OR n.name ENDS WITH "-e5723a9c"
  OR n.name ENDS WITH "-08f6c2ba" OR n.name ENDS WITH "-6d194e8f")
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-csueb"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-7.11-ins-csueb" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-csueb"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-9.2-ins-csueb" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.1-ins-csueb"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-1.1-ins-csueb" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-csueb"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-4.1-ins-csueb" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.3-ins-csueb"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-9.3-ins-csueb" AND n.date_created = date("2026-09-16")
MERGE (y)-[:has_note]->(n);

// The syllabus query stays open and gets the half answer as an annotation.
MATCH (q:Query {unique_id: "b0ef0cf5-cacf-4e71-a0bc-9ff74e5780f0"})
MATCH (n:Note {name: "central-syllabus-repository-state-sep-2026-yse:2025-2026-4.1-ins-csueb-08f6c2ba"})
MERGE (q)-[:has_note]->(n);


// -------------------------------------------------------------------------------------
// 6. RECOMMENDATIONS
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-csueb"})
MERGE (y)-[:has_recommendation]->(r:Recommendation {recommendation: "Regrade 7.11-ins at CSU East Bay from Defined to Initiated."})
ON CREATE SET r.unique_id = replace(randomUUID(), "-", ""),
              r.status = "open",
              r.date_created = date("2026-09-16"),
              r.detail = "The evidence behind this indicator does not meet the Defined threshold. There is no documented process for acquiring, converting, digitizing, creating or maintaining library assets accessibly. Licensed content gets an accessibility review at purchase through CSU Buy, which is a procurement control rather than a library process. The remediation pathway is undocumented and has produced no records. Initiated is the honest level. It rises when a written routing process exists and is stored somewhere a reader can reach.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-csueb"})
MERGE (y)-[:has_recommendation]->(r:Recommendation {recommendation: "Write and store a documented routing process for library accessibility barrier reports."})
ON CREATE SET r.unique_id = replace(randomUUID(), "-", ""),
              r.status = "open",
              r.date_created = date("2026-09-16"),
              r.detail = "A barrier reaches Accessibility Services, which triages it to Zach Oshri's team. That path is practice and is written down nowhere. It needs a document that states what counts as a barrier report, where a user files one, who triages, who resolves, and what record the resolution leaves. The document must also settle whether the path covers all library assets or only interlibrary loan content, because Zach Oshri was explicit that the scope is unclear. Zach Oshri owns the work in practice and the document does not yet have an author.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-csueb"})-[:has_recommendation]->(r:Recommendation)
WHERE r.date_created = date("2026-09-16")
MATCH (author:Person {name: "Daniel Fontaine"})
MERGE (r)-[:created_by]->(author);


// -------------------------------------------------------------------------------------
// 7. CONCERN
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-csueb"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "Success indicator ratings at CSU East Bay were flagged as above their evidence and the direction was to keep the prior year's ratings."})
ON CREATE SET c.unique_id = replace(randomUUID(), "-", ""),
              c.status = "open",
              c.date_raised = date("2026-09-16"),
              c.detail = "Zach Oshri previously told his manager that several success indicators, 7.11 among them, were rated higher than the evidence supported. He was told to leave the prior year's ratings unchanged rather than revise them. He disagreed and asked for the disagreement to be on record. Nobody has named a way to revisit the ratings, no reviewer owns the question, and no decision is pending that would settle it. This bears on the campus's reporting as a whole rather than on one indicator, which is why it sits against the steering committee's review process rather than against 7.11.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-ins-csueb"})-[:has_concern]->(c:Concern)
WHERE c.date_raised = date("2026-09-16")
MATCH (raiser:Person {name: "Zach Oshri"})
MERGE (c)-[:raised_by]->(raiser);


// -------------------------------------------------------------------------------------
// 8. QUERIES
// -------------------------------------------------------------------------------------

MERGE (q:Query {question: "Do open access collections enabled in Alma undergo any accessibility review before being turned on?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "information_gap",
              q.date_raised = date("2026-09-16"),
              q.detail = "Open access collections carry no cost, so enabling one never triggers a procurement review. Kristin Hart's sense is that accessibility is probably weighed in the decision to enable a collection, and she could not confirm it. Collections can be turned on locally as well as centrally, so the answer may differ by who enabled them.";

MERGE (q:Query {question: "Is the interlibrary loan accessibility barrier process scoped to ILL content only, or to all library assets?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "information_gap",
              q.date_raised = date("2026-09-16"),
              q.detail = "The pathway came out of a conversation with the Chancellor's Office, most likely with David Walker, about barriers encountered through interlibrary loan. Zach Oshri was explicit that it may cover only ILL content, which would leave every other library asset without a reporting route. Settling this decides whether the campus has one gap or a general one.";

MERGE (q:Query {question: "Where is the CSU East Bay library accessibility barrier report form, and what is its scope?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "artifact_request",
              q.date_raised = date("2026-09-16"),
              q.detail = "Kristin Hart said a form exists. Its location and its scope were not established on the call, and Daniel Fontaine agreed to track it down. Without it the reporting route cannot be documented or linked.";

MERGE (q:Query {question: "Is digital library asset accessibility written into Gr Keer's position description, and to what extent?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "information_gap",
              q.date_raised = date("2026-09-16"),
              q.detail = "Kristin Hart believes someone in the library has some digital accessibility responsibility written into their job description and identified Gr Keer, Associate Librarian for Community Engagement and Outreach. How much is written down, and how much is operationalised, is unconfirmed. The Position element of the maturity bar turns on the answer: a named person with the duty in their position description is the difference between assigned responsibility and goodwill.";

MATCH (q:Query) WHERE q.date_raised = date("2026-09-16") AND (
     q.question STARTS WITH "Do open access collections"
  OR q.question STARTS WITH "Is the interlibrary loan"
  OR q.question STARTS WITH "Where is the CSU East Bay library"
  OR q.question STARTS WITH "Is digital library asset accessibility")
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-csueb-ins"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-7.11-ins-csueb"})
MATCH (raiser:Person {name: "Daniel Fontaine"})
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser);

MATCH (q:Query) WHERE q.date_raised = date("2026-09-16") AND (
     q.question STARTS WITH "Do open access collections"
  OR q.question STARTS WITH "Where is the CSU East Bay library"
  OR q.question STARTS WITH "Is digital library asset accessibility")
MATCH (owner:Person {name: "Kristin Hart"})
MERGE (q)-[:answerable_by]->(owner);

MATCH (q:Query {question: "Is the interlibrary loan accessibility barrier process scoped to ILL content only, or to all library assets?"})
MATCH (owner:Person {name: "Zach Oshri"})
MERGE (q)-[:answerable_by]->(owner);


// -------------------------------------------------------------------------------------
// 9. PLANS  (MERGE on `description`, the unique index on Plan)
// -------------------------------------------------------------------------------------

MERGE (p:Plan {description: "Stand up a dedicated instructional materials working group at CSU East Bay, scoped to instructional materials rather than to filling out the annual reporting form, matching the working-group structure the other SFBRN campuses use. Amanda McGowan is pursuing a formal directive to East Bay through her conversation with Jean, on the model that worked for Sonoma. Kristin Hart will identify and recruit library staff willing to take part. Daniel Fontaine asked to be included in the regular meetings once it is running. Done when the group has a directive, a membership list and a meeting cadence."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "CSUEB: Reconstitute the instructional materials working group",
              p.plan_status = "In Progress",
              p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false;

MERGE (p:Plan {description: "Get faculty required to deposit syllabi into the central repository at CSU East Bay. The platform already exists; the policy and the process to require its use do not. Kristin Hart is taking the proposal to the Affordable Learning Committee, the Academic Senate body that passed the earlier amendment requiring faculty to tag zero-textbook-cost courses. Done when the requirement is adopted and syllabi are being deposited."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "CSUEB: Require faculty to deposit syllabi in the central repository",
              p.plan_status = "In Progress",
              p.is_key_plan = false, p.is_campus_plan = false, p.abandoned = false;

MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-csueb-ins"})
MATCH (p:Plan) WHERE p.name IN [
  "CSUEB: Reconstitute the instructional materials working group",
  "CSUEB: Require faculty to deposit syllabi in the central repository"]
MERGE (p)-[:in_academic_year]->(ay)
MERGE (wgp)-[:includes_plan]->(p);

MATCH (p:Plan {name: "CSUEB: Reconstitute the instructional materials working group"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.3-ins-csueb"})
MERGE (p)-[:furthers_yse]->(y);

MATCH (p:Plan {name: "CSUEB: Require faculty to deposit syllabi in the central repository"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.1-ins-csueb"})
MERGE (p)-[:furthers_yse]->(y);


// -------------------------------------------------------------------------------------
// 10. CLOSE THE GUIDE AND STAMP
// -------------------------------------------------------------------------------------

MATCH (g:InterviewGuide {unique_id: "1ed3a444f71f400da4d234d7fe519e4c"})
MATCH (mm:MeetingMinutes {unique_id: "ba6f93a029c84ea989593415a3b8d5ee"})
MERGE (g)-[:resulted_in]->(mm);

MATCH (mm:MeetingMinutes {unique_id: "ba6f93a029c84ea989593415a3b8d5ee"})
SET mm.ontology_ingested = true,
    mm.ontology_ingest_date = date("2026-09-16"),
    mm.ontology_ingest_note = "1 person (Gr Keer, non-committee), 1 implementation (Affordable Learning Committee), 11 notes, 2 plans, 4 queries, 2 recommendations, 1 concern. 2 of 3 guide queries settled; the syllabus-database query left open on a half answer. One stale note set to exclude from report. InterviewGuide 1ed3a444 closed against these minutes. Bar coverage: Position partial, Budget answered as absorbed into an existing role, Procedures partial, Output answered adversely at zero requests.";
