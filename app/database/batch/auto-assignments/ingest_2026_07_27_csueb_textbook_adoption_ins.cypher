// ============================================================================
// Ingest: 2026-07-27 meeting — "CSU East Bay Textbook Adoption Platform"
// Source: MeetingMinutes node 'Meeting Notes: CSU East Bay Textbook Adoption
//         Platform' (uid f1f411b6..., under 2025-2026-csueb-ins, recorded by
//         Daniel Fontaine). Ingested per the approved decision manifest
//         (2026-07-28); GAP-FILL ingest — Daniel logged core evidence DURING
//         the call, so this script enriches rather than creates:
//
//   - Process 'CSUEB Textbook Adoption Monitoring Platform' existed with a
//     25-char stub description, no owner, no participants, evidence on 1.1
//     only. Enriched here: description REPLACED (approved user-content edit),
//     owned_by/worked_on -> Zach Oshri, WG accountability, evidence += 1.2/1.6
//     (the minutes' stated purpose maps the platform to 1.1/1.2/1.6).
//   - Process 'Textbook Adoption Internal Tracking' existed (owned by Zach):
//     adds WG accountability + evidence 1.2 (documented submission practices).
//   - Plan 'See full implementation of Textbook Adoption Tracker' existed
//     ORPHANED (no WGP/year/furthers, description 'More to come'): wired under
//     2025-2026-csueb-ins + AY + furthers 1.1; description REPLACED (approved).
//   - Note 'Early Testbook Nudge Example' (nudge email text) already exists on
//     1.1 — not duplicated; the nudge-system note here references it.
//   - NO Person nodes created: Joyce Bold (Follett employee), Demario Webb,
//     'Kristen' (unresolved, as-heard), 'Blake' are note-prose only.
//   - NO new Tools/Assets: Alma/Primo, PeopleSoft, Salesforce, the LTI app,
//     oc.csueastbay.edu stay in prose. ZCCM/LCCM policy NOT minted as
//     InternalPolicy (Zach uncertain it cleared) -> information_gap Query.
//   - Dashboard figures are prose, not Metrics (no artifact in hand).
//
// Dates use the meeting date 2026-07-27. Idempotent MERGEs; the two SETs
// (description replacements) are deliberate and re-runnable.
// ============================================================================


// ---------------------------------------------------------------------------
// 1. IMPLEMENTATION ENRICHMENT
// ---------------------------------------------------------------------------

