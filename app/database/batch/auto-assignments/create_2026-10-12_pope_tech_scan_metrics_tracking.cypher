// Three Tracking implementations, one per campus, that will hold the Pope Tech
// scan snapshot Metrics written by app/services/pope_tech_integration.
//
// Approved 2026-10-12. Owner Daniel Fontaine for all three: the series comes
// from the scans SFBRN runs (see "SFBRN Pope Tech Web Monitoring").
//
// Mirrors add_tracking (title, description) plus what the neomodel class sets
// on save: unique_id in the app's format and retired = false.
// Idempotent: MERGE on title, the Tracking unique index.
// Deliberately not set here: is_evidence_for (wired once Metrics exist) and
// accountable_community (no community answers for these numbers).

UNWIND [
  {title: 'SFSU Pope Tech Scan Metrics', campus_name: "San Francisco State's"},
  {title: 'SSU Pope Tech Scan Metrics',  campus_name: "Sonoma State's"},
  {title: 'CSUEB Pope Tech Scan Metrics', campus_name: "CSU East Bay's"}
] AS row
MERGE (t:Tracking {title: row.title})
  ON CREATE SET
    t.unique_id = replace(randomUUID(), '-', ''),
    t.retired = false,
    t.description =
      'A dated series of Pope Tech WAVE scan snapshots of ' + row.campus_name +
      ' public websites, one Metric per scan date. Each Metric holds pages scanned, ' +
      'errors by WAVE category, and alerts. The ATI app\'s Pope Tech service pulls ' +
      'the snapshots from the scans SFBRN runs.'
WITH t
MATCH (p:Person {unique_id: 'a1d223af-c7aa-466b-bf54-47f0a199696d'})
MERGE (t)-[:owned_by]->(p);
