// ingest_2026-10-01_procurement_wg.cypher
//
// Source: MeetingMinutes "Procurement Working Group 10/1"
//         unique_id ca05e1aad7c74794a2f5f8bd2e7d6873, meeting_date 2026-10-01,
//         anchored minutes_under_plan -> 2025-2026-sfsu-pro. All five attendees already linked.
// Ingested by: Daniel Fontaine. Manifest approved 2026-10-01 with all Plans, Concerns and
// Recommendations dropped by the user.
//
// Anchors: reporting year 2025-2026. Cross-campus SFBRN work under the convening campus
// (sfsu-pro), as in the 2026-09-16 ingest. Campus-specific facts on that campus's YSE
// (impact tool -> 1.3-pro-csueb, Sara's practice -> 1.3-pro-ssu).
// No InterviewGuide preps this meeting.
//
// Identity resolutions: Amanda McGowan, Daniel Fontaine, Sara Marquez, Jonathan Hale,
// Mantasha Lakdawala (SF State) resolved to existing nodes. "Gene" taken as Gene Lim
// (unverified, prose only). Jen Barnett, Margaret Price, Jamie, Pierre: prose only.
//
// Judgment calls:
//   No new implementations. The two queue SLAs sit under the existing SFBRN CSUBuy IT
//   Accessibility Review Procedure and land as Notes on 1.9-pro-sfsu, also attached to it.
//   CSUEB VPAT Analysis Tool enriched: description rewritten as a standing definition from
//   Jonathan Hale's first-person walkthrough, is_evidence_for control = internal,
//   worked_on Jonathan Hale (role:procurement-team). Its history goes to a Note.
//   Two Queries: artifact_request for the tool source files, information_gap for the
//   stalled ServiceNow rebuild. Both answerable_by Jonathan Hale.
//   0 of 3 open procurement Queries settled.
//   Dropped on review: 2 Plans (SLA write-up, impact criteria), 1 Concern (Buy IT
//   coverage), 2 Recommendations (SF State requester referral, vendor-level documents).
//   Maturity flag, not acted on: 1.3-pro-ssu (Managed) and 1.3-pro-sfsu (Established)
//   while both reviewers describe an informal, unwritten impact judgment.

// ---------------------------------------------------------------- implementation enrichment
MATCH (i:Service {unique_id: "aa78228de0774508979ded52101a14bb"})
SET i.description = "A web form CSU East Bay ATI reviewers complete during eREC review to set a product's accessibility impact level as low, medium or high. The reviewer re-enters the requisition number, supplier, product and department, then answers questions on access limits drawn from the VPAT, whether use is required for employment or coursework, public-facing output, and scope of use. The form recomputes the level as answers change and then produces follow-up questions for that level, which the reviewer pastes into the P2P comments.";

MATCH (i:Service {unique_id: "aa78228de0774508979ded52101a14bb"})-[e:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: "2025-2026-1.3-pro-csueb"})
SET e.control = "internal";

MATCH (i:Service {unique_id: "aa78228de0774508979ded52101a14bb"})
MATCH (jh:Person {unique_id: "c02326cffb814ed9b5b8d5a94d46de11"})
MERGE (jh)-[w:worked_on {role_handle: "role:procurement-team"}]->(i)
ON CREATE SET w.added_date = date("2026-10-01");

