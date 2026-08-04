// ============================================================================
// Ingest: 2026-08-03 — SF State ATI Instructional Materials Working Group
// Source: MeetingMinutes node 'Instructional Materials Working Group Meeting'
//         (uid 7d97f338..., under 2025-2026-sfsu-ins, recorded by Daniel
//         Fontaine). Approved manifest 2026-08-04 with user amendments:
//
//   - Anchor 2025-2026 (current REPORTING year, per the amended skill rule —
//     the 2026-2027 rollover scaffolding does not move the reporting anchor).
//   - PDF two-pass work: NO new Procedure (user decision) — the existing
//     Process 'SFSU AT Canvas Remediation' absorbs it: evidence += 5.13,
//     uses_tool += adobe-acrobat-pro/equidox, status captured as a note
//     attached to the YSE, the minutes, AND the implementation.
//   - DesignPLUS: new Tool (cidilabs) + Project 'DesignPLUS Rollout (Academic
//     Technology)' owned/worked by Andrew Roderick, evidence 6.5 + 5.16.
//   - Query settled: faculty-workshops (answer from Andrew's CEETL report).
//   - Identity: 'Anosha' -> Anoshua Chaudhuri (prose only, S4 secondhand);
//     'Segal' as-heard unresolved (prose); Miguel Gonzalez Hernandez, Amir,
//     Willie Pang, Christina, Jaime: prose only. 'City Labs' -> Cidi Labs.
//   - Down-routed: IT-student-worker training idea (S3 -> note), Connectivo
//     COI (not ours to decide -> note), San Bernardino AI-literacy report
//     (folded into Project description), DesignPLUS-as-Asset deferred,
//     UChicago PDF system omitted pending a real name.
// ============================================================================


// ---------------------------------------------------------------------------
// 1. TOOLS
// ---------------------------------------------------------------------------

MATCH (v:Vendor {name:'cidilabs'})
MERGE (t:Tool {tool_identifier:'designplus'})
  ON CREATE SET t.unique_id = randomUUID(), t.title = 'DesignPLUS',
                t.description = "Cidi Labs template system inside Canvas (same vendor as UDOIT): builds accessibility in at the template level, detects problems as content is entered, and offers automatic corrections with explanations of WHY something is wrong. Campus add-on license (~$25k / 3 years), not on the systemwide contract; SF State and Humboldt are the only CSU campuses using it (2026-08)."
MERGE (t)-[:supplied_by]->(v);


// ---------------------------------------------------------------------------
// 2. IMPLEMENTATIONS
// ---------------------------------------------------------------------------

// DesignPLUS rollout — Project (time-bound: summer acquisition + pilot, fall rollout).
MATCH (wg:ATIWorkingGroup {name:'Instructional Materials'}),
      (dim:Dimension {handle:'dimension:ict-development-lifecycle'}),
      (ar:Person {name:'Andrew Roderick'}),
      (t:Tool {tool_identifier:'designplus'})
MERGE (pj:Project {title:'DesignPLUS Rollout (Academic Technology)'})
  ON CREATE SET pj.unique_id = randomUUID(),
                pj.start_date = date('2026-06-01'),
                pj.description = "Campus rollout of DesignPLUS (Cidi Labs), led by AVP Academic Technology Andrew Roderick. Framing: purchased primarily for Canvas course quality and student interactivity with accessibility as a strong secondary benefit — faculty come for the design capability and get accessibility reinforcement built in at the template level. Timeline: acquired at the start of summer 2026, large summer pilot, full campus rollout in fall; faculty must redesign courses to adopt it (acknowledged as a significant lift). Pilot: adoption faster than expected — two or three onboarding sessions sufficed, enthusiasm attributed partly to the Moodle-era backlog of things faculty wanted and could not do in plain Canvas. The systemwide CSU Student AI Literacy Essentials course (spring launch) was built on the platform and acts as the demo that sells it. Cautions (C. Alvarado): real complexity — faculty who click every button get into strange places; its accessibility value is that it CONSTRAINS toward doing things correctly, shows prominent banners when something is not accessible, and explains why. Lock-in: pages depend on vendor-served CSS/JavaScript, so the license must be maintained for existing pages to render. Partnership: CPaGE (extended education, three fully-online degree-completion programs) is switching its templating to DesignPLUS. A faculty member is running a formal evaluation/assessment project on the rollout. One unreproducible accessibility report against the AI-literacy course (San Bernardino, apparently an Apple assistive-device approach) was routed to Cidi Labs' technical team."