// Platform process: replace stub description; owner; WG accountability.
MATCH (proc:Process {title:'CSUEB Textbook Adoption Monitoring Platform'}),
      (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (zach:Person {name:'Zach Oshri'})
SET proc.description = "Textbook adoption monitoring system built and run by Zach Oshri (Online Campus / Academic Technology; the library works the data), live at oc.csueastbay.edu. Pipeline: Follett sends a raw adoption file daily at 10 PM Central (negotiated access replacing unusable once-or-twice-per-term parsed reports; ~1,300 adoptions currently); the feed lacks instructor names, which are matched in from Canvas; each adopted title is checked against Alma/Primo for library holdings, format (print/ebook/both), and license type, linking to the Primo record. Library procurement staff verify links once per term (deliberate human-in-the-loop; ~80% accurate today, Alma query scoping being narrowed); every field is editable with direct ISBN lookups. Dashboard: projected student savings, OER coverage, library coverage, ebook access counts, adoption rate (~53% three weeks out; 45-55% typical), term-over-term charting planned. Nudge subsystem: compares Canvas enrollment/instructor data against the feed and messages instructors with no adoption on file via email AND Canvas, linking the timely-adoption and zero-cost/low-cost policies. Also produces an Excel report of zero-cost candidates for PeopleSoft ZCCM/LCCM labeling. Status: test phase, first iteration, built in about a week after Follett approved raw data access."
MERGE (proc)-[:accountable_working_group]->(wg)
MERGE (proc)-[:owned_by]->(zach);

MATCH (proc:Process {title:'CSUEB Textbook Adoption Monitoring Platform'}),
      (zach:Person {name:'Zach Oshri'})
MERGE (zach)-[w:worked_on {role_handle:'role:developer'}]->(proc)
  ON CREATE SET w.note = "Built the platform in about a week after Follett approved raw feed access; tunes it iteratively with library procurement.",
                w.added_date = date('2026-07-27');

MATCH (proc:Process {title:'CSUEB Textbook Adoption Monitoring Platform'}),
      (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-1.2-ins-csueb','2025-2026-1.6-ins-csueb']
MERGE (proc)-[:is_evidence_for]->(y);

// Internal tracking process: WG accountability + evidence 1.2.
MATCH (tr:Process {title:'Textbook Adoption Internal Tracking'}),
      (wg:ATIWorkingGroup {name:'Instructional Materials'})
MERGE (tr)-[:accountable_working_group]->(wg);

MATCH (tr:Process {title:'Textbook Adoption Internal Tracking'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.2-ins-csueb'})
MERGE (tr)-[:is_evidence_for]->(y);

// Zach's evidence assignments for the adoption family he runs.
MATCH (zach:Person {name:'Zach Oshri'}), (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-1.1-ins-csueb','2025-2026-1.2-ins-csueb','2025-2026-1.6-ins-csueb']
MERGE (zach)-[:implements]->(y);


// ---------------------------------------------------------------------------
// 2. PLANS
// ---------------------------------------------------------------------------

// Existing during-call plan, currently orphaned: wire + replace description.
MATCH (pl:Plan {name:'See full implementation of Textbook Adoption Tracker'}),
      (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-csueb-ins'}),
      (ay:AcademicYear {name:'2025-2026'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-csueb'})
SET pl.description = "Full campus adoption of the CSUEB textbook adoption monitoring platform (currently test phase, first iteration, tuned with library procurement). Path to production: fix the remaining ~20% data accuracy (Alma/Primo link scoping), open the no-reply Canvas service account and begin nudge sends, then move out of test. Campus-wide adoption is what lifts SI 1.1 from defined toward established (D. Fontaine's assessment during the 2026-07-27 walkthrough)."
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay)
MERGE (pl)-[:furthers_yse]->(y);

// New: Salesforce consolidation (S2 committed intent, department-level).
MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-csueb-ins'}),
      (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'CSUEB: Consolidate textbook adoption data into Salesforce'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "Move the textbook adoption data into Salesforce so it lives in one dataset (department-level deployment; the campus would not notice the change). Today answering a single Alt Media question spans five data sources; consolidation would let student-specific Alt Media work be built quickly off one dataset and let the Canvas nudge trigger from Salesforce instead of manipulating several databases. Risk noted 2026-07-27: uncertainty how long East Bay keeps Salesforce and whether a new contractor is coming.",
                pl.plan_status = 'Not Started',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan {name:'CSUEB: Consolidate textbook adoption data into Salesforce'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-4.5-ins-csueb'})
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------------
// 3. PENDING QUESTIONS
// ---------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-csueb-ins'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-csueb'})
MERGE (q:Query {question:'Who on campus owns the timely textbook adoption process at CSU East Bay?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "Success indicator 1.1 (formally documented process ensuring timely adoption) effectively belongs to the bookstore, and no on-campus employee does the work: the operative contact is Joyce Bold, a Follett employee. Demario Webb is the bookstore manager listed as head of technical services, but Zach Oshri checked his email and concluded Joyce Bold is the real contact. Raised while recording platform evidence at the 2026-07-27 walkthrough.",
                q.category = 'risk_compliance',
                q.status = 'open',
                q.date_raised = date('2026-07-27')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(df)
MERGE (q)-[:addresses_evidence]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-csueb-ins'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-csueb'})
MERGE (q:Query {question:'Has the CSUEB zero-cost/low-cost course materials policy been formally adopted?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "One of the two campus policies logged as evidence context for timely adoption, but Zach Oshri believes it cleared and was not certain (2026-07-27). PeopleSoft ZCCM/LCCM schedule labeling — which drives student enrollment behavior — depends on it, and the nudge messages link to it. Confirm adoption status; if adopted, record it as an InternalPolicy evidence node (deliberately NOT minted from this meeting because of the uncertainty).",
                q.category = 'information_gap',
                q.status = 'open',
                q.date_raised = date('2026-07-27')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(df)
MERGE (q)-[:addresses_evidence]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-csueb-ins'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-4.1-ins-csueb'})
MERGE (q:Query {question:'Which CSU campuses maintain central syllabus databases, and should East Bay adopt one?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "East Bay has no central place to find syllabi even though policy requires posting by the first day of classes; scraping Canvas was proposed and rejected. Other CSUs reportedly maintain syllabus databases (raised as-heard by 'Kristen' in the 2026-07-27 meeting; identity unresolved); Daniel Fontaine was not aware of one at SF State. Students cannot learn required materials until day one, which eliminates shipping time and blocks the library and Alt Media from working ahead.",
                q.category = 'information_gap',
                q.status = 'open',
                q.date_raised = date('2026-07-27')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(df)
MERGE (q)-[:addresses_evidence]->(y);


// ---------------------------------------------------------------------------
// 4. NOTES (attached to the existing MeetingMinutes + the YSE they inform)
// ---------------------------------------------------------------------------

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.2-ins-csueb'})
MERGE (n:Note {name:'csueb-adoption-data-pipeline-jul-2026-yse:2025-2026-1.2-ins-csueb-4e7a21c9'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Data pipeline behind the CSUEB textbook adoption monitoring platform (Zach Oshri, 2026-07-27): Follett now sends a raw adoption file daily at 10 PM Central — negotiated access replacing parsed reports that arrived once or twice a term and needed re-parsing. Current volume ~1,300 adoptions across all departments. The feed lacks instructor first/last names, which are matched in from Canvas. Each adopted title is checked against Alma/Primo for holdings, format (print/ebook/both), and license type (single user / three user / unlimited), linking to the Primo record. Library procurement staff — the primary users, the people ordering textbooks and negotiating ebook contracts — verify generated links once per term; the human loop is deliberate because Primo link construction is hard to scope and some links were wrong. Accuracy ~80% with the remainder under investigation; the Alma query is being narrowed. Every field is editable and staff can run an Alma/Primo ISBN lookup directly from a record. Test phase; built in about a week once Follett approved raw access."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.6-ins-csueb'})
MERGE (n:Note {name:'csueb-adoption-dashboard-reporting-jul-2026-yse:2025-2026-1.6-ins-csueb-b83d5f12'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Dashboard of the CSUEB adoption platform as the semesterly performance-report vehicle (2026-07-27): projected student savings if students used only library-held material, including OER and zero/low-cost — the first time a dollar amount could be attached to any of this; OER coverage (50 sections, more expected); library coverage share; ebook access counts; adoption rate ~53% three weeks out from term (East Bay typically runs 45-55%, treated as acceptable); term-over-term analytics with charting planned. Positions the platform to satisfy the 1.6 requirement of distributing timely-adoption performance reports to campus administration each semester once it moves out of test."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-csueb'})
MERGE (n:Note {name:'csueb-adoption-nudge-system-jul-2026-yse:2025-2026-1.1-ins-csueb-9c15e6d4'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Nudge subsystem (2026-07-27): the platform compares Canvas enrollment and instructor data against the Follett feed and, where a course has no adoption on file, messages the instructor on both channels — email plus a Canvas message — whether they are late or have affirmatively chosen not to adopt. Messages point instructors to their adoptions and link the campus timely textbook adoption policy and the zero-cost/low-cost policy. Email goes out via mail merge because the team works from shared inboxes (a standalone SMTP inbox was requested and denied); a no-reply Canvas service account is planned to carry the Canvas side. No nudge mechanism of any kind existed before. See the existing note 'Early Testbook Nudge Example' for the message text."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-csueb'})
MERGE (n:Note {name:'csueb-zccm-lccm-labeling-gap-jul-2026-yse:2025-2026-1.1-ins-csueb-2f6b8a07'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Zero-cost/low-cost labeling gap (2026-07-27): Follett does not reliably report zero/low-cost status — its data returns OER or nothing — while the designation that matters lives in PeopleSoft (ZCCM/LCCM schedule labels) and those records are often missing or wrong. The platform generates a downloadable Excel report of candidates: courses whose instructor told Follett no textbook is used and which should probably be flagged in PeopleSoft. The list is long, not a handful of rows. Staff workflow: check the PeopleSoft side and go back to instructors who have not recorded it. Stakes: students avoid courses whose material costs they cannot see, so unlabeled zero-cost sections lose enrollment they would otherwise get — an active campus discussion for months."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-csueb'})
MERGE (n:Note {name:'csueb-adoption-accountability-survey-jul-2026-yse:2025-2026-1.1-ins-csueb-d174c3e8'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Accountability and practice findings (2026-07-27): ownership of the timely-adoption process sits with the bookstore and effectively with Follett — the operative contact is Joyce Bold (Follett employee); Demario Webb is bookstore manager, listed as head of technical services, but Joyce Bold is the working contact. Before building the platform, Zach Oshri ran a department-by-department survey (Google Doc 'Textbook Adoption Form Simplified' — the Textbook Adoption Internal Tracking process) covering contact person, submission method, curriculum committee, ZCCM/LCCM labeling status, and blockers. Findings: practice varies widely — an admin, the chair, or individual faculty submit depending on department — and none of it was documented anywhere before. Root cause identified: departments leave sections unassigned until the last possible moment; the late-assigned instructor is already behind on the course shell and never reaches the adoption."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-4.5-ins-csueb'})
MERGE (n:Note {name:'csueb-alt-media-dependency-jul-2026-yse:2025-2026-4.5-ins-csueb-6a92f0b5'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Alt Media dependency (2026-07-27): alternate media production depends on textbook adoptions — without them the team chases faculty for syllabi; with the daily Follett feed they can start production ahead of the term instead of waiting on the instructor. The advantage is contingent on adoptions actually being submitted, which is what the nudge subsystem is meant to force. Current pain: answering a single Alt Media question takes five different data sources; consolidating adoption records into Salesforce (see plan) would let student-specific Alt Media work run off one dataset."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-4.1-ins-csueb'})
MERGE (n:Note {name:'csueb-syllabus-visibility-gap-jul-2026-yse:2025-2026-4.1-ins-csueb-e3c07d61'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Syllabus visibility gap (2026-07-27): there is no central place at East Bay to find syllabi although policy requires posting by the first day of classes. Scraping them out of Canvas was proposed and rejected. Consequence: a student cannot learn the required book until day one, leaving no room for shipping time; the library is willing to fulfill these titles but historically had no visibility until a student requested something — the Follett feed now lets them work ahead. Other CSUs reportedly maintain syllabus databases (raised by 'Kristen' — identity unresolved, as heard); Daniel Fontaine was not aware of one at SF State either."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'csueb-adoption-action-items-jul-2026-mm-f1f411b6-58b1a4f2'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Action items, 2026-07-27 CSUEB textbook adoption walkthrough. Zach Oshri: fix the ~20% inaccurate data starting with Alma/Primo link scoping; open the no-reply Canvas service account and start running nudge messages; keep tuning the platform with the procurement team; tell Daniel when it moves out of test into production; set up a demo meeting with Tim Hensel (Sonoma) and Cristian Alvarado (SF State) within a week or two; log into the SFBRN tracking system, add his own work, and report back on what works and what does not. Daniel Fontaine: record the platform, tracking document, both policies, and nudge email as evidence under 1.1 INS (done during the call); convert the transcript into minutes and file under the East Bay campus plan (done); coordinate the tri-campus demo if Zach does not; continue working the SFBRN reporting path with Amanda McGowan and Leon so campuses enter data once instead of re-entering it into the chancellors office form system."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Meeting Notes: CSU East Bay Textbook Adoption Platform'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'csueb-side-discussion-jul-2026-mm-f1f411b6-07d9c2ae'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-07-27'), n.include_in_report = true,
                n.content = "Side discussion, 2026-07-27. Conference: Daniel presents Thursday in Monterey on the tracking system (built over ~2.5 years after inheriting the work as an Excel file; core argument: the data is relational and does not belong in a table); both attending. Reflow successor: Zach Oshri and Blake are building a next-generation document converter — open models, hosting as the only real cost, and an instructor-feedback loop where describing a badly converted table drives reprocessing against that feedback; Reflow stays better at scale, the successor targets accuracy on the rare cases Reflow cannot self-correct; server provisioned, awaiting Anthropic credits. Infrastructure: Zach was given a virtual server on campus hardware rather than the AWS setup he wanted; Daniel's take — working within campus systems is part of establishing credibility to do more later. Tooling opinion: Zach's minimum bar for document remediation is ABBYY FineReader, not drawing boxes by hand in Adobe; he stopped using Equidox after repeatedly finding its output wrong, including corrections that did not survive into Adobe. Neither Sonoma nor SF State currently uses ABBYY. Zach was also briefed on the Sonoma remediation program."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);