// ---------------------------------------------------------------- queries
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.3-pro-sfsu"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MATCH (jh:Person {unique_id: "c02326cffb814ed9b5b8d5a94d46de11"})
MERGE (q:Query {question: "Will Jonathan Hale send the CSU East Bay impact tool's script.js and PHP form-handler files?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "artifact_request", q.date_raised = date("2026-10-01"),
  q.detail = "The impact tool's client script and server form handler hold the rules that map review answers to a low, medium or high impact level. Jonathan Hale pulled them through the browser's developer tools during the meeting and agreed to send them over Teams. The written impact criteria for indicator 1.3 are to be drawn from these files."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(daniel)
MERGE (q)-[:answerable_by]->(jh);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.3-pro-csueb"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MATCH (jh:Person {unique_id: "c02326cffb814ed9b5b8d5a94d46de11"})
MERGE (q:Query {question: "What did the stalled ServiceNow rebuild of the CSU East Bay impact tool produce?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "information_gap", q.date_raised = date("2026-10-01"),
  q.detail = "About a month before the meeting, a developer on the East Bay service desk team was asked to recreate the impact tool in ServiceNow. The work stalled over doubt that East Bay will keep ServiceNow. Whether anything usable exists decides whether a rebuild starts from that work or from the original tool's source. Jonathan Hale will ask the developer."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(daniel)
MERGE (q)-[:answerable_by]->(jh);

// ---------------------------------------------------------------- notes (YSE + minutes)
UNWIND [
  {name: "erec-30-day-pickup-sla-oct-2026-yse:2025-2026-1.9-pro-sfsu-71c4e2a9", yse: "2025-2026-1.9-pro-sfsu", impl: "f8e96ec87cb24b4cad8667483f7a5564",
   content: "The group agreed a pickup rule for the shared eREC queue. An unassigned eREC more than 30 days old at any campus takes priority over a reviewer's home-campus backlog, and reviewers pause their own queue to take it if needed. The rule covers unassigned items only. An item assigned to someone and in progress does not trigger it, which Sara Marquez raised with a 37-day item of her own. The P2P search view does not show whether an item is assigned, so a reviewer opens each one to check. Jonathan Hale committed to picking up items over 30 days when he has capacity. Amanda McGowan asked reviewers to tell her how sharing the queue works in practice."},
  {name: "erec-rule-of-three-sla-oct-2026-yse:2025-2026-1.9-pro-sfsu-3d8b0f52", yse: "2025-2026-1.9-pro-sfsu", impl: "f8e96ec87cb24b4cad8667483f7a5564",
   content: "The group adopted Sara Marquez's rule of three for requesters who stop responding. A reviewer makes two outreach attempts as P2P comments over about two weeks, then a final attempt by email or chat. With no response, the eREC is closed with instructions for resubmitting and a list of what is missing, such as the VPAT, HECVAT or usage questionnaire. Before the rule, Sara waited two to three weeks before escalating, and Jonathan Hale used three weekly follow-ups modelled on the East Bay help desk policy. Jonathan will draft shared template language for outreach and close-out comments. VPATs behind vendor logins or NDAs block the reviewer, who records that. Jonathan also enforces answers to every ATI field, which some campuses do not mark required. Sara cannot reject or return a requisition past her own step, so she escalates to Amanda McGowan or the team chat. The rules go in the internal review process document, which requesters do not see."},
  {name: "buyit-sfsu-coverage-oct-2026-yse:2025-2026-1.9-pro-sfsu-a6e19d73", yse: "2025-2026-1.9-pro-sfsu", impl: null,
   content: "SF State is the only one of the three campuses still using Buy IT. An SF State eREC reaches ATI review only after Buy IT approval. Only Daniel Fontaine and Mantasha Lakdawala have Buy IT access, and they avoid taking leave at the same time so one of them can process the queue. Amanda McGowan ruled that SF State eRECs are outside the 30-day pickup rule until this changes. Buy IT was expected to be retired by September 2026. It was not, and no date is known. Amanda is not cross-training the group into Buy IT while its retirement is pending. Separately, Mantasha could assign some East Bay and Sonoma items to herself but not approve them. The cause is unconfirmed, and Amanda will raise it with IT when it recurs with a live example."},
  {name: "p2p-cross-campus-search-oct-2026-yse:2025-2026-1.8-pro-sfsu-58f2b7e0", yse: "2025-2026-1.8-pro-sfsu", impl: null,
   content: "Sara Marquez tested cross-campus search in P2P live. Searching for Hootsuite returned Jonathan Hale's East Bay review, so a reviewer can see by vendor name whether another campus reviewed a product, what it found, and whether a VPAT is on file. Differing use cases may still need an independent review. A Sonoma review Sara remembered from July did not appear, and the dates did not reconcile on the call. P2P does not flag existing requisitions, VPATs or findings for a vendor when a new requisition is entered. A reviewer has to search by supplier by hand. ServiceNow holds mostly East Bay review history."},
  {name: "impact-tool-history-oct-2026-yse:2025-2026-1.3-pro-csueb-c90a4f17", yse: "2025-2026-1.3-pro-csueb", impl: "aa78228de0774508979ded52101a14bb",
   content: "Jonathan Hale demonstrated the East Bay impact analysis tool in place of Margaret Price. A student employee built it years ago and has since graduated, and nobody maintains it. It runs on an East Bay server behind NetID login, so reviewers at Sonoma and SF State cannot open or edit it. About a month earlier, Gene (taken to be Gene Lim, unverified) asked a service desk developer to recreate it in ServiceNow. That work stalled over doubt that East Bay will keep ServiceNow."},
  {name: "impact-criteria-direction-oct-2026-yse:2025-2026-1.3-pro-sfsu-e4b7d215", yse: "2025-2026-1.3-pro-sfsu", impl: null,
   content: "Daniel Fontaine tied the impact tool decision to indicator 1.3. The rules that map answers to low, medium or high are the priority, and the application is secondary. Daniel wants the rules taken from the tool's source, combined with current Sonoma and SF State practice, and agreed by the group as the official criteria, with a follow-up session to ratify them. He is considering a rebuild on the shared server still called the DPRC server, which all three campuses reach through a shared firewall. Mantasha Lakdawala makes the impact judgment informally, without a written rubric."},
  {name: "ssu-informal-impact-judgment-oct-2026-yse:2025-2026-1.3-pro-ssu-1f6c8a3b", yse: "2025-2026-1.3-pro-ssu", impl: null,
   content: "Sara Marquez makes the impact judgment informally. She weighs the number of users and whether use is required, and reaches low, medium or high without a written rubric. She has recorded her reasoning in emails to her supervisor, formerly Jamie and now Amanda McGowan, rather than in a shared structured format."},
  {name: "erec-queue-snapshot-oct-2026-yse:2025-2026-8.9-pro-sfsu-9b2d6e48", yse: "2025-2026-8.9-pro-sfsu", impl: null,
   content: "On 2026-10-01 the shared queue held 39 eRECs waiting for accessibility review across the three campuses. The oldest dated from July, about two and a half months earlier."}
] AS row
MATCH (y:YearSuccessEvidence {year_identifier: row.yse})
MATCH (mm:MeetingMinutes {unique_id: "ca05e1aad7c74794a2f5f8bd2e7d6873"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (n:Note {name: row.name})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.content = row.content, n.date_created = date("2026-10-01"), n.include_in_report = false, n.depreciated = false
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(daniel)
WITH n, row WHERE row.impl IS NOT NULL
MATCH (i {unique_id: row.impl})
MERGE (i)-[:is_documented_by]->(n);

// ---------------------------------------------------------------- stamp
MATCH (mm:MeetingMinutes {unique_id: "ca05e1aad7c74794a2f5f8bd2e7d6873"})
SET mm.ontology_ingested = true, mm.ontology_ingest_date = date("2026-10-01"),
  mm.ontology_ingest_note = "8 notes (3 also on implementations), 2 queries (artifact_request, information_gap), 1 implementation enriched (CSUEB VPAT Analysis Tool: description, control internal, worked_on Jonathan Hale). Plans, concerns and recommendations dropped on review. 0 of 3 open procurement queries settled.";
