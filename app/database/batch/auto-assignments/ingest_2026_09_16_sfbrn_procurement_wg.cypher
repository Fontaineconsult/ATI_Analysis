// =====================================================================================
// Ingest: SFBRN Procurement Working Group, 2026-09-16, cross-campus eREC assignment.
// Source: MeetingMinutes "SFBRN ATI Procurement Working Group 9/16"
//         unique_id 3ac59862c2314fd7b2770967ae0f56fa (already in the graph, not yet ingested)
// Run by Daniel Fontaine. Manifest approved 2026-09-16.
//
// ANCHORS
//   Year    2025-2026, the current reporting year. NOT 2026-2027, which is rolled but not
//           being reported. This matters: 8.12-pro ("platform-agnostic process to ensure
//           that all ICT purchases undergo a consistent ATI accessibility conformance
//           review") and 1.12-pro both carry introduced_in_year 2026-2027 and have no
//           2025-2026 YSE. 8.12-pro is the natural home for the goods-and-services bypass
//           concern below; 1.5-pro is used instead, and the detail says so.
//   Campus  sfsu for the shared SFBRN process, per the convening-campus rule. Campus facts
//           anchor to ssu and csueb.
//   WGP     2025-2026-sfsu-pro.
//
// IDENTITIES (all resolved, none created)
//   Amanda McGowan 538d0f04e2814aa8819bebad3f93325b · Daniel Fontaine a1d223af-c7aa-466b-bf54-47f0a199696d
//   Margaret Price d7fc0e8cbebc4a429652cfec83ded881 · Jonathan Hale c02326cffb814ed9b5b8d5a94d46de11
//   Sara Marquez   21ede31e2676400785ca516fb2f5a10d
//   "Montasha" as heard = Mantasha Lakdawala a7c3290c-5abb-45f1-ba95-115345d23643.
//     The transcript places her at Sonoma State twice; the graph has her at sfsu. Her campus
//     is NOT changed here, by instruction. She did not attend and owns nothing created here.
//   "TAP" as heard = TAAP throughout. The transcript uses TAP; the graph and the CSU use
//     TAAP, and the two are the same instrument. Node names below use TAAP.
//
// NO NEW IMPLEMENTATION
//   The manifest proposed a new Process, "SFBRN Cross-Campus eREC Assignment Process".
//   Rejected on review: the cross-campus assignment mechanics fall UNDER the existing
//   SFBRN CSUBuy IT Accessibility Review Procedure (f8e96ec87cb24b4cad8667483f7a5564,
//   owned by Amanda McGowan), so they land as notes on that procedure rather than as a
//   second node describing the same work.
//
// NO NEW EVIDENCE EDGES
//   The CSUBuy procedure ALREADY evidences 2025-2026-1.9-pro-sfsu and 2025-2026-1.8-pro-sfsu,
//   which are the two indicators this meeting speaks to. Nothing to wire. Adding worked_on
//   for Margaret Price, Jonathan Hale and Sara Marquez to that procedure is a reasonable
//   follow-up (all three now review cross-campus through it) and is NOT done here, because
//   the approval covered notes.
//
// NO TOOLS
//   P2P is Procure-to-Pay. It is neither an Asset that takes remediation nor a Tool that
//   provides it, so it stays in note prose. Same for ServiceNow (which already exists as a
//   Tool node and is not re-wired here) and East Bay's legacy CFS/PeopleSoft.
//
// DOWN-ROUTED
//   Amanda's formalizing email      -> note, not a Plan. One email is too small to track.
//   Amanda's IT-review reporting    -> note. Her IT review role, not this group's work.
//   Requestors mislabelling repeats -> note. The group landed on "we'll have to ask".
//   Backlog counts                  -> note prose, not Metric nodes. No exportable artifact.
//   Ticketmaster                    -> omitted. Mentioned in passing, S5.
//   Demo/reviewer account question  -> omitted. Account provisioning is established
//                                      procedure and does not need tracking.
//   Expedited-request gap           -> NOT a Concern. Folded into the VPAT Review Procedure
//                                      plan as a requirement the document must satisfy.
//   1.11-pro evidence link          -> note only.
//
// QUESTIONS SETTLED: none of 0. There are zero open Query nodes under any -pro WGP.
//
// VALIDATE, BIND-CHECK, THEN EXECUTE
//   run_file validation is EXPLAIN and proves only that the Cypher parses. Every MATCH
//   anchor below is counted by the bind-check query in the ingest report before --execute.
// =====================================================================================


