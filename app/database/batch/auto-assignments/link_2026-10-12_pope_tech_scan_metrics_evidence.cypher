// Each campus's Pope Tech Scan Metrics Tracking as evidence for its 2025-2026
// 1.4-web YSE: "Established a process to perform regularly scheduled
// accessibility audits using established criteria to identify campus-affiliated
// websites and applications (web or mobile) that need remediation."
//
// Why 1.4-web: the Tracking holds the results of the automated WAVE audits.
// 1.5-web ("Conducted automated accessibility evaluations") fits more closely
// but is retired: its only YSE is 2020-2021-1.5-web-sfsu, and no campus tracks
// it in 2025-2026. 3.7-web needs manual testing combined with scanning, which
// the metrics do not show.
//
// strength 2 (Partial): the snapshots show audits run with established
// criteria and what they found. They do not show the schedule (one snapshot so
// far), which sites need remediation, or remediation recommendations.
// control 'external': SFBRN runs the scans for all three campuses, matching
// "SFBRN Pope Tech Web Monitoring" on 2025-2026-1.4-web-sfsu.
// satisfies left empty: the Output requirement (evidence:1.4-web:established:4)
// asks for remediation recommendations, which the snapshots do not carry.
//
// Mirrors assign_implementation_to_year_success_indicator (strength on connect),
// set_evidence_control and set_evidence_rationale. Idempotent: MERGE on the edge;
// an existing edge keeps its values.

UNWIND [
  {tracking: 'SFSU Pope Tech Scan Metrics',  yse: '2025-2026-1.4-web-sfsu',  campus: "San Francisco State's"},
  {tracking: 'SSU Pope Tech Scan Metrics',   yse: '2025-2026-1.4-web-ssu',   campus: "Sonoma State's"},
  {tracking: 'CSUEB Pope Tech Scan Metrics', yse: '2025-2026-1.4-web-csueb', campus: "CSU East Bay's"}
] AS row
MATCH (t:Tracking {title: row.tracking})
MATCH (y:YearSuccessEvidence {year_identifier: row.yse})
MERGE (t)-[e:is_evidence_for]->(y)
  ON CREATE SET
    e.strength = 2,
    e.control = 'external',
    e.satisfies = [],
    e.rationale =
      'This is the record of the automated WAVE audits Pope Tech runs on ' + row.campus +
      ' public websites for SFBRN. Each snapshot shows the criteria applied and how many ' +
      'errors of each kind the audit found. It shows that audits run and what they find. ' +
      'It does not show the audit schedule, which sites need remediation, or remediation ' +
      'recommendations.';
