// curate_2026_10_15_procurement_yse_sync_pass2.cypher
//
// Date: 2026-10-15
//
// WHY THIS PASS RAN
// Second pass of the procurement YSE sync across CSU East Bay, SF State and
// Sonoma State (pass 1: curate_2026_10_15_procurement_yse_sync.cypher). The
// re-run comparison after pass 1 left 1.4 with no shared evidence, and status
// levels on 1.4, 1.5, 1.8 and 9.1 that differ by campus for the same shared
// SFBRN practice. Daniel Fontaine directed each change in this file.
//
// WHAT THE RECON FOUND
//   1.4-pro: csueb carries its campus guidance page (About ICT Purchases -
//     VPAT); sfsu and ssu carry nothing. No impact matrix exists anywhere in
//     the graph. SF State's VPAT/ACR Guidances cites an impact page
//     (access.sfsu.edu/ati/procurement/impact), and the CSUEB VPAT Analysis Tool
//     sets an impact level during eREC review. Neither is an SFBRN matrix.
//   Status today: 1.4 Established / Defined / Managed; 1.5 Established /
//     Established / Managed; 1.8 Defined / Managed / Managed; 9.1 Established /
//     Established / Managed (csueb / sfsu / ssu).
//
// SECTIONS
//   1. 1.4: new Process "SFBRN Impact Matrix", evidencing 1.4 at all three campuses
//   2. 1.4: new Plan "Create official SFBRN Impact Matrix", furthering 1.4 at all three
//   3. Status: 1.4, 1.5 and 1.8 to Defined at all three; 9.1 to Established at all three
//
// WHAT THIS RUN DELIBERATELY DOES NOT DO
//   - 1.9 is left as it is. Every campus carries the CSUBuy procedure; the LTI
//     gate (csueb) and Site Improve (ssu) stay campus-specific.
//   - No VPAT guide links. The user chose to leave them.
//   - Goal 5 (5.1 through 5.10) is held for more research.
//   - No ratings on evidence links, no owner on the Process, no
//     accountable_community. Deferred, as in pass 1.
//
// PLAN VISIBILITY (section 2)
//   furthers_yse to each campus's 1.4 YSE puts the Plan on that YSE's evidence.
//   The campus plan dashboard (committees/read.py, _PLANS_FOR_WGP_QUERY) shows
//   a Plan on a campus's working-group card only when is_campus_plan = true and
//   it furthers a YSE at that campus. is_campus_plan = true here, so the Plan
//   shows on the Procurement card at all three campuses. WorkingGroupPlan
//   includes_plan is not read by the app and is not set.
//
// STATUS (section 3)
//   Mirrors assign_status_to_yse in queries/evidence/update.py: disconnect every
//   status_is edge, connect the new level, no other side effects.
//   DOWNGRADES: 1.4 csueb (Established), 1.4 ssu (Managed), 1.5 csueb and sfsu
//   (Established), 1.5 ssu (Managed), 1.8 sfsu and ssu (Managed).
//   UPGRADE: 9.1 ssu (Managed to Established).
//   NO-OPS: 1.4 sfsu, 1.8 csueb (already Defined); 9.1 csueb and sfsu.
//
// Idempotent: nodes MERGE on their unique keys (Process.title, Plan.description)
// with content in ON CREATE; edges MERGE. A second run creates nothing.


// ---------------------------------------------------------------------------
// SECTION 1: Process "SFBRN Impact Matrix". Mirrors add_process (title,
// description) plus the neomodel defaults (unique_id, retired = false).
// ---------------------------------------------------------------------------

MERGE (p:Process {title: "SFBRN Impact Matrix"})
ON CREATE SET p.unique_id = replace(randomUUID(), "-", ""),
              p.retired = false,
              p.description = "The impact matrix SFBRN uses to rate an ICT purchase's accessibility impact. The rating sets the level of Section 508 evaluation that a new procurement or renewal receives at CSU East Bay, SF State and Sonoma State. An official SFBRN version has not been written yet; the plan Create official SFBRN Impact Matrix covers it."
WITH p
UNWIND ["csueb", "sfsu", "ssu"] AS campus
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.4-pro-" + campus})
MERGE (p)-[:is_evidence_for]->(y);


// ---------------------------------------------------------------------------
// SECTION 2: Plan "Create official SFBRN Impact Matrix". Mirrors add_plan:
// name, description, the flag defaults, plan_status, in_academic_year, and
// furthers_yse for each YSE.
// ---------------------------------------------------------------------------

MATCH (ay:AcademicYear {name: "2025-2026"})
MERGE (pl:Plan {description: "Write and publish an official SFBRN Impact Matrix that sets the level of Section 508 evaluation for new ICT procurements and renewals at CSU East Bay, SF State and Sonoma State. Done when the matrix is published and the SFBRN CSUBuy review applies it."})
ON CREATE SET pl.unique_id = replace(randomUUID(), "-", ""),
              pl.name = "Create official SFBRN Impact Matrix",
              pl.plan_status = "Not Started",
              pl.is_key_plan = false,
              pl.is_campus_plan = true,
              pl.abandoned = false
MERGE (pl)-[:in_academic_year]->(ay)
WITH pl
UNWIND ["csueb", "sfsu", "ssu"] AS campus
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-1.4-pro-" + campus})
MERGE (pl)-[:furthers_yse]->(y);


// ---------------------------------------------------------------------------
// SECTION 3: Status. See STATUS above for what moves up and down.
// ---------------------------------------------------------------------------

UNWIND [
  {yid: "2025-2026-1.4-pro-csueb", level: "Defined"},
  {yid: "2025-2026-1.4-pro-sfsu",  level: "Defined"},
  {yid: "2025-2026-1.4-pro-ssu",   level: "Defined"},
  {yid: "2025-2026-1.5-pro-csueb", level: "Defined"},
  {yid: "2025-2026-1.5-pro-sfsu",  level: "Defined"},
  {yid: "2025-2026-1.5-pro-ssu",   level: "Defined"},
  {yid: "2025-2026-1.8-pro-csueb", level: "Defined"},
  {yid: "2025-2026-1.8-pro-sfsu",  level: "Defined"},
  {yid: "2025-2026-1.8-pro-ssu",   level: "Defined"},
  {yid: "2025-2026-9.1-pro-csueb", level: "Established"},
  {yid: "2025-2026-9.1-pro-sfsu",  level: "Established"},
  {yid: "2025-2026-9.1-pro-ssu",   level: "Established"}
] AS row
MATCH (y:YearSuccessEvidence {year_identifier: row.yid})
MATCH (sl:StatusLevel {status_level: row.level})
OPTIONAL MATCH (y)-[old:status_is]->(prev:StatusLevel)
WHERE prev <> sl
DELETE old
MERGE (y)-[:status_is]->(sl);
