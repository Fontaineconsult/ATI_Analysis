// ============================================================================
// Ingest: 2026-07-24 meeting — "Discuss Sonoma Canvas Remediation Program"
// Source transcript: app/database/ontology/raw_transcripts/
//   Discuss Sonoma Canvas Remediation Program transcript_2026-07-24_12.01.30.txt
//
// Scope: 2025-2026 academic year, Instructional Materials (ins) working group,
// campuses ssu (Sonoma State) + sfsu (SF State).
//
// Grounded against the live graph (read-only recon, 2026-07-24):
//   - "Timothy" in the transcript = existing Person 'Tim Hensel'
//     (2025-2026-ssu-ins group lead, works_at ssu, implements 2025-2026-6.8-ins-ssu).
//   - MeetingMinutes for this meeting ALREADY EXISTS:
//     'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'
//     (2026-07-24, under 2025-2026-sfsu-ins). This script attaches notes to it
//     rather than creating a second minutes node.
//   - "Zach Autry / Zach over at East Bay" = existing Person 'Zach Oshri' (csueb);
//     no new node needed.
//   - 'Kristen Denver' (accessibility person who left April 2025): NO Person node
//     (user decision 2026-07-24 — departed, owns no current work). Referenced in
//     the program-history note prose only; name as heard by the transcriber.
//   - SFSU implementation NOT created here: the user added the Process
//     'SFSU AT Canvas Remediation' directly (owned_by Cristian Alvarado; evidences
//     4.3/6.7/6.8/7.5/8.1-ins-sfsu; remediates the Canvas Course Shells interface;
//     uses UDOIT Advantage; worked_on by Kevin Connor). Left untouched.
//   - Plans trimmed to the UDOIT annual snapshot only; the two original Queries
//     (live-vs-shell, Verbit license) dropped; two faculty-workshop
//     information_gap Queries added for sfsu + csueb (user decisions 2026-07-24).
//   - Tools udoit-advantage / verbit-complete exist; equidox, adobe-acrobat-pro,
//     servicenow, panopto, jaws are created here.
//   - Note names follow the June-2026 ingest convention:
//     <slug>-<mon>-<year>-yse:<year_identifier>-<8hex>
//
// Idempotent: MERGE keyed on each label's unique property (Person.name,
// Process/Procedure/Service/Guidance.title, Plan by name, Note.name,
// Tool.tool_identifier, Query by question text). unique_id is set ON CREATE so
// raw-Cypher nodes stay addressable by the neomodel/API layer.
// ============================================================================


// ---------------------------------------------------------------------------
// 1. PEOPLE
// ---------------------------------------------------------------------------

// (Kristen Denver deliberately NOT created — see header. Her departure context
// lives in the sonoma-program-history-staffing note below.)

// Tim Hensel — role holdings (capacities evidenced by the transcript).
MATCH (tim:Person {name:'Tim Hensel'}), (r:Role {handle:'role:accessibility-specialist'})
MERGE (tim)-[h:holds_role]->(r)
  ON CREATE SET h.in_position_description = false,
                h.pd_description = "Remediation-program lead absorbed informally alongside classroom, Canvas, and firmware support; John Lynch narrowed his duties to 1-2 roles around June 2026.",
                h.added_date = date('2026-07-24');

MATCH (tim:Person {name:'Tim Hensel'}), (r:Role {handle:'role:instructor-trainer'})
MERGE (tim)-[h:holds_role]->(r)
  ON CREATE SET h.in_position_description = false,
                h.pd_description = "Trains and QA-checks the CTET student remediation team; planning weekly/biweekly tool trainings and a certification pathway.",
                h.added_date = date('2026-07-24');

MATCH (ca:Person {name:'Cristian Alvarado'}), (r:Role {handle:'role:it-manager'})
MERGE (ca)-[h:holds_role]->(r)
  ON CREATE SET h.in_position_description = true,
                h.pd_description = "LMS Administrator; Canvas remediation program assigned to Academic Technology in spring 2026.",
                h.added_date = date('2026-07-24');


