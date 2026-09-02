// ============================================================================
// Ingest: 2026-08-10 meeting — "CSU East Bay — Bulk Course File Remediation
//         Tool and AI Document Remediation Platform Demo For SF State AT"
// Source: MeetingMinutes uid f85a1660f37b4ee08326d843dfab92d6 (filed under
//         2025-2026-sfsu-ins — SFSU convened; CSUEB operational content anchors
//         to the ...-ins-csueb YSE family). Ingested per the approved decision
//         manifest (2026-08-10), amendment: the three Notes are created_by
//         Zach Oshri (user decision), not the ingesting user.
//
// ENRICHMENT-DOMINANT ingest — both demoed tools already existed as Process
// nodes from the shared-tracking-system entries (repo-derived descriptions,
// YSE wiring in place, but no owner / worked_on / tools / WG accountability):
//   - Process 'UDOIT Course Accessibility Scanning & Bulk Remediation
//     (UDOITOrchestrator)': description REPLACED (approved) with the merged
//     end-to-end walkthrough (MS-Form intake, two service modes, SharePoint
//     folder-pair workflow, ABBYY-then-Acrobat file pass, outreach evolution);
//     owned_by/worked_on -> Zach Oshri; WG accountability; uses_tool ->
//     udoit-advantage, adobe-acrobat-pro, abbyy-finereader (new Tool).
//   - Process 'Equalify Reflow PDF Accessibility Pipeline (reflow-canvas-lti)':
//     description REPLACED (approved) with pipeline internals (PII scrub,
//     Docling OCR, Claude inference, Markdown intermediate), operations data
//     (400k PDFs / ~90%), cost + portability, pilot status; same edge set
//     (no uses_tool — Docling/Claude/OpenRouter are components, kept in prose).
//   - Existing is_evidence_for wiring on both untouched (6.7+6.8-ins-csueb;
//     6.8+5.13-ins-csueb).
// Identity: all participants resolved to existing Person nodes; NO new people.
//   Cristian Alvarado title corrected 'LMS Administrator' -> 'ET Services Lead'
//   (S1 first-person; the minutes flag the title change explicitly).
//   'John at Sonoma' peripheral -> prose only. AI engineer "formerly at DQ" is
//   AS-HEARD (likely Deque) — flagged in prose, never asserted.
// New nodes: Tool abbyy-finereader (S1 operating step in the standing workflow,
//   unlike the 7/27 opinion-aside that stayed prose); Plan 'SFSU: Pursue CSUEB
//   AI remediation platform via SFBRN' (S2, Cristian's action items); Query on
//   SFBRN AWS hosting (resource_request, raised by Zach, anchored under the
//   sfsu-ins WGP as the decision venue, addressing 5.13-ins-csueb); 3 Notes.
// Community: Zach -> member_of_community -> Academic Technology (S1); no new
//   has_stake_in (existing stakes already cover 6.8/5.13/5.14-ins).
// Omitted: SharePoint/MS Forms/Docling/Claude/OpenRouter/Qwen as Tools (infra/
//   components); Metric nodes for 400k PDFs & shell counts (no artifact);
//   platform as Asset (already modeled as the Process); StatusLevel changes.
//
// Dates use the meeting date 2026-08-10. Idempotent MERGEs; the two SETs
// (description replacements) and the title fix are deliberate and re-runnable.
// ============================================================================


// ---------------------------------------------------------------------------
// 1. IDENTITY CORRECTION
// ---------------------------------------------------------------------------

MATCH (p:Person {name:'Cristian Alvarado'})
SET p.title = 'ET Services Lead';


// ---------------------------------------------------------------------------
// 2. TOOLS
// ---------------------------------------------------------------------------

MERGE (t:Tool {tool_identifier:'abbyy-finereader'})
  ON CREATE SET t.unique_id = randomUUID(),
                t.title = 'ABBYY FineReader',
                t.description = "OCR and document-conversion suite used as the first pass in CSUEB's download-based file remediation: configured properly it generates most PDF tag structure automatically; student assistants then confirm tags manually in Adobe Acrobat. Zach Oshri's stated minimum bar for document remediation tooling (2026-07-27 aside; operating role confirmed 2026-08-10).";


// ---------------------------------------------------------------------------
// 3. IMPLEMENTATION ENRICHMENT — UDOITOrchestrator (bulk remediation workflow)
// ---------------------------------------------------------------------------

