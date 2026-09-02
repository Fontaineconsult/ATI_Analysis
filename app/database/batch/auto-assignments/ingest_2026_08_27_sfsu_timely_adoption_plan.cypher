// ============================================================================
// SFSU — Timely adoption of instructional materials: one Plan across 1.1 / 1.2 / 1.6
// Date: 2026-08-27
//
// SOURCE: the message record already in the graph (the 2026-05-05 meeting summary
//   and the 2026-07-31 / 2026-08-04 email thread on 1.6-ins), plus the authored
//   companion guides on 1.2-ins and 1.6-ins. Explicitly NOT sourced from the
//   historical documentation nodes: the 2008 Academic Senate policy is out of
//   date and the policy and its implementation are being rewritten now, so
//   nothing here leans on what the older records assert.
//
// JUDGMENT CALLS
//   * ONE plan, not three. 1.1 (authority), 1.2 (process) and 1.6 (reporting)
//     are one practice blocked on one decision inside Academic Affairs; three
//     plans would be three copies of the same task. furthers_yse therefore
//     reaches all three YSEs at the user's direction, rather than the usual
//     one-or-two.
//   * plan_status 'In Progress' — the BAC recommendation is drafted and approved
//     and the approach to the Provost's Office is underway (S2 committed intent,
//     work already started).
//   * Anchored to the reporting year 2025-2026 and its sfsu-ins working group
//     plan. The 2026-2027 siblings are deliberately left alone pending a
//     separate decision on carrying it forward.
//   * No implementation node is created. Nothing here operates yet, so routing
//     up from Plan would assert a practice that does not exist.
//   * No MeetingMinutes anchor, so no ontology_ingested stamp: the source
//     messages were ingested previously and this file adds only the plan.
// ============================================================================


// ---------------------------------------------------------------------------
// 1. THE PLAN
// ---------------------------------------------------------------------------

MATCH (wgp:WorkingGroupPlan {plan_identifier:'2025-2026-sfsu-ins'}), (ay:AcademicYear {name:'2025-2026'})
MERGE (pl:Plan {name:'SFSU: Establish a campus-owned timely adoption process with a named Academic Affairs owner, a published procedure, and semester performance reporting'})
  ON CREATE SET pl.unique_id = randomUUID(),
                pl.description = "Chris Farmer takes the Bookstore Advisory Committee's approved process to Mona and to Deans' Council so the Provost's Office accepts ownership, with Andrew Roderick supporting. Academic Affairs then names the owning position, issues the memo cascade from the Provost through deans and chairs to faculty each term, publishes the procedure and an adoption calendar that leaves DPRC time to remediate, and replaces the out-of-date 2008 Senate policy with a current instrument. Complete when a named owner has run one full adoption cycle and two semester performance reports built on Follett's adoption analytics have reached campus administration.",
                pl.plan_status = 'In Progress',
                pl.is_key_plan = false, pl.is_campus_plan = false, pl.abandoned = false
MERGE (wgp)-[:includes_plan]->(pl)
MERGE (pl)-[:in_academic_year]->(ay);


// ---------------------------------------------------------------------------
// 2. EVIDENCE WIRING — all three indicators in the timely-adoption family
// ---------------------------------------------------------------------------

// 1.1-ins — "Campus has formally documented ... a process to ensure the timely
// adoption of textbooks and other instructional materials." The plan's policy
// replacement and the named owner are what this indicator asks for.
MATCH (pl:Plan {name:'SFSU: Establish a campus-owned timely adoption process with a named Academic Affairs owner, a published procedure, and semester performance reporting'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.1-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);

// 1.2-ins — "Develop a process ... to achieve compliance with timely adoption."
// The published procedure, the adoption calendar and the memo cascade.
MATCH (pl:Plan {name:'SFSU: Establish a campus-owned timely adoption process with a named Academic Affairs owner, a published procedure, and semester performance reporting'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.2-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);

// 1.6-ins — "Develop a process to distribute timely adoption performance reports
// to campus administration each semester." The two-per-term reporting on
// Follett's adoption analytics.
MATCH (pl:Plan {name:'SFSU: Establish a campus-owned timely adoption process with a named Academic Affairs owner, a published procedure, and semester performance reporting'}),
      (y:YearSuccessEvidence {year_identifier:'2025-2026-1.6-ins-sfsu'})
MERGE (pl)-[:furthers_yse]->(y);