// ---------------------------------------------------------------------------
// 2. TOOLS (instruments of the remediation work)
// ---------------------------------------------------------------------------

MERGE (t:Tool {tool_identifier:'equidox'})
  ON CREATE SET t.unique_id = randomUUID(), t.title = 'Equidox',
                t.description = "PDF remediation tool. In production use by the SSU student team; SFSU has access and is learning it as file remediation spins up.";

MATCH (adobe:Vendor {name:'Adobe'})
MERGE (t:Tool {tool_identifier:'adobe-acrobat-pro'})
  ON CREATE SET t.unique_id = randomUUID(), t.title = 'Adobe Acrobat Professional',
                t.description = "Primary PDF remediation tool alongside Equidox."
MERGE (t)-[:supplied_by]->(adobe);

MERGE (t:Tool {tool_identifier:'servicenow'})
  ON CREATE SET t.unique_id = randomUUID(), t.title = 'ServiceNow (SNOW)',
                t.description = "Ticketing system; SSU builds one ticket per course remediation with a standardized subject line so reports can be pulled later.";

MERGE (t:Tool {tool_identifier:'panopto'})
  ON CREATE SET t.unique_id = randomUUID(), t.title = 'Panopto',
                t.description = "Video platform where SSU student remediators correct machine captions in real time.";

MERGE (t:Tool {tool_identifier:'jaws'})
  ON CREATE SET t.unique_id = randomUUID(), t.title = 'JAWS',
                t.description = "Screen reader used for spot testing of remediated content. SSU lacks a full license; chancellors-office licensing links to be shared.";


// ---------------------------------------------------------------------------
// 3. IMPLEMENTATIONS — Sonoma State (CTET)
// ---------------------------------------------------------------------------