// -------------------------------------------------------------------------------------
// 1. MEETING WIRING  (the minutes node exists; wire what it is missing)
// -------------------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MERGE (mm)-[:minutes_under_plan]->(wgp);

MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
MATCH (p:Person {name: "Daniel Fontaine"})
MERGE (mm)-[:minutes_recorded_by]->(p);

MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
MATCH (p:Person) WHERE p.name IN ["Amanda McGowan", "Daniel Fontaine", "Margaret Price", "Jonathan Hale", "Sara Marquez"]
MERGE (p)-[:participated_in]->(mm);


// -------------------------------------------------------------------------------------
// 2. NOTES ON THE CSUBUY PROCEDURE
//    The cross-campus assignment mechanics, agreed rules and reviewer habits. Each also
//    attaches to the YSE it bears on and to the minutes.
// -------------------------------------------------------------------------------------

MERGE (n:Note {name: "erec-assignment-mechanics-sep-2026-yse:2025-2026-1.9-pro-sfsu-4b17c9a2"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Reviewers now hold cross-campus access in P2P, and the group tested the assignment mechanics live. Clicking Assign on an item pulls it into a personal queue without removing it from the shared queue's visibility to others. There is no direct unassign button. The way back is Return to Shared Folder, reached through the small arrow beside Assign and Further Actions, which Jonathan Hale found the day before and the group confirmed on the call. Assignment and reassignment across all three campus queues was tested by name search and works.";

MERGE (n:Note {name: "erec-cross-campus-rules-sep-2026-yse:2025-2026-1.9-pro-sfsu-8d3e51f7"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "The group agreed four rules for working the shared queue. Claim an item by assigning it to yourself before you start, which signals it is in progress and prevents duplicate work now that access is cross-campus. Release an item you cannot finish through Return to Shared Folder rather than leaving it locked in a personal queue. Leave a comment saying why you released it and which campus should know. No campus asked to restrict which items another campus may review, so the default is that anyone can pick up anything, easier items first. Amanda McGowan framed the rollout as beta testing and asked reviewers to report what does not work in practice. Sara Marquez asked everyone to assign themselves anything already in progress so that Mantasha Lakdawala does not duplicate work when she returns to the queue.";

MERGE (n:Note {name: "p2p-comment-notification-sep-2026-yse:2025-2026-1.9-pro-sfsu-2a6f8c04"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "A comment left in P2P does not notify the group by email on its own. It reaches people only when it is addressed to specific recipients through the Add Recipient option in the comment tool, which Margaret Price demonstrated on the call. This is why the release rule above requires an addressed comment rather than a bare one.";

MERGE (n:Note {name: "reviewer-triage-heuristics-sep-2026-yse:2025-2026-1.9-pro-sfsu-f05b2d63"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Reviewers judge what is safe to pick up from another campus without deep local context in three ways, as Jonathan Hale described and the group accepted. Items that plainly need no product knowledge come first, such as single-licence purchases that require no VPAT. Products a reviewer already recognises from their own campus are safe to take. A brand-new product from another campus is a case to slow down on and ask about rather than review blind. This is current practice rather than a written standard, and everyone is still reviewing individually.";

MERGE (n:Note {name: "erec-process-formalization-email-sep-2026-yse:2025-2026-1.9-pro-sfsu-9c4a7e18"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Amanda McGowan will email the group to set the assignment process out as the working process from here, including Mantasha Lakdawala, who missed the call, with an invitation to ask questions. The email is the formalising step; the practice itself starts now.";

// Attach the five above to the CSUBuy procedure, the YSE and the minutes.
MATCH (proc:Procedure {unique_id: "f8e96ec87cb24b4cad8667483f7a5564"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.9-pro-sfsu"})
MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
MATCH (n:Note) WHERE n.name IN [
  "erec-assignment-mechanics-sep-2026-yse:2025-2026-1.9-pro-sfsu-4b17c9a2",
  "erec-cross-campus-rules-sep-2026-yse:2025-2026-1.9-pro-sfsu-8d3e51f7",
  "p2p-comment-notification-sep-2026-yse:2025-2026-1.9-pro-sfsu-2a6f8c04",
  "reviewer-triage-heuristics-sep-2026-yse:2025-2026-1.9-pro-sfsu-f05b2d63",
  "erec-process-formalization-email-sep-2026-yse:2025-2026-1.9-pro-sfsu-9c4a7e18"]
MERGE (proc)-[:is_documented_by]->(n)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (n:Note) WHERE n.name STARTS WITH "erec-" OR n.name STARTS WITH "p2p-comment" OR n.name STARTS WITH "reviewer-triage"
MATCH (author:Person {name: "Daniel Fontaine"})
MERGE (n)-[:created_by]->(author);


// -------------------------------------------------------------------------------------
// 3. NOTES ON OTHER EVIDENCE
// -------------------------------------------------------------------------------------

MERGE (n:Note {name: "procurement-backlog-snapshot-sep-2026-yse:2025-2026-8.9-pro-sfsu-6e1d90ba"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Backlog at the time of the call: East Bay 40 items, SF State 9 commodity items plus 6 form items. Sonoma's count was not captured. East Bay's backlog is the reason the cross-campus assignment work started, after Margaret Price sent Mantasha Lakdawala a list of eRECs to review informally over email last week.";

MERGE (n:Note {name: "servicenow-daily-ict-report-sep-2026-yse:2025-2026-8.9-pro-sfsu-3f72b5ce"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Jonathan Hale receives a large automated ServiceNow report each morning holding historical ICT and ATI review records, searchable by supplier. East Bay stopped using the standalone ICT form around January when SFBRN began, so the report holds nothing newer than about a year. It is useful for older lookups and not for current activity. He offered to add Daniel Fontaine to the distribution.";

MERGE (n:Note {name: "amanda-it-review-reporting-sep-2026-yse:2025-2026-8.9-pro-sfsu-c81a4d2f"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Amanda McGowan has a reporting need from her IT review role, which is separate from the accessibility review the rest of the group does. She reads each requisition summary by hand to judge whether a product will need IT integration or support, and wants that as a structured report if the underlying fields can be queried. The group found no existing report on the call. She will take the field requirements to Procurement as a parallel effort.";

MERGE (n:Note {name: "prior-review-lookup-strategies-sep-2026-yse:2025-2026-1.8-pro-sfsu-7d90f4e6"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "There is no single place to check whether a product has been reviewed before, so reviewers assemble an answer from several. Margaret Price checks ServiceNow for prior ICT and ATI reviews, which holds the questions asked, any VPAT on file and vendor contacts, then the vendor's own site for a posted VPAT, then asks the requester through a P2P comment. Jonathan Hale searches P2P by supplier name first, then ServiceNow, then East Bay's legacy CFS and PeopleSoft, which East Bay still runs alongside P2P and which holds older purchase history. Once a prior instance is found the question becomes whether anything has changed since, such as a complaint or an updated VPAT. A keyword search for the product name in ServiceNow was tested live and returned matches on fragments of the name, which makes loose keywords impractical; a targeted supplier filter is the workable approach.";

MERGE (n:Note {name: "ai-essentials-vpat-quality-sep-2026-yse:2025-2026-1.8-pro-ssu-b25c6a71"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Sara Marquez brought a purchase of AI Essentials, an AI micro-certification tool for the Talent Search and TRIO programme with 50 to 100 expected users, and submitted it for manual review. Her reason was the VPAT itself: in her words it quite literally looked AI-generated and claimed no accessibility issues at all, which she read as evidence that nobody reviewed the product before completing it. Tracing it live showed the product had never been through the accessibility or software review process in P2P at all.";

MERGE (n:Note {name: "repeat-purchase-mislabelling-sep-2026-yse:2025-2026-1.8-pro-ssu-e4a83b05"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Requesters sometimes mark a new purchase as a repeat because they intend to buy it again later. That muddies the repeat signal reviewers use to decide how much review a product needs. The group reached no rule for it beyond asking the requester.";

MERGE (n:Note {name: "east-bay-access-gaps-sep-2026-yse:2025-2026-1.11-pro-sfsu-a3f612dd"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Cross-campus review depends on cross-campus accounts, and two are incomplete. Daniel Fontaine has SF State ITS, SFBRN ATI and a general CSU East Bay group, but Jonathan Hale had no working East Bay NetID entry for him; the identifier Margaret Price found in chat turned out to be a Sonoma State format rather than a native East Bay one. Amanda McGowan was unsure she had an East Bay login beyond a single HR system use, and Margaret Price confirmed one exists on file. Access levels also differ by role: Sara Marquez holds shopper and reviewer roles, which do not carry every search capability others demonstrated.";

MERGE (n:Note {name: "procurement-working-group-scope-sep-2026-yse:2025-2026-9.2-pro-sfsu-5b0c7f39"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "This meeting is now the Procurement Working Group, one of the parallel working groups under the ATI structure alongside Instructional Materials and Web. Daniel Fontaine scoped it narrowly to procurement work rather than duplicating Amanda McGowan's broader PMO reporting meetings. He confirmed the session is recorded and will be coded into the tracking system.";

MERGE (n:Note {name: "reviewer-workload-visibility-sep-2026-yse:2025-2026-8.9-pro-sfsu-0c5e83a4"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Amanda McGowan asked whether monthly reports exist showing who processed which ATI reviews. Neither Jonathan Hale nor Margaret Price knows of one. Sara Marquez noted a reviewer can see their own recent history over a 7 to 40 day window but was unsure it extends to a cross-person view. Amanda's reason for wanting it is executive visibility: she believes the scale of this work is not understood outside the team doing it. The group logged it as a nice-to-have rather than a blocker.";

// Attach the eight above to their YSEs and the minutes.
MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
MATCH (author:Person {name: "Daniel Fontaine"})
MATCH (n:Note) WHERE n.name IN [
  "procurement-backlog-snapshot-sep-2026-yse:2025-2026-8.9-pro-sfsu-6e1d90ba",
  "servicenow-daily-ict-report-sep-2026-yse:2025-2026-8.9-pro-sfsu-3f72b5ce",
  "amanda-it-review-reporting-sep-2026-yse:2025-2026-8.9-pro-sfsu-c81a4d2f",
  "reviewer-workload-visibility-sep-2026-yse:2025-2026-8.9-pro-sfsu-0c5e83a4",
  "prior-review-lookup-strategies-sep-2026-yse:2025-2026-1.8-pro-sfsu-7d90f4e6",
  "ai-essentials-vpat-quality-sep-2026-yse:2025-2026-1.8-pro-ssu-b25c6a71",
  "repeat-purchase-mislabelling-sep-2026-yse:2025-2026-1.8-pro-ssu-e4a83b05",
  "east-bay-access-gaps-sep-2026-yse:2025-2026-1.11-pro-sfsu-a3f612dd",
  "procurement-working-group-scope-sep-2026-yse:2025-2026-9.2-pro-sfsu-5b0c7f39"]
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author);

// Each note names its YSE in its own name; bind each one explicitly.
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.9-pro-sfsu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-8.9-pro-sfsu"
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.8-pro-sfsu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-1.8-pro-sfsu"
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.8-pro-ssu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-1.8-pro-ssu"
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.11-pro-sfsu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-1.11-pro-sfsu"
MERGE (y)-[:has_note]->(n);

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-9.2-pro-sfsu"})
MATCH (n:Note) WHERE n.name CONTAINS "yse:2025-2026-9.2-pro-sfsu"
MERGE (y)-[:has_note]->(n);


// -------------------------------------------------------------------------------------
// 4. PLANS
//    MERGE on `description`, which is the unique index on Plan. NOT `name`.
// -------------------------------------------------------------------------------------

MERGE (p:Plan {description: "Write one canonical document covering what a VPAT is, how to evaluate one, what the decision matrix is, and what an approval or a denial means. The document must also define a path for urgent and time-sensitive requests, which has none today: Jonathan Hale has a security software licence running against a term limit on a grace-period extension with no expedited route. Draw on the SF State material Daniel Fontaine holds and the documentation gathered from the other campuses. Done when the document is published and the working group has adopted it."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SFBRN: Draft the official VPAT Review Procedure",
              p.plan_status = "In Progress",
              p.is_key_plan = false,
              p.is_campus_plan = false,
              p.abandoned = false;

MERGE (p:Plan {description: "Write the TAAP procedure as a document separate from the VPAT Review Procedure. It covers the signature workflow, tracking down the responsible department contact, and the steps a TAAP takes after a review decision. It stays separate because a TAAP is sometimes required when there is no VPAT to review at all. Starts after the VPAT Review Procedure is finished. Done when the document is published and the working group has adopted it."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SFBRN: Write the TAAP Procedural Document",
              p.plan_status = "Not Started",
              p.is_key_plan = false,
              p.is_campus_plan = false,
              p.abandoned = false;

MERGE (p:Plan {description: "Consolidate the procurement content currently spread across the East Bay, Sonoma and SF State sites into the shared SFBRN site, then retire the campus-specific pages in favour of links to the central version. Done when each campus page either redirects or links to the SFBRN version and no procurement content is maintained in three places. Daniel Fontaine is working through it now and needs feedback from the group as he goes."})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.name = "SFBRN: Migrate procurement information from the three campus sites to the SFBRN site",
              p.plan_status = "In Progress",
              p.is_key_plan = false,
              p.is_campus_plan = false,
              p.abandoned = false;

// Anchor the three new plans to the year and the WGP.
MATCH (ay:AcademicYear {name: "2025-2026"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (p:Plan) WHERE p.name IN [
  "SFBRN: Draft the official VPAT Review Procedure",
  "SFBRN: Write the TAAP Procedural Document",
  "SFBRN: Migrate procurement information from the three campus sites to the SFBRN site"]
MERGE (p)-[:in_academic_year]->(ay)
MERGE (wgp)-[:includes_plan]->(p);

MATCH (p:Plan {name: "SFBRN: Draft the official VPAT Review Procedure"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.8-pro-sfsu"})
MERGE (p)-[:furthers_yse]->(y);

MATCH (p:Plan {name: "SFBRN: Write the TAAP Procedural Document"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-sfsu"})
MERGE (p)-[:furthers_yse]->(y);

MATCH (p:Plan {name: "SFBRN: Migrate procurement information from the three campus sites to the SFBRN site"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.10-pro-sfsu"})
MERGE (p)-[:furthers_yse]->(y);


// -------------------------------------------------------------------------------------
// 5. NOTES ENRICHING THE THREE EXISTING PLANS
//    These plans already exist. The meeting updates their status; it does not restate them.
// -------------------------------------------------------------------------------------

MERGE (n:Note {name: "acr-manual-review-plan-status-sep-2026-yse:2025-2026-1.8-pro-sfsu-d62b40c8"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Daniel Fontaine confirmed the manual ACR review process is still tracked and that Jonathan Hale and Sara Marquez have both contributed input to it. It remains a separate task from the VPAT Review Procedure document: this one is the codified path for a product with no VPAT or an inadequate one, and the document is the canonical explanation of what a VPAT is and how to judge it.";

MERGE (n:Note {name: "taap-authoring-workflow-stalled-sep-2026-yse:2025-2026-4.6-pro-sfsu-1a8e75f2"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "Daniel Fontaine flagged the TAAP authoring workflow as stalled and unclear in status. Documentation exists and there has been process discussion, but nothing is formally locked down. A separate TAAP Procedural Document is now planned, sequenced after the VPAT Review Procedure.";

MERGE (n:Note {name: "procurement-guidance-page-scope-sep-2026-yse:2025-2026-1.10-pro-sfsu-9e50c1b7"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.include_in_report = true,
              n.date_created = date("2026-09-16"),
              n.content = "The guidance page now has a second job. Beyond explaining the TAAP and VPAT process, it must explain the SFBRN cross-campus review structure, because requesters are seeing reviewers from other campuses appear on their purchases and do not know why. Amanda McGowan reported staff asking what a TAAP is when they have only ever done an EAP, with no resource to point them at beyond Sara Marquez explaining it by hand each time. The page is meant to be linkable directly in a reply to a confused requester.";

MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
MATCH (author:Person {name: "Daniel Fontaine"})
MATCH (n:Note) WHERE n.name IN [
  "acr-manual-review-plan-status-sep-2026-yse:2025-2026-1.8-pro-sfsu-d62b40c8",
  "taap-authoring-workflow-stalled-sep-2026-yse:2025-2026-4.6-pro-sfsu-1a8e75f2",
  "procurement-guidance-page-scope-sep-2026-yse:2025-2026-1.10-pro-sfsu-9e50c1b7"]
MERGE (mm)-[:has_note]->(n)
MERGE (n)-[:created_by]->(author);

MATCH (p:Plan {unique_id: "ea0adfc4f79f4a82b125497f3a56becb"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.8-pro-sfsu"})
MATCH (n:Note {name: "acr-manual-review-plan-status-sep-2026-yse:2025-2026-1.8-pro-sfsu-d62b40c8"})
MERGE (p)-[:is_documented_by]->(n)
MERGE (y)-[:has_note]->(n);

MATCH (p:Plan {unique_id: "912f6236bca04f80ac3a35da98e6f276"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-4.6-pro-sfsu"})
MATCH (n:Note {name: "taap-authoring-workflow-stalled-sep-2026-yse:2025-2026-4.6-pro-sfsu-1a8e75f2"})
MERGE (p)-[:is_documented_by]->(n)
MERGE (y)-[:has_note]->(n);

MATCH (p:Plan {unique_id: "84018876988949518301336184e40aa7"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.10-pro-sfsu"})
MATCH (n:Note {name: "procurement-guidance-page-scope-sep-2026-yse:2025-2026-1.10-pro-sfsu-9e50c1b7"})
MERGE (p)-[:is_documented_by]->(n)
MERGE (y)-[:has_note]->(n);


// -------------------------------------------------------------------------------------
// 6. QUERIES
//    Query has no natural unique key, so MERGE on the question text.
// -------------------------------------------------------------------------------------

MERGE (q:Query {question: "If a product has already been reviewed at one campus, does it need an independent review at another, or can the existing review be leveraged?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "policy_decision",
              q.date_raised = date("2026-09-16"),
              q.detail = "Current practice is to check whether a prior review exists, read what it found, and judge whether impact or use case has materially changed since. That is a habit rather than a policy, and everyone is still reviewing individually. A streamlined path would still have to check use-case parity: ten staff users at one campus and campus-wide at another is not the same purchase. The group agreed this is worth developing and did not develop it.";

MATCH (q:Query {question: "If a product has already been reviewed at one campus, does it need an independent review at another, or can the existing review be leveraged?"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.9-pro-sfsu"})
MATCH (raiser:Person {name: "Sara Marquez"})
MATCH (owner:Person) WHERE owner.name IN ["Jonathan Hale", "Amanda McGowan"]
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owner);

MERGE (q:Query {question: "Can a report be pulled showing who processed which ATI reviews?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "technical_clarification",
              q.date_raised = date("2026-09-16"),
              q.detail = "Amanda McGowan wants monthly workload visibility, to show campus executives the scale of review work. Neither Jonathan Hale nor Margaret Price knows of an existing report. A reviewer can see their own recent history over a 7 to 40 day window; whether that extends to a cross-person view is unknown. Jonathan Hale will raise it with Procurement. Logged as a nice-to-have, not a blocker.";

MATCH (q:Query {question: "Can a report be pulled showing who processed which ATI reviews?"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-sfsu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.9-pro-sfsu"})
MATCH (raiser:Person {name: "Amanda McGowan"})
MATCH (owner:Person {name: "Jonathan Hale"})
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owner);

MERGE (q:Query {question: "What is Sonoma State's current eREC backlog count?"})
ON CREATE SET q.unique_id = replace(randomUUID(), "-", ""),
              q.status = "open",
              q.category = "information_gap",
              q.date_raised = date("2026-09-16"),
              q.detail = "The three-campus backlog snapshot taken on the call captured East Bay at 40 items and SF State at 9 commodity plus 6 form items. Sonoma's number was not captured. Without it the snapshot cannot be used to compare load across the three campuses or to size the cross-campus queue.";

MATCH (q:Query {question: "What is Sonoma State's current eREC backlog count?"})
MATCH (wgp:WorkingGroupPlan {plan_identifier: "2025-2026-ssu-pro"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-8.9-pro-ssu"})
MATCH (raiser:Person {name: "Daniel Fontaine"})
MATCH (owner:Person {name: "Sara Marquez"})
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:addresses_evidence]->(y)
MERGE (q)-[:query_raised_by]->(raiser)
MERGE (q)-[:answerable_by]->(owner);


// -------------------------------------------------------------------------------------
// 7. CONCERN
//    No natural unique key, so MERGE on the has_concern pattern with the concern text.
// -------------------------------------------------------------------------------------

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.5-pro-sfsu"})
MERGE (y)-[:has_concern]->(c:Concern {concern: "Purchases coded as goods and services bypass ATI accessibility review entirely."})
ON CREATE SET c.unique_id = replace(randomUUID(), "-", ""),
              c.status = "open",
              c.date_raised = date("2026-09-16"),
              c.detail = "A requisition coded as goods and services does not route through ATI review. Whether a purchase is reviewed therefore depends on how it was categorised at intake rather than on what is being bought. Amanda McGowan found a live instance while tracing a product's purchase history, Sara Marquez confirmed such items do sometimes reach the ATI queue anyway and could not say why, and Jonathan Hale has kicked back at least one. Nobody has named a fix, nobody owns the miscoding, and no decision is pending that would settle it. The indicator that describes this directly is 8.12-pro, which asks for a platform-agnostic process ensuring all ICT purchases undergo a consistent conformance review; it was introduced in 2026-2027 and has no 2025-2026 evidence record, so this is filed against 1.5-pro for the current reporting year.";

MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.5-pro-sfsu"})-[:has_concern]->(c:Concern {concern: "Purchases coded as goods and services bypass ATI accessibility review entirely."})
MATCH (raiser:Person {name: "Amanda McGowan"})
MERGE (c)-[:raised_by]->(raiser);


// -------------------------------------------------------------------------------------
// 8. STAMP THE MINUTES
// -------------------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {unique_id: "3ac59862c2314fd7b2770967ae0f56fa"})
SET mm.ontology_ingested = true,
    mm.ontology_ingest_date = date("2026-09-16"),
    mm.ontology_ingest_note = "17 notes, 3 plans created, 3 existing plans annotated, 3 queries, 1 concern. No implementation created: cross-campus eREC assignment falls under the existing SFBRN CSUBuy IT Accessibility Review Procedure and lands there as notes. No tools: P2P is neither a remediation target nor a remediation instrument. 0 of 0 open queries settled.";