MATCH (proc:Process {title:'UDOIT Course Accessibility Scanning & Bulk Remediation (UDOITOrchestrator)'}),
      (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (zach:Person {name:'Zach Oshri'})
SET proc.description = "End-to-end Canvas course-file remediation run by Zach Oshri (Online Campus / Academic Technology). Intake: faculty submit a Microsoft Form (name, email, department, up to five courses, term, priority). Two service modes — direct designer access (a student assistant is added to the live course and remediates in place) or download-based remediation (files pulled out, remediated externally, pushed back), with the team deliberately shifting work toward download-based. The UDOITOrchestrator browser extension (public, v2.4.0, AGPL-3.0) closes UDOIT's bulk gap: it scans a course via UDOIT (Cidi Labs hosted), pulls ONLY flagged files through the Canvas API into a ZIP with a manifest mapping each file back to its original location, supports batch runs across sub-accounts (~200 courses pulled in about an hour, optional fresh UDOIT scan per run), and pushes remediated files back into Canvas in seconds with overwrite and optional rescan verification. Working storage is SharePoint: one original/finished folder pair per faculty member; original-folder edit access is cut off two weeks after creation (later additions go through the request queue); student assistants remediate — ABBYY FineReader first for tag structure, then manual confirmation in Adobe Acrobat, with Word/PowerPoint/Excel compliance checked separately — progress tracked as a finished:original file-count percentage in a color-coded spreadsheet, and a 1:1 match auto-emails the faculty member to review the finished folder. Re-upload runs through the extension by the faculty member, Zach, or student designers. The same workflow serves instructional-materials remediation and East Bay's Alt Media services. Coverage evolved from pure opt-in to opt-in plus proactive UDOIT-report outreach to flagged courses (roughly 30% of contacted faculty respond)."
MERGE (proc)-[:accountable_working_group]->(wg)
MERGE (proc)-[:owned_by]->(zach);

MATCH (proc:Process {title:'UDOIT Course Accessibility Scanning & Bulk Remediation (UDOITOrchestrator)'}),
      (zach:Person {name:'Zach Oshri'})
MERGE (zach)-[w:worked_on {role_handle:'role:developer'}]->(proc)
  ON CREATE SET w.note = "Built and operates the extension and the surrounding intake/SharePoint workflow; walked SF State through it end-to-end 2026-08-10 and shared the GitHub repo.",
                w.added_date = date('2026-08-10');

MATCH (proc:Process {title:'UDOIT Course Accessibility Scanning & Bulk Remediation (UDOITOrchestrator)'}),
      (t:Tool)
WHERE t.tool_identifier IN ['udoit-advantage','adobe-acrobat-pro','abbyy-finereader']
MERGE (proc)-[:uses_tool]->(t);


// ---------------------------------------------------------------------------
// 4. IMPLEMENTATION ENRICHMENT — Equalify Reflow (AI document remediation)
// ---------------------------------------------------------------------------

MATCH (proc:Process {title:'Equalify Reflow PDF Accessibility Pipeline (reflow-canvas-lti)'}),
      (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (zach:Person {name:'Zach Oshri'})
SET proc.description = "AI-driven document remediation platform integrated into Canvas via LTI 1.3, built by Zach Oshri with a University of Illinois Chicago counterpart (plus an outside AI engineer, company as-heard 'DQ' — likely Deque, unverified), hosted at accessibility-checker.csueastbay.edu on a single dedicated campus server. Pipeline per watched course file: PII scrub (emails, SSNs and similar) before any processing; OCR text extraction via IBM's open-source Docling (base text only); AI semantic inference — heading levels, alt text for figures, table structure, math/chemistry handling — currently on Anthropic Claude; output lands as Markdown, a deliberate intermediate that converts cleanly to HTML with math rendering, MP3 audio, translations, Braille, tagged PDF, or the primary faculty-facing target, a Canvas page with structure intact. Faculty edit the generated output side-by-side (including alt text); nothing is visible to students until explicitly published through the LTI tool. Course-copy safe: remediation is an overlay keyed to file presence in the shell, so processed state travels with copies and files are not reprocessed. Scale to date: 400,000+ PDFs at roughly 90% first-pass accuracy (scores not directly comparable across content types), validated with low-vision users navigating the output. Cost: under $0.20 per document vs. ~$70,000-80,000/yr for 14 student assistants; portability tested with Qwen via OpenRouter (hundredths of a cent per document; OpenAI models rejected for this inference task), with self-hosted open models as the end-state pending GPU infrastructure East Bay does not yet have. The current server halves throughput (8-10 minutes for a 15-page document vs. 2-3 expected on cluster infrastructure). Status: document pipeline finished and stable; fall pilot with 20 faculty validates the remaining LTI integration layer. Presented publicly at the most recent ATI conference."
MERGE (proc)-[:accountable_working_group]->(wg)
MERGE (proc)-[:owned_by]->(zach);

MATCH (proc:Process {title:'Equalify Reflow PDF Accessibility Pipeline (reflow-canvas-lti)'}),
      (zach:Person {name:'Zach Oshri'})
MERGE (zach)-[w:worked_on {role_handle:'role:developer'}]->(proc)
  ON CREATE SET w.note = "Built the platform with a UIC counterpart; runs the CSUEB fall pilot (20 faculty) and the cost-reduction track (OpenRouter/cheaper models, eventual self-hosting).",
                w.added_date = date('2026-08-10');


// ---------------------------------------------------------------------------
// 5. EVIDENCE ACCOUNTABILITY — Zach implements the remediation family he runs
// ---------------------------------------------------------------------------

MATCH (zach:Person {name:'Zach Oshri'}), (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.7-ins-csueb','2025-2026-6.8-ins-csueb','2025-2026-5.13-ins-csueb']
MERGE (zach)-[:implements]->(y);


// ---------------------------------------------------------------------------
// 6. COMMUNITY MEMBERSHIP
// ---------------------------------------------------------------------------

MATCH (zach:Person {name:'Zach Oshri'}), (c:CommunityOfPractice {name:'Academic Technology'})
MERGE (zach)-[m:member_of_community]->(c)
  ON CREATE SET m.note = "CSUEB Online Campus / Academic Technology — builds and operates the campus course-file and AI document remediation tooling.",
                m.added_date = date('2026-08-10');


// ---------------------------------------------------------------------------
// 7. PLANS
// ---------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}),
      (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'SFSU: Pursue CSUEB AI remediation platform via SFBRN'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "Bring the CSUEB AI document remediation platform (Equalify Reflow) to SF State through SFBRN rather than SFSU alone. Cristian Alvarado raises it with Andrew Roderick and at the standing SFBRN meeting with Andrew and Amanda McGowan (without a premature value statement before Andrew is looped in); loop in Sonoma given likely interest; evaluate SF State scale — ~6,000 course shells in spring, ~3,000 actively used — against a shared BRN-hosted deployment. Rationale (2026-08-10): cloud-infrastructure approval at SFSU alone has historically been difficult; BRN-level backing could clear that obstacle. Cost watch: token-price trajectory is Cristian's stated adoption concern; Zach Oshri's cost-reduction path (Qwen via OpenRouter, eventual self-hosting) is the mitigation.",
                pl.plan_status = 'Not Started',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan {name:'SFSU: Pursue CSUEB AI remediation platform via SFBRN'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------------
// 8. PENDING QUESTIONS
// ---------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}),
      (zach:Person {name:'Zach Oshri'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-csueb'})
MERGE (q:Query {question:'Will SFBRN provide shared cloud (AWS) hosting for the CSUEB AI document remediation platform?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "The platform runs on a single dedicated campus server — 8-10 minutes for a 15-page document vs. 2-3 expected on cluster infrastructure. Zach Oshri cannot independently open an AWS account (campus IT approval politics) and has been trying to get the broader SFBRN team to help move it into AWS; both he and Daniel Fontaine described that effort as open and unresolved on 2026-08-10 (Daniel's action item: support an AWS or equivalent BRN-backed move). A BRN-hosted deployment is also the stated path for SF State / Sonoma adoption of the tool.",
                q.category = 'resource_request',
                q.status = 'open',
                q.date_raised = date('2026-08-10')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(zach)
MERGE (q)-[:addresses_evidence]->(y);


// ---------------------------------------------------------------------------
// 9. NOTES (created_by Zach Oshri — approved manifest amendment; attached to
//    the MeetingMinutes + the YSE each informs)
// ---------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {unique_id:'f85a1660f37b4ee08326d843dfab92d6'}),
      (zach:Person {name:'Zach Oshri'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-csueb'})
MERGE (n:Note {name:'csueb-remediation-outreach-stats-aug-2026-yse:2025-2026-6.8-ins-csueb-7c4e91a2'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-10'), n.include_in_report = true,
                n.content = "CSUEB remediation coverage evolution (Zach Oshri, 2026-08-10): intake began fully opt-in; volumes were insufficient, so Zach began running UDOIT reports proactively with direct outreach to flagged courses. Roughly 70% of contacted faculty never respond and ~30% are captured — an incremental improvement he was explicit does not amount to full compliance. Manual-scale rationale for the AI platform: a full year of manual remediation completed 174 courses against an estimated 2,400-2,600 course shells per semester, the basis for concluding manual work alone can never catch up. Bulk batch runs pull ~200 courses of flagged files in about an hour."
MERGE (n)-[:created_by]->(zach)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {unique_id:'f85a1660f37b4ee08326d843dfab92d6'}),
      (zach:Person {name:'Zach Oshri'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-csueb'})
MERGE (n:Note {name:'csueb-reflow-cost-portability-aug-2026-yse:2025-2026-5.13-ins-csueb-5b8d02f7'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-10'), n.include_in_report = true,
                n.content = "Equalify Reflow economics and model portability (Zach Oshri, 2026-08-10): AI processing cost under $0.20 per document vs. current staffing of 14 student assistants at ~$70,000-80,000/yr combined — scaled university-wide, roughly half the expense. Inference tested with Qwen (performs well) through OpenRouter (single-API access to ~300-400 models; hundredths of a cent per document vs. Anthropic pricing); OpenAI models performed poorly for this inference task and Zach does not trust them for it. End-state is self-hosted open models — effectively free beyond hosting — blocked on GPU infrastructure East Bay has neither approval nor budget for; Zach currently borrows GPU capacity from another institution for testing. He considers the semantic-inference problem solved; the remaining work is marginal cost at scale. Accuracy scores are not comparable across content types (a 97% PDF score is not scored like a 97% web-page score)."
MERGE (n)-[:created_by]->(zach)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {unique_id:'f85a1660f37b4ee08326d843dfab92d6'}),
      (zach:Person {name:'Zach Oshri'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-sfsu'})
MERGE (n:Note {name:'sfsu-reflow-adoption-interest-aug-2026-yse:2025-2026-6.8-ins-sfsu-a91c6e44'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-10'), n.include_in_report = true,
                n.content = "SF State adoption interest (2026-08-10 demo): Cristian Alvarado wants to pursue the AI document remediation platform for SF State and expects John at Sonoma to be similarly interested; he will raise it with Andrew Roderick and at the standing SFBRN meeting with Andrew and Amanda McGowan, deliberately avoiding an unwarranted value statement before Andrew is looped in properly. Stated concern: AI vendors raising token prices could erode the cost proposition (echoing his earlier general concern about AI remediation tools). Scale context: SF State spring figures were ~6,000 course shells existing, closer to ~3,000 actually in use; CSUEB estimates 2,400-2,600 (active-vs-scheduled unconfirmed — Zach to verify and report back). Zach added the GitHub repos for both demoed tools to the shared tracking system; Daniel Fontaine undid the self-approvals per the separate review process and will review the entries."
MERGE (n)-[:created_by]->(zach)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);


// ---------------------------------------------------------------------------
// 10. STAMP THE SOURCE MINUTES AS INGESTED (always the last statement)
// ---------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {unique_id:'f85a1660f37b4ee08326d843dfab92d6'})
SET mm.ontology_ingested = true,
    mm.ontology_ingest_date = date('2026-08-10'),
    mm.ontology_ingest_note = "Enriched 2 Processes (UDOITOrchestrator + Equalify Reflow: merged descriptions, owner, WG accountability, worked_on, tools); created 1 Tool (abbyy-finereader), 1 Plan (SFSU: Pursue CSUEB AI remediation platform via SFBRN), 1 Query (SFBRN AWS hosting), 3 Notes (by Zach Oshri); Zach implements 6.7/6.8/5.13-ins-csueb + joined Academic Technology community; Cristian Alvarado title corrected to ET Services Lead.";