// 3a. The core remediation workflow (Process).
MATCH (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (dim:Dimension {handle:'dimension:ict-development-lifecycle'}),
      (tim:Person {name:'Tim Hensel'}),
      (canvas:Asset {asset_identifier:'canvas-lms-ssu'})
MERGE (proc:Process {title:'Canvas Course Remediation (CTET)'})
  ON CREATE SET proc.unique_id = randomUUID(),
                proc.description = "CTET-run remediation of live Canvas courses at Sonoma State, staffed by the student remediation team. Course selection: UDOIT batch scores sorted against enrollment (accessibility-score prioritization) in the Cidi Labs course listing. Each course gets a ServiceNow (SNOW) ticket with a standardized subject line; a student assigns it to themselves, captures a before UDOIT screenshot, and works major-to-minor issues in a Canvas designer role (no gradebook access). Faculty receive canned emails at each step: kickoff (what/how, the named student, an opt-out offer — one opt-out in the first year), then closure with the final UDOIT score, forward-use guidance (import the remediated course, not old sandboxes), and student-authored improvement notes (unused files flagged via UFIXIT, format suggestions such as Pages over documents and Panopto over YouTube). Content is remediated, never changed — spelling/content issues are reported to the instructor, not fixed. A running log (course, instructor, term, student, UDOIT before/after) is the program record. Summer volume 2026: 72 courses; roughly 90% of student time in summer is remediation. UDOIT is re-run on completion; the designer role is removed and the ticket closed."
MERGE (proc)-[:accountable_working_group]->(wg)
MERGE (proc)-[:classified_under]->(dim)
MERGE (proc)-[:owned_by]->(tim)
MERGE (proc)-[:remediates]->(canvas);

MATCH (proc:Process {title:'Canvas Course Remediation (CTET)'}),
      (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.8-ins-ssu','2025-2026-6.7-ins-ssu']
MERGE (proc)-[:is_evidence_for]->(y);

MATCH (proc:Process {title:'Canvas Course Remediation (CTET)'}), (t:Tool)
WHERE t.tool_identifier IN ['udoit-advantage','servicenow','equidox','adobe-acrobat-pro','jaws']
MERGE (proc)-[:uses_tool]->(t);

MATCH (proc:Process {title:'Canvas Course Remediation (CTET)'}), (tim:Person {name:'Tim Hensel'})
MERGE (tim)-[w:worked_on {role_handle:'role:accessibility-specialist'}]->(proc)
  ON CREATE SET w.note = "Program lead: prioritizes courses, QA-checks student work daily, runs the UFIXIT pass, authors the canned faculty communications.",
                w.added_date = date('2026-07-24');

MATCH (proc:Process {title:'Canvas Course Remediation (CTET)'}), (jl:Person {name:'John Lynch'})
MERGE (jl)-[w:worked_on {role_handle:'role:it-manager'}]->(proc)
  ON CREATE SET w.note = "Director of CTET: secured student funding, presents the program at department meetings, escalation path for faculty pushback and resource requests.",
                w.added_date = date('2026-07-24');

// 3b. PDF remediation procedure.
MATCH (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (dim:Dimension {handle:'dimension:ict-development-lifecycle'}),
      (tim:Person {name:'Tim Hensel'})
MERGE (pd:Procedure {title:'PDF Remediation via Equidox and Acrobat (CTET)'})
  ON CREATE SET pd.unique_id = randomUUID(),
                pd.description = "Student remediators make course PDFs accessible with Equidox and Acrobat Professional, preserving content as authored (make it readable; do not convert to Canvas pages unless unusable — faculty content is not changed). Reading order/OCR is verified with built-in readers (e.g. Microsoft read-aloud) and manual numbering of reading order; JAWS for spot screen-reader checks. Scanned government PDFs are first searched for an existing readable version online. Constraint: SSO-bound workstations trap in-progress files on one machine — a shared network drive is planned (see plan)."
MERGE (pd)-[:accountable_working_group]->(wg)
MERGE (pd)-[:classified_under]->(dim)
MERGE (pd)-[:owned_by]->(tim);

MATCH (pd:Procedure {title:'PDF Remediation via Equidox and Acrobat (CTET)'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-ssu'})
MERGE (pd)-[:is_evidence_for]->(y);

MATCH (pd:Procedure {title:'PDF Remediation via Equidox and Acrobat (CTET)'}), (t:Tool)
WHERE t.tool_identifier IN ['equidox','adobe-acrobat-pro','jaws']
MERGE (pd)-[:uses_tool]->(t);

MATCH (pd:Procedure {title:'PDF Remediation via Equidox and Acrobat (CTET)'}), (tim:Person {name:'Tim Hensel'})
MERGE (tim)-[w:worked_on {role_handle:'role:accessibility-specialist'}]->(pd)
  ON CREATE SET w.note = "Defines the procedure; double-checks student output (heading structure, reading order).",
                w.added_date = date('2026-07-24');

// 3c. In-house video caption correction.
MATCH (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (dim:Dimension {handle:'dimension:ict-development-lifecycle'}),
      (tim:Person {name:'Tim Hensel'})
MERGE (vc:Procedure {title:'In-House Video Caption Correction (CTET)'})
  ON CREATE SET vc.unique_id = randomUUID(),
                vc.description = "With no captioning vendor available for general course content, student remediators watch course videos in real time and correct machine captions in Panopto. Verbit exists on campus but only through Disability Services (two licenses, accommodation-driven work only); YouTube-hosted faculty video cannot be remediated by the team. Identified as the slowest part of remediation; a Verbit site license is under consideration (see query)."
MERGE (vc)-[:accountable_working_group]->(wg)
MERGE (vc)-[:classified_under]->(dim)
MERGE (vc)-[:owned_by]->(tim);

MATCH (vc:Procedure {title:'In-House Video Caption Correction (CTET)'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.11-ins-ssu'})
MERGE (vc)-[:is_evidence_for]->(y);

MATCH (vc:Procedure {title:'In-House Video Caption Correction (CTET)'}), (t:Tool {tool_identifier:'panopto'})
MERGE (vc)-[:uses_tool]->(t);

MATCH (vc:Procedure {title:'In-House Video Caption Correction (CTET)'}), (tim:Person {name:'Tim Hensel'})
MERGE (tim)-[w:worked_on {role_handle:'role:accessibility-specialist'}]->(vc)
  ON CREATE SET w.note = "Supervises caption work; assists international students with video tasks where needed.",
                w.added_date = date('2026-07-24');

// 3d. The student team as an ongoing capability (Service).
MATCH (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (dim:Dimension {handle:'dimension:support'}),
      (tim:Person {name:'Tim Hensel'})
MERGE (svc:Service {title:'Student Remediation Team (CTET)'})
  ON CREATE SET svc.unique_id = randomUUID(),
                svc.description = "The CTET student remediation team at Sonoma State: ~6-7 students, with funding stepped up to two concurrent full-day positions. Two lead students run the UDOIT scores, build the SNOW tickets, and send the kickoff emails with before screenshots; the rest remediate. During term the same students also cover classroom tech-runner duties (audio, projectors). Skills were historically self-taught (Equidox/Acrobat picked up on the job) — being replaced with structured onboarding via the Canvas remediation manual, daily check-ins, and QA double-checks by the program lead. Two career tracks are being cultivated: remediation and hardware/AV."
MERGE (svc)-[:accountable_working_group]->(wg)
MERGE (svc)-[:classified_under]->(dim)
MERGE (svc)-[:owned_by]->(tim);

MATCH (svc:Service {title:'Student Remediation Team (CTET)'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-ssu'})
MERGE (svc)-[:is_evidence_for]->(y);

MATCH (svc:Service {title:'Student Remediation Team (CTET)'}), (tim:Person {name:'Tim Hensel'})
MERGE (tim)-[w:worked_on {role_handle:'role:instructor-trainer'}]->(svc)
  ON CREATE SET w.note = "Recruits, trains, and QA-checks the team; daily check-ins; fixing bad habits inherited from the unsupervised period.",
                w.added_date = date('2026-07-24');

MATCH (svc:Service {title:'Student Remediation Team (CTET)'}), (jl:Person {name:'John Lynch'})
MERGE (jl)-[w:worked_on {role_handle:'role:it-manager'}]->(svc)
  ON CREATE SET w.note = "Funding and staffing oversight; performance-management escalation point for the student team.",
                w.added_date = date('2026-07-24');

// 3e. The remediation manual (Guidance).
MATCH (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (dim:Dimension {handle:'dimension:knowledge-skills'}),
      (tim:Person {name:'Tim Hensel'})
MERGE (g:Guidance {title:'Canvas Remediation Manual (CTET)'})
  ON CREATE SET g.unique_id = randomUUID(),
                g.description = "Onboarding manual built as a Canvas course covering all remediation tools the student team uses and the situations they may encounter. Requested by SFBRN (D. Fontaine) as shareable evidence and as a resource for the SFSU program; a course export is to be provided."
MERGE (g)-[:accountable_working_group]->(wg)
MERGE (g)-[:classified_under]->(dim)
MERGE (g)-[:owned_by]->(tim);

MATCH (g:Guidance {title:'Canvas Remediation Manual (CTET)'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-8.3-ins-ssu'})
MERGE (g)-[:is_evidence_for]->(y);


// ---------------------------------------------------------------------------
// 4. IMPLEMENTATIONS — SF State
// (None created here: the user added the Process 'SFSU AT Canvas Remediation'
//  directly in-app, fully wired. See header.)
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// 5. PLANS (wired into the 2025-2026 IM working-group plans)
// ---------------------------------------------------------------------------

// (All other candidate plans dropped per user decision 2026-07-24 — their content
//  survives in the notes below. Only the UDOIT annual snapshot plan is created.)
MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-ssu-ins'}), (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'SSU: Annual UDOIT accessibility snapshot for ATI reporting'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "Produce a yearly point-in-time UDOIT accessibility report extract (machine-readable, CSV preferred) that SFBRN (D. Fontaine) can attach as a success metric in the ATI report. Tim Hensel to trial report formats and filters to capture before/after remediation deltas; SFSU numbers to follow once their program matures.",
                pl.plan_status = 'In Progress',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan {name:'SSU: Annual UDOIT accessibility snapshot for ATI reporting'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.7-ins-ssu'})
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------------
// 6. PENDING QUESTIONS — faculty accessibility workshops at the partner campuses
// (SSU ran UDOIT/UFIXIT faculty workshops last year; the open information gap is
//  what the equivalent offering is at SF State and CSU East Bay.)
// ---------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-8.12-ins-sfsu'})
MERGE (q:Query {question:'What faculty-facing accessibility workshops exist at SF State?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "Prompted by the 2026-07-24 Sonoma meeting: SSU ran faculty UDOIT and UFIXIT workshops last year (publicized in the faculty newsletter, very low attendance; a relaunch with incentive funding is being weighed there). Open question for SF State: what faculty-facing accessibility workshops or trainings currently exist (UDOIT/UFIXIT-style or otherwise), who runs them, and whether Academic Technology should stand some up alongside the new Canvas remediation program.",
                q.category = 'information_gap',
                q.status = 'open',
                q.date_raised = date('2026-07-24')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(df)
MERGE (q)-[:addresses_evidence]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-csueb-ins'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-8.12-ins-csueb'})
MERGE (q:Query {question:'What faculty-facing accessibility workshops exist at CSU East Bay?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "Prompted by the 2026-07-24 Sonoma meeting: SSU ran faculty UDOIT and UFIXIT workshops last year (publicized in the faculty newsletter, very low attendance; a relaunch with incentive funding is being weighed there). Open question for CSU East Bay: what faculty-facing accessibility workshops or trainings currently exist (UDOIT/UFIXIT-style or otherwise), and who runs them.",
                q.category = 'information_gap',
                q.status = 'open',
                q.date_raised = date('2026-07-24')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(df)
MERGE (q)-[:addresses_evidence]->(y);


// ---------------------------------------------------------------------------
// 7. NOTES (attached to the existing 2026-07-24 MeetingMinutes + the YSE they
//    inform; created_by Daniel Fontaine, matching the June-2026 ingest style)
// ---------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {title:'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-ssu'})
MERGE (n:Note {name:'sonoma-program-history-staffing-jul-2026-yse:2025-2026-6.8-ins-ssu-7c41a9e2'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-24'), n.include_in_report = true,
                n.content = "Program history and staffing context (Tim Hensel, 2026-07-24): the previous accessibility person, Kristen Denver (name as heard), left in April 2025, leaving a large drop in oversight — experienced students ran on autopilot toward graduation. Tim picked the program up in 2025 while wearing 3-4 hats in CTET (classroom builds, Canvas support, firmware pushes); John Lynch narrowed him to 1-2 roles around June 2026. CTET has lost 3-4 staff without replacement; there has been no Canvas designer teaching faculty best practices since ~2020 (the Canvas admin absorbs some of it); a designer position is hoped for. Budget cuts mean fewer lecturers and more full-time faculty reviving old (unremediated) courses."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-ssu'})
MERGE (n:Note {name:'sonoma-snow-ticket-workflow-jul-2026-yse:2025-2026-6.8-ins-ssu-3fb2d514'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-24'), n.include_in_report = true,
                n.content = "SSU SNOW ticketing workflow detail (Tim Hensel, 2026-07-24): one ServiceNow ticket per course remediation with an identical standardized subject line (only faculty name + course vary) so reports can be pulled; students self-assign from the queue; canned email responses at every step — kickoff (what we do, named student, designer role explained incl. no gradebook access, opt-out offered), closure (final UDOIT score, what was remediated, unused-files advisory from UFIXIT, guidance to use the remediated course going forward instead of importing old sandboxes/previous semesters). Student is removed from the designer role at close. Only one instructor opted out in the first year. Documentation of this workflow requested by D. Fontaine for reuse at SFSU."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.7-ins-ssu'})
MERGE (n:Note {name:'course-prioritization-accessibility-score-jul-2026-yse:2025-2026-6.7-ins-ssu-91d0c47b'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-24'), n.include_in_report = true,
                n.content = "Course prioritization (both campuses, 2026-07-24): courses are ranked by a composite of UDOIT score and enrollment — SFSU formalizes it in the spreadsheet as an 'accessibility score' (higher = worse); SSU sorts directly in the Cidi Labs course listing (heard as 'cityscape' in the transcript). SSU previously also weighted hybrid modality; dropped for summer. SSU summer 2026 volume: 72 courses total, 12 in third term. Before/after evidence: UDOIT score screen-captured before work starts and re-run at close. Tim referenced the ~20-page remediation guideline report (out of Chico, circulated ~March) listing average per-course remediation times; he summarized it for John Lynch but resists stopwatch management of students."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-ssu'})
MERGE (n:Note {name:'sonoma-tooling-gaps-jul-2026-yse:2025-2026-5.13-ins-ssu-c2e88f01'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-24'), n.include_in_report = true,
                n.content = "SSU tooling gaps and requests (2026-07-24): no ABBYY FineReader (OCR handled via built-in readers + manual reading-order numbering); interested in the Fullerton AI remediation tool (link to be sent); wants a real JAWS license (chancellors-office licensing links to be sent — currently only partial JAWS testing); Verbit locked to two DS licenses; ChatGPT experiments for table/infographic remediation stalled without usable results; DSS (Disability Services) handles only accommodation-driven courses and their support to CTET is limited to third-party software installs in Panopto — everything else falls to the CTET team."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-6.8-ins-sfsu'})
MERGE (n:Note {name:'sfsu-program-status-jul-2026-yse:2025-2026-6.8-ins-sfsu-5ad17b93'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-24'), n.include_in_report = true,
                n.content = "SFSU program status (Cristian Alvarado, 2026-07-24): Canvas remediation inherited by Academic Technology in spring 2026 — first accessibility work for the team, playing catch-up. Live-course remediation, batch UDOIT scans per term, random (no self-select) student-designer assignment, mail-merge faculty notifications, rescan on completion. Spreadsheet is the document of record and feeds per-department reports for chairs/deans questioning course modifications. Spring 2026 ~4,000 courses; summer 862; post-remediation UDOIT trending mid-to-high 80s. Fall imported into UDOIT; faculty activity expected the week before classes. Files not yet in scope; ABBYY FineReader + Equidox planned; file storage on assigned encrypted laptops, else Box or a data-center share (campus discourages file shares in favor of Box)."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: Course Remediation Programs at Sonoma State and SF State'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'cross-campus-action-items-jul-2026-mm-56f1bceb-e0a3f6b8'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-24'), n.include_in_report = true,
                n.content = "Action items, 2026-07-24 SSU/SFSU Canvas remediation meeting. Daniel Fontaine: send Tim Hensel the Fullerton AI tool info, chancellors-office JAWS licensing links, and CCC training-series links; collect from Tim the Canvas remediation manual (course export) and SNOW workflow documentation; request a yearly UDOIT snapshot (CSV preferred) from SSU — later SFSU — as an ATI report metric; connect Tim with Zach Oshri (CSU East Bay). Tim Hensel: evaluate the Fullerton tool; trial UDOIT report formats/filters for the snapshot; propose the shared network drive to John Lynch; consider spreadsheet migration of the remediation log; route students into CCC training and the UDOIT summer camp."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);


// ---------------------------------------------------------------------------
// 8. PEOPLE -> EVIDENCE ASSIGNMENTS (implements)
// ---------------------------------------------------------------------------

MATCH (tim:Person {name:'Tim Hensel'}), (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.7-ins-ssu','2025-2026-5.11-ins-ssu','2025-2026-5.13-ins-ssu','2025-2026-8.3-ins-ssu']
MERGE (tim)-[:implements]->(y);

MATCH (ca:Person {name:'Cristian Alvarado'}), (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.8-ins-sfsu','2025-2026-6.7-ins-sfsu']
MERGE (ca)-[:implements]->(y);
