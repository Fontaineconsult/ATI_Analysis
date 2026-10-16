// ingest_2026_10_14_procurement_wg.cypher
//
// Source: MeetingMinutes "Procurement Working Group 10/14"
//         unique_id b17d8f0c39ed407cbccbc1e601dd12d3, meeting_date 2026-10-14,
//         anchored minutes_under_plan -> 2025-2026-sfsu-pro, pertains_to Procurement CoP.
// Ingested by: Daniel Fontaine. Manifest revised and approved 2026-10-14.
//
// Anchors: reporting year 2025-2026. Cross-campus SFBRN practice on the convening campus
// (sfsu-pro YSEs). Campus-specific facts on that campus's YSE. SSU and CSUEB carry only
// 4.6 among the 4.x procurement YSEs. No InterviewGuide preps this meeting.
//
// Identity resolutions: Daniel Fontaine, Amanda McGowan, Sara Marquez, Jonathan Hale,
// Margaret Price, Mantasha Lakdawala all resolved to existing nodes. Zach Oshri prose only.
//
// Judgment calls (user corrections applied):
//   Global state only. No individual procurement review is ingested: the Gradescope,
//   Grubhub, Economist and Atlantic requisitions are left out, as is the Gradescope Query.
//   TAAP used throughout where speakers said "TAP" or "EAP".
//   Query 1e906780 (impact tool script.js and PHP files) settled: the user has the files.
//   The PDF tool heard as "Qualify" is the existing Equalify Process owned by Zach Oshri
//   (ed35a02d). Its approval scope lands as a Note on that node, not as a Query.
//   No implementations, plans, concerns or tools created. The ACR review document item
//   annotates the existing plan "SFBRN: Draft the official VPAT Review Procedure".
//   Daniel's aside that Section 508 is not a law is not recorded; the WCAG 2.1 AA
//   baseline is.
//   Principles: proportionate-remedy (TAAP necessity test), equally-effective-access
//   (TAAP verification), conformance-to-an-external-technical-standard (WCAG baseline).
//   0 of 5 open procurement queries settled by the minutes; 1 settled on the user's word.

// ---------------------------------------------------------------- settle query
MATCH (q:Query {unique_id: "1e90678079e54d4cb43962c56325494a"})
MATCH (jh:Person {unique_id: "c02326cffb814ed9b5b8d5a94d46de11"})
SET q.status = "settled", q.date_settled = date("2026-10-14"),
    q.answer = "Received. Daniel Fontaine has the CSU East Bay impact tool's script.js and PHP form-handler files."
MERGE (q)-[:query_settled_by]->(jh);