MERGE (pj)-[:accountable_working_group]->(wg)
MERGE (pj)-[:classified_under]->(dim)
MERGE (pj)-[:owned_by]->(ar)
MERGE (pj)-[:uses_tool]->(t);

MATCH (pj:Project {title:'DesignPLUS Rollout (Academic Technology)'}),
      (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.5-ins-sfsu','2025-2026-5.16-ins-sfsu']
MERGE (pj)-[:is_evidence_for]->(y);

MATCH (pj:Project {title:'DesignPLUS Rollout (Academic Technology)'}),
      (ar:Person {name:'Andrew Roderick'})
MERGE (ar)-[w:worked_on {role_handle:'role:it-manager'}]->(pj)
  ON CREATE SET w.note = "AVP Academic Technology: framed and drove the acquisition, ran the summer pilot and onboarding, leads the fall rollout and the Humboldt/cross-campus conversation.",
                w.added_date = date('2026-08-03');

MATCH (ar:Person {name:'Andrew Roderick'}), (y:YearSuccessEvidence)
WHERE y.year_identifier IN ['2025-2026-6.5-ins-sfsu','2025-2026-5.16-ins-sfsu']
MERGE (ar)-[:implements]->(y);

// Existing Process absorbs the PDF work (user decision — no new Procedure).
MATCH (proc:Process {title:'SFSU AT Canvas Remediation'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-sfsu'})
MERGE (proc)-[:is_evidence_for]->(y);

MATCH (proc:Process {title:'SFSU AT Canvas Remediation'}), (t:Tool)
WHERE t.tool_identifier IN ['adobe-acrobat-pro','equidox']
MERGE (proc)-[:uses_tool]->(t);


// ---------------------------------------------------------------------------
// 3. PLANS (under 2025-2026-sfsu-ins)
// ---------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}), (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'SFSU: DPRC Canvas Studio upload path for captioning'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "Agreed least-complex captioning path (2026-08-03): grant DPRC staff elevated Canvas permissions structured like the Designer role used for UDOIT remediation, so they can upload material into Canvas Studio themselves — unlocking either Verbit or Canvas built-in automatic captions. D. Fontaine leads DPRC staff training once C. Alvarado's team grants the permissions; A. Roderick brings Christina's team fully in once the captioning-vendor question (see query) resolves. No follow-up had occurred since Cristian's earlier meeting proposed this.",
                pl.plan_status = 'Not Started',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan {name:'SFSU: DPRC Canvas Studio upload path for captioning'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.11-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}), (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'SFSU: Office document remediation track'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "Develop the Microsoft Office document track — the other large store of files the team keeps finding (A. Roderick, 2026-08-03). Assessment (D. Fontaine): far more straightforward than PDF — built-in Office accessibility checkers get ~80% of the way, the remainder mostly images needing alt text or OCR; training on the built-in checkers is the right first pass. The onus is on Academic Technology to produce documentation circulable to faculty. Step 3 of Andrew's sequencing (after PDF and video are locked down); faculty ownership comes only after a workflow exists.",
                pl.plan_status = 'Not Started',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan {name:'SFSU: Office document remediation track'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}), (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'SFBRN: PDF and Word remediation documentation on the SFBRN site'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "D. Fontaine is publishing PDF and Word remediation documentation on the SFBRN site and will share it with SF State (and the region) — the reference material behind both the PDF two-pass process and the coming Office track.",
                pl.plan_status = 'In Progress',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);

MATCH (pl:Plan {name:'SFBRN: PDF and Word remediation documentation on the SFBRN site'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-8.3-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------------
// 4. QUERIES
// ---------------------------------------------------------------------------

// New: the captioning-vendor decision blocking the video path.
MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}),
      (ca:Person {name:'Cristian Alvarado'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.11-ins-sfsu'})
MERGE (q:Query {question:'Verbit or Echo Labs: which captioning path for SFSU course video?'})
  ON CREATE SET q.unique_id = randomUUID(),
                q.detail = "The unresolved vendor question from Cristian Alvarado's last captioning meeting; no follow-up since (2026-08-03). It gates the video work: A. Roderick is waiting for it to resolve before bringing Christina's team fully into the discussion, and the DPRC Canvas Studio upload path (see plan) unlocks either Verbit or Canvas built-in captions depending on the answer. Resolving the technical path is expected to resolve some of the organizational questions that keep circling this.",
                q.category = 'resource_request',
                q.status = 'open',
                q.date_raised = date('2026-08-03')
MERGE (q)-[:raised_under_plan]->(wgp)
MERGE (q)-[:query_raised_by]->(ca)
MERGE (q)-[:addresses_evidence]->(y);

// Settle: the faculty-workshops question, answered by Andrew's CEETL report.
MATCH (q:Query {question:'What faculty-facing accessibility workshops exist at SF State?'}),
      (ar:Person {name:'Andrew Roderick'})
SET q.status = 'settled',
    q.answer = "No accessibility-specific faculty workshops exist. Faculty development runs through CEETL (Senior Director Anoshua Chaudhuri): universal design training — the 2.0 version adds equity constructs — and the JEDI PIE equity faculty training. She wants to surface that work within the ATI effort; A. Roderick considers folding accessibility in too complex at this stage and is deliberately deferring it until the core remediation processes settle (reported at the 2026-08-03 IM working group meeting). D. Fontaine is collecting documentation of the CEETL work as faculty-development evidence for the ATI report.",
    q.date_settled = date('2026-08-03')
MERGE (q)-[:query_settled_by]->(ar);


// ---------------------------------------------------------------------------
// 5. NOTES (attached to the minutes + the YSE shown; created_by Daniel)
// ---------------------------------------------------------------------------

// PDF status — also documented on the absorbing implementation (user decision).
MATCH (mm:MeetingMinutes {title:'Instructional Materials Working Group Meeting'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-5.13-ins-sfsu'}),
      (proc:Process {title:'SFSU AT Canvas Remediation'})
MERGE (n:Note {name:'sfsu-pdf-remediation-status-aug-2026-yse:2025-2026-5.13-ins-sfsu-3e91c7a4'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-03'), n.include_in_report = true,
                n.content = "PDF remediation status (2026-08-03): since the Sonoma meeting SF State has started on PDFs, beginning with summer courses as a smaller, low-risk test bed. Tool decision — a two-pass approach: Adobe Acrobat's built-in tools first; anything beyond Acrobat moves into Equidox as a second pass. The split landed after Equidox training for students revealed, in Cristian Alvarado's phrasing, what a beast Equidox is. No unusually difficult documents yet. Cristian's Sonoma-meeting takeaway: both campuses run essentially the same process at different scale — useful validation that SF State is doing it more or less correctly. This work is carried under the SFSU AT Canvas Remediation process (evidence extended to 5.13)."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n)
MERGE (proc)-[d:is_documented_by]->(n)
  ON CREATE SET d.added_date = date('2026-08-03');

MATCH (mm:MeetingMinutes {title:'Instructional Materials Working Group Meeting'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'sfsu-ai-remediation-tools-aug-2026-mm-7d97f338-b25f80d1'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-03'), n.include_in_report = true,
                n.content = "AI remediation tools landscape (2026-08-03). East Bay (Zach Oshri): funding for credits secured, server provisioned, ready to demo — positioned as a staged interface for high-quality output, not a drag-and-drop bulk processor; D. Fontaine's argument for evaluating now is fall/spring volume. Cristian Alvarado's two concerns: cost exposure (AI vendors are starting to expose real pricing — avoid building dependence on a tool that gets pulled on cost) and verification (bulk throughput and quality assurance pull against each other). Fullerton: Amir has a platform delivered through a vendor called Connectivo — apparently the tool Willie Pang presented at the conference; A. Roderick raised a conflict-of-interest question (Fullerton IP vs private business, ownership unclear), is unenthusiastic but pressured into hosting a demo, and will include Daniel and Amanda. Agreement: demo the East Bay tool AND hold a broader conversation about East Bay's whole accessibility process; Daniel sets it up. Also: Miguel at East Bay is pushing a University of Chicago PDF remediation system Daniel described as impressive — name did not transcribe, confirm before it goes anywhere."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Instructional Materials Working Group Meeting'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'csueb-reorg-academic-technology-aug-2026-mm-7d97f338-6c04e9f2'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-03'), n.include_in_report = true,
                n.content = "East Bay organizational context (2026-08-03): after a recent reorganization, East Bay's ATI coordinator sits within Academic Technology under Miguel Gonzalez Hernandez — a position roughly equivalent to SF State's AVP Academic Technology. Possibly recently moved; a search may be pending; some role confusion remains since Miguel continues doing web work alongside. Zach Oshri is East Bay's remediation expert, which makes the planned combined demo + process conversation efficient (A. McGowan)."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Instructional Materials Working Group Meeting'}),
      (df:Person {name:'Daniel Fontaine'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-8.12-ins-sfsu'})
MERGE (n:Note {name:'sfsu-faculty-development-udl-aug-2026-yse:2025-2026-8.12-ins-sfsu-a81d35c6'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-03'), n.include_in_report = true,
                n.content = "Faculty development / UDL evidence (2026-08-03, reported by A. Roderick): CEETL (Senior Director Anoshua Chaudhuri — transcribed as 'Anosha') runs universal design faculty training; the 2.0 version incorporates equity constructs, and they have been running JEDI PIE equity faculty training ('Segal' as transcribed, involvement to verify). She wants to surface that within the ATI work; Andrew considers folding it in too complex at this stage and prefers to set it aside until core remediation processes settle, then incorporate — he offered to help document it however needed. D. Fontaine needs either a meeting with Anoshua or written notes for the faculty-development goal in the ATI report. This report settled the open faculty-workshops query."
MERGE (n)-[:created_by]->(df)
MERGE (y)-[:has_note]->(n)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Instructional Materials Working Group Meeting'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'sfsu-culture-sequencing-roadmap-aug-2026-mm-7d97f338-f47b02e9'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-03'), n.include_in_report = true,
                n.content = "Culture and sequencing (2026-08-03). Conference theme (A. McGowan): get faculty to understand that a document created accessibly at the start leaves nothing to remediate — the create-accessible-first framing stayed hot all conference. A. Roderick's sequencing for the year: 1) lock down PDF remediation with trained students; 2) solidify video remediation/captioning; 3) develop the Microsoft Office track; 4) begin engaging faculty on their own responsibility for accessible material; 5) reconvene to decide what is next. Amanda flagged strong interest in replicating SF State's student assistant training model — her specific idea: train IT student workers, many with significant idle time, to do this work (proposal stage, no committed start)."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);

MATCH (mm:MeetingMinutes {title:'Instructional Materials Working Group Meeting'}),
      (df:Person {name:'Daniel Fontaine'})
MERGE (n:Note {name:'im-wg-action-items-aug-2026-mm-7d97f338-9d5c61b8'})
  ON CREATE SET n.unique_id = randomUUID(), n.date_created = date('2026-08-03'), n.include_in_report = true,
                n.content = "Action items, 2026-08-03 SFSU IM working group. Daniel Fontaine: set up the East Bay meeting (demo of Zach's AI remediation platform + broader process conversation, with Andrew and Cristian); lead DPRC staff training for Canvas Studio uploads once permissions are granted; publish PDF and Word remediation documentation on the SFBRN site and share it; collect documentation from Andrew for the ATI report (DesignPLUS training material, student assistant training model); follow up on Anoshua Chaudhuri / 'Segal' for faculty-development evidence. Andrew Roderick: share written DesignPLUS training and rollout documentation; set up a DesignPLUS meeting between his rollout team, Cristian, Daniel, and Amanda; include Daniel and Amanda on accessibility-related meetings going forward per the SFBRN arrangement; set up the Connectivo demo with Amir (Fullerton) and invite Daniel; bring Christina into the video discussion once the captioning-vendor question resolves; compare notes with Humboldt on DesignPLUS. Cristian Alvarado: continue PDF remediation on summer courses (Acrobat-first, Equidox-second); grant DPRC the elevated Canvas Studio permissions. Amanda McGowan: schedule the next half-hour working group sync for the week of August 17 (Cristian unavailable week of the 24th — start of semester)."
MERGE (n)-[:created_by]->(df)
MERGE (mm)-[:has_note]->(n);