// ---------------------------------------------------------------- queries
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.3-pro-sfsu"})
MATCH (jh:Person {unique_id: "c02326cffb814ed9b5b8d5a94d46de11"})
MATCH (am:Person {unique_id: "538d0f04e2814aa8819bebad3f93325b"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (q:Query {question: "Should SFBRN reviewers share the completed impact analysis with the requester, or keep it internal?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "policy_decision", q.date_raised = date("2026-10-14"),
  q.detail = "CSU East Bay attaches the completed analysis to the P2P ticket. Sonoma State and SF State have no shared practice. Showing the analysis explains to the requester how the impact level was reached. It also shows which answers lead to less review. Amanda McGowan and Daniel Fontaine can set the network practice."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(jh)
MERGE (q)-[:answerable_by]->(am)
MERGE (q)-[:answerable_by]->(daniel);

MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.9-pro-sfsu"})
MATCH (jh:Person {unique_id: "c02326cffb814ed9b5b8d5a94d46de11"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (q:Query {question: "How should a TAAP record and track a vendor's committed remediation date?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""), q.status = "open", q.category = "technical_clarification", q.date_raised = date("2026-10-14"),
  q.detail = "The TAAP form has no field for a vendor roadmap or remediation date. The working group agreed the commitment belongs inside the TAAP outcome. The open question is how the date is recorded and who follows up when it passes. Daniel Fontaine and Jonathan Hale are to work out the design."
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(jh)
MERGE (q)-[:answerable_by]->(daniel)
MERGE (q)-[:answerable_by]->(jh);

// ---------------------------------------------------------------- notes (YSE + minutes, optional implementation or plan)
UNWIND [
  {name: "acr-review-outcome-framework-oct-2026-yse:2025-2026-1.8-pro-sfsu-4c19e7a2", yse: "2025-2026-1.8-pro-sfsu", impl: null, plan: null,
   content: "The draft ACR review process routes every review to one of four outcomes: approve, manual review, TAAP or deny. A manual reviewer returns a recommendation, and the reviewer who owns the request makes the decision. Deny remains a usable outcome, mainly for single-department purchases where alternative products exist, and a denial must be justifiable to the requester. The impact matrix is to decide whether a TAAP is adequate or the barrier is severe enough that the product must be denied, weighing factors such as how many people use the product."},
  {name: "acr-process-document-set-oct-2026-yse:2025-2026-1.8-pro-sfsu-8e3a51d0", yse: "2025-2026-1.8-pro-sfsu", impl: null, plan: "bc58694847514ea2a18a751e201b3938",
   content: "The SFBRN review process is being written as three linked documents: the business process for working in CSUBuy, P2P and Buy IT; how to conduct an ACR review; and how to conduct a TAAP. The ACR review document is targeted for the end of 2026. A VPAT is the blank template and an ACR is the report a vendor completes from it, so reviewers review ACRs. Reviewers read the ACR rating \"Partially Supports\" differently, and what it should trigger is deferred to a later meeting."},
  {name: "wcag-21-aa-review-baseline-oct-2026-yse:2025-2026-1.8-pro-sfsu-b7d20f64", yse: "2025-2026-1.8-pro-sfsu", impl: null, plan: null,
   content: "SFBRN reviewers evaluate against WCAG 2.1 Level AA, the standard the 2024 Title II rule adopts. The Section 508 standards incorporate WCAG 2.0. Reviewers confirm they are reading WCAG 2.1 success criteria at Level AA whenever they look up a criterion."},
  {name: "acr-alternative-evidence-oct-2026-yse:2025-2026-1.8-pro-sfsu-2f85c9e1", yse: "2025-2026-1.8-pro-sfsu", impl: null, plan: null,
   content: "A missing or inadequate ACR routes to manual review or a TAAP. Two other evidence sources are available and unused. No reviewer has requested a live vendor demonstration, and ATI team testing happens informally. Both are to be written into the ACR review process, starting from SF State's earlier material on requesting demonstrations."},
  {name: "review-communication-templates-oct-2026-yse:2025-2026-5.9-pro-sfsu-6a0d3b7c", yse: "2025-2026-5.9-pro-sfsu", impl: "f8e96ec87cb24b4cad8667483f7a5564", plan: null,
   content: "Standard email and comment templates for requesting a missing ACR from a vendor, and for other compliance messages, are kept in the Procurement SharePoint folder. Escalation timing for repeat requests and closure follows the queue SLAs agreed on 2026-10-01. The aim is identical language from all three campuses. Mantasha Lakdawala had not been included in the template process and is being added to it and to the process document."},
  {name: "vendor-roadmap-tracking-gap-oct-2026-yse:2025-2026-5.9-pro-sfsu-d913e5a8", yse: "2025-2026-5.9-pro-sfsu", impl: null, plan: null,
   content: "The TAAP form has no structured field for a vendor's remediation commitment or date. It carries only closing boilerplate on what to send a vendor about non-conformance. The working group placed vendor roadmap tracking inside the TAAP outcome rather than as a separate outcome, and has not designed how to record or follow it."},
  {name: "intake-answer-gaming-oct-2026-yse:2025-2026-1.3-pro-sfsu-71b6f2c3", yse: "2025-2026-1.3-pro-sfsu", impl: null, plan: null,
   content: "Some requesters learn which intake answers lead to less review and answer accordingly, for example by reporting one user for a product used across a class or a department. Reviewers at Sonoma State and CSU East Bay both see the pattern. The impact tool lets a reviewer correct a self-reported answer, which limits the effect but not the incentive. The intake form does not show requesters the decision criteria. Only the completed outcome is shared after review."},
  {name: "impact-matrix-content-type-gap-oct-2026-yse:2025-2026-1.3-pro-sfsu-a4e8c016", yse: "2025-2026-1.3-pro-sfsu", impl: null, plan: null,
   content: "The shared impact matrix is to be built from the CSU East Bay impact tool and used by all three campuses. Sonoma State and SF State reviewers have no equivalent tool. The East Bay tool is built for software reviews. It has no rules for non-web documents, and its WCAG rules would need extending to cover web pages."},
  {name: "csueb-impact-analysis-shared-oct-2026-yse:2025-2026-1.3-pro-csueb-5c2f9d47", yse: "2025-2026-1.3-pro-csueb", impl: "aa78228de0774508979ded52101a14bb", plan: null,
   content: "CSU East Bay reviewers attach the completed impact analysis to the P2P ticket. The requester sees how the impact level was derived from their answers and which clarifying questions the reviewer asked. The analysis was formerly kept internal."},
  {name: "cross-campus-taap-home-consult-oct-2026-yse:2025-2026-4.2-pro-sfsu-e06b84f9", yse: "2025-2026-4.2-pro-sfsu", impl: "c665c9fb582b4cd0af1b8f753960a301", plan: null,
   content: "A reviewer working another campus's queue who decides an item needs a TAAP brings in someone from that home campus before writing it. The review rules are shared across the three campuses, but the stakeholders and contacts a TAAP needs are local knowledge. The working group adopted this on 2026-10-14. Writing the TAAP with the home campus also trains reviewers who have not yet written one."},
  {name: "taap-necessity-and-retrospective-oct-2026-yse:2025-2026-4.1-pro-sfsu-3b97a1e5", yse: "2025-2026-4.1-pro-sfsu", impl: null, plan: null,
   content: "The working test for a TAAP is a barrier that blocks completion of a task, not one that makes a product unpleasant to use. ACRs report conformance by interface element rather than by task, so applying the test from an ACR alone involves judgment. The working group endorsed reviewing past TAAP decisions, particularly for products renewed each cycle, so that a settled no-TAAP determination can be reused. Practice differs by campus, and the group expects it to converge. No cadence or owner is set. Completed TAAPs are being imported into the ATI database to support the review."},
  {name: "taap-effect-verification-oct-2026-yse:2025-2026-4.4-pro-sfsu-9f42d6b1", yse: "2025-2026-4.4-pro-sfsu", impl: null, plan: null,
   content: "No process checks that an issued TAAP's alternative is in place and working. CSU East Bay follows up with requesters informally after about a year. An absence of complaints does not show that the alternative works, because a person who meets the barrier may not report it. The working group treats this verification as separate from reviewing whether a TAAP was needed, and has not designed it."},
  {name: "urgent-request-routine-oct-2026-yse:2025-2026-1.9-pro-sfsu-c58e2a03", yse: "2025-2026-1.9-pro-sfsu", impl: "f8e96ec87cb24b4cad8667483f7a5564", plan: null,
   content: "An urgent requisition is posted in the working group's all-campus chat, with \"urgent\" in the first words so it shows in notification previews. Once a reviewer claims it, the detailed exchange moves to a dedicated thread with that reviewer. The 2026-10-01 queue SLAs are final. The escalation path for a reviewer without permission to reject or return a requisition is still open."},
  {name: "equalify-approval-scope-oct-2026-yse:2025-2026-5.13-ins-csueb-8d1c47fa", yse: "2025-2026-5.13-ins-csueb", impl: "ed35a02d17454d769537feb28f196751", plan: null,
   content: "Equalify is approved for use at CSU East Bay on the Cascade CMS only. It is not approved at Sonoma State. A pilot as a plugin on Sonoma State's Drupal site was discussed on 2026-10-14 without that approval. Daniel Fontaine asked that the project charter, filed administratively as an AI project, be reviewed at a broader level before cross-campus testing proceeds. The tool was heard as \"Qualify\" in the meeting."}
] AS row
MATCH (y:YearSuccessEvidence {year_identifier: row.yse})
MATCH (mm:MeetingMinutes {unique_id: "b17d8f0c39ed407cbccbc1e601dd12d3"})
MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (n:Note {name: row.name})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""), n.content = row.content, n.date_created = date("2026-10-14"), n.include_in_report = false, n.depreciated = false
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(daniel)
WITH n, row
CALL (n, row) {
  WITH n, row WHERE row.impl IS NOT NULL
  MATCH (i {unique_id: row.impl})
  MERGE (i)-[:is_documented_by]->(n)
}
CALL (n, row) {
  WITH n, row WHERE row.plan IS NOT NULL
  MATCH (p:Plan {unique_id: row.plan})
  MERGE (p)-[:progress_documented_by]->(n)
};

// ---------------------------------------------------------------- stamp
MATCH (mm:MeetingMinutes {unique_id: "b17d8f0c39ed407cbccbc1e601dd12d3"})
SET mm.ontology_ingested = true, mm.ontology_ingest_date = date("2026-10-14"),
  mm.ontology_ingest_note = "14 notes (5 also on implementations, 1 on the VPAT Review Procedure plan), 2 queries (policy_decision, technical_clarification), 1 query settled on the user's word (impact tool source files). No implementations, plans, concerns or tools. Individual procurement reviews not ingested. 0 of 5 open procurement queries settled by the minutes.";
