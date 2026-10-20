// curate_2026_10_15_procurement_yse_sync.cypher
//
// Date: 2026-10-15
//
// WHY THIS PASS RAN
// CSU East Bay, SF State and Sonoma State now share one SFBRN procurement group,
// so the shared procurement implementations should evidence the same 2025-2026
// procurement (-pro) indicators at all three campuses. A recon of the 66 -pro
// YSEs (22 indicators x 3 campuses) found the shared SFBRN implementations wired
// unevenly and goal 8 (the count indicators 8.8, 8.9, 8.10) with no Tracking
// behind it at any campus. Daniel Fontaine directed each change in this file.
//
// WHAT THE RECON FOUND
//   SFBRN CSUBuy IT Accessibility Review Procedure: 1.3, 1.8, 1.9 at all three
//     campuses, and 4.6 at csueb only. CSU East Bay's footprint is the reference.
//   SFBRN TAAP Authoring Process: 4.6 at all three. Already aligned.
//   SFBRN Service Catalog Routing for Accessibility: 1.10 at sfsu only.
//   Administrative Review Process: 9.1 and 9.2 at sfsu only.
//   Plan "SFBRN: Migrate procurement information from the three campus sites to
//     the SFBRN site" already furthers 1.10 at all three campuses. No change.
//   P-card: purchasing is centralized in SFBRN, while each campus still carries
//     its own policy (CSUEB P-card Policy, Purchase Card Internal Policy at SF
//     State, SSU Procurement Policy). The SF State note "Training is in place
//     for all p-card holders" (49739950-913d-43ec-8274-48a23607d168, on
//     5.4-pro-sfsu) cannot be verified. It was already deprecated
//     (depreciated = true, include_in_report = false), so this file leaves it
//     alone and names it in the P-card Concern instead.
//
// SECTIONS
//   1. Shared implementations: align evidence links across the three campuses
//   2. P-card: one Note and one Concern on the six P-card YSEs (1.7, 5.5)
//   3. Goal 8: nine per-campus Trackings (3 measures x 3 campuses), each with
//      one placeholder Metric
//   4. Goal 8: two SF State BuyIT Trackings, each with one placeholder Metric
//   5. Goal 8: set the nine goal-8 YSEs to Established
//   6. Ontology: record the one-Tracking-per-campus convention on the Tracking
//      descriptor
//
// WHAT THIS RUN DELIBERATELY DOES NOT DO
//   - No strength, control, rationale or satisfies on any evidence link. Rating
//     is a later pass, on the user's instruction.
//   - No campus-local procurement guidance is touched. Each campus's guidance
//     page waits on the SFBRN site consolidation Plan.
//   - No owner or accountable_community on the new Trackings. None was named.
//   - No raw_text. Source Text goes through /get-source-text.
//   - Gap-filling on the empty and thin YSEs (step 4 of the recon) is a later pass.
//
// TRACKING PATTERN (sections 3 and 4)
//   Follows the Pope Tech Trackings (create_2026-10-12_pope_tech_scan_metrics_
//   tracking.cypher): one Tracking per campus per measure, titled with the
//   campus prefix, evidencing only its own campus's YSE, with its Metrics on
//   the Tracking through has_metric. SFBRN produces the counts for all three
//   campuses, but each campus keeps its own series. The campus report reads
//   every Metric on an implementation with no campus filter
//   (get_all_by_working_group_campus.py), so a Tracking shared across campuses
//   would print every campus's count on every campus's report.
//   Each Metric is a placeholder: no single_value, include_in_report = false.
//   Set the value and flip include_in_report when the count is known.
//
// STATUS (section 5)
//   Setting status_is mirrors assign_status_to_yse in queries/evidence/update.py,
//   which disconnects every status_is edge and connects the new level. It has no
//   other side effects. Two of the nine YSEs move DOWN: 8.9-pro-sfsu and
//   8.10-pro-sfsu are Managed today. The three ssu YSEs are already Established.
//
// Idempotent: every node is MERGEd on its natural key with content in ON CREATE,
// and every edge is MERGEd. A second run creates nothing.


// ---------------------------------------------------------------------------
// SECTION 1: Shared implementations, aligned across the three campuses
// ---------------------------------------------------------------------------

// 1a. SFBRN CSUBuy IT Accessibility Review Procedure: CSU East Bay's footprint
//     (1.3, 1.8, 1.9, 4.6). sfsu and ssu lack 4.6.
UNWIND ["2025-2026-4.6-pro-sfsu", "2025-2026-4.6-pro-ssu"] AS yid
MATCH (i:Procedure {unique_id: "f8e96ec87cb24b4cad8667483f7a5564"})
MATCH (y:YearSuccessEvidence {year_identifier: yid})
MERGE (i)-[:is_evidence_for]->(y);

// 1b. SFBRN Service Catalog Routing for Accessibility: SF State's footprint (1.10).
UNWIND ["2025-2026-1.10-pro-csueb", "2025-2026-1.10-pro-ssu"] AS yid
MATCH (i:Process {unique_id: "4cf87109182242358b116283dd2fb1b7"})
MATCH (y:YearSuccessEvidence {year_identifier: yid})
MERGE (i)-[:is_evidence_for]->(y);

// 1c. Administrative Review Process: SF State's footprint (9.1, 9.2).
UNWIND ["2025-2026-9.1-pro-csueb", "2025-2026-9.2-pro-csueb",
        "2025-2026-9.1-pro-ssu",   "2025-2026-9.2-pro-ssu"] AS yid
MATCH (i:Process {unique_id: "e8eb9491ce4c4221b55ccbfdf481ee42"})
MATCH (y:YearSuccessEvidence {year_identifier: yid})
MERGE (i)-[:is_evidence_for]->(y);

// 1d. SFBRN TAAP Authoring Process: already on 4.6 at all three. Nothing to do.


// ---------------------------------------------------------------------------
// SECTION 2: P-card. One Note and one Concern, each on the six P-card YSEs:
// 1.7-pro (P-card purchase evaluation) and 5.5-pro (P-card holder training).
// ---------------------------------------------------------------------------

MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (n:Note {name: "P-card centralized in SFBRN (2026-10-15)"})
ON CREATE SET n.unique_id = replace(randomUUID(), "-", ""),
              n.content = "P-CARD is centralized in SFBRN. These Policies will need review.",
              n.date_created = date("2026-10-15"),
              n.include_in_report = true,
              n.depreciated = false
MERGE (n)-[:created_by]->(daniel);

UNWIND ["2025-2026-1.7-pro-csueb", "2025-2026-1.7-pro-sfsu", "2025-2026-1.7-pro-ssu",
        "2025-2026-5.5-pro-csueb", "2025-2026-5.5-pro-sfsu", "2025-2026-5.5-pro-ssu"] AS yid
MATCH (y:YearSuccessEvidence {year_identifier: yid})
MATCH (n:Note {name: "P-card centralized in SFBRN (2026-10-15)"})
MERGE (y)-[:has_note]->(n);

MATCH (daniel:Person {unique_id: "a1d223af-c7aa-466b-bf54-47f0a199696d"})
MERGE (c:Concern {concern: "The P-card policy needs a full review now that P-card purchasing is centralized in SFBRN"})
ON CREATE SET c.unique_id = replace(randomUUID(), "-", ""),
              c.status = "open",
              c.date_raised = date("2026-10-15"),
              c.detail = "P-card purchasing is centralized in SFBRN, but each campus still evidences its P-card indicators with its own policy: CSUEB P-card Policy at CSU East Bay, Purchase Card Internal Policy at SF State, and SSU Procurement Policy at Sonoma State. The training side cannot be verified either: an SF State note claiming that training is in place for all P-card holders, with samples in Box, was deprecated because nobody can confirm it. Daniel Fontaine raised it on 2026-10-15 during the procurement YSE sync. No reviewer, target policy or date is named yet, so it is recorded as a concern rather than a plan."
MERGE (c)-[:raised_by]->(daniel);

UNWIND ["2025-2026-1.7-pro-csueb", "2025-2026-1.7-pro-sfsu", "2025-2026-1.7-pro-ssu",
        "2025-2026-5.5-pro-csueb", "2025-2026-5.5-pro-sfsu", "2025-2026-5.5-pro-ssu"] AS yid
MATCH (y:YearSuccessEvidence {year_identifier: yid})
MATCH (c:Concern {concern: "The P-card policy needs a full review now that P-card purchasing is centralized in SFBRN"})
MERGE (y)-[:has_concern]->(c);


// ---------------------------------------------------------------------------
// SECTION 3: Goal 8. Nine per-campus Trackings, three measures at three
// campuses, each evidencing its own campus's YSE and holding one placeholder
// Metric. See TRACKING PATTERN above.
// Tracking: mirrors add_tracking plus the neomodel defaults (unique_id,
// retired = false). MERGE on title, the Tracking unique index.
// Metric: MERGE on composite_key, the Metric unique index. The has_metric edge
// carries the year curation the app writes (DocumentedByRel).
// ---------------------------------------------------------------------------

UNWIND [
  {measure: "Total CSUBuy ICT Purchases", slug: "csubuy_ict_purchases", key: "8.8-pro",
   what: "ICT purchases made through CSUBuy",
   tail: "SFBRN routes ICT purchases for CSU East Bay, SF State and Sonoma State through CSUBuy, and keeps a separate count for each campus."},
  {measure: "Total CSUBuy ICT Reviews", slug: "csubuy_ict_reviews", key: "8.9-pro",
   what: "ICT accessibility reviews completed through CSUBuy",
   tail: "The reviews follow the SFBRN CSUBuy IT Accessibility Review Procedure, and SFBRN keeps a separate count for each campus."},
  {measure: "Total SFBRN TAAPs", slug: "sfbrn_taaps", key: "8.10-pro",
   what: "Temporary Alternate Access Plans (TAAPs) completed through SFBRN",
   tail: "The plans are written under the SFBRN TAAP Authoring Process, and SFBRN keeps a separate count for each campus."}
] AS row
UNWIND [
  {abbr: "csueb", prefix: "CSUEB", name: "CSU East Bay"},
  {abbr: "sfsu",  prefix: "SFSU",  name: "SF State"},
  {abbr: "ssu",   prefix: "SSU",   name: "Sonoma State"}
] AS campus
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-" + row.key + "-" + campus.abbr})
MATCH (ay:AcademicYear {name: "2025-2026"})
MERGE (t:Tracking {title: campus.prefix + " " + row.measure})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", ""),
              t.retired = false,
              t.description = "The yearly count of " + row.what + " at " + campus.name + ", one Metric per academic year. " + row.tail
MERGE (t)-[:is_evidence_for]->(y)
MERGE (m:Metric {composite_key: "2025-2026_" + row.slug + "_" + campus.abbr})
ON CREATE SET m.unique_id = replace(randomUUID(), "-", ""),
              m.name = row.measure + " (" + campus.abbr + ")",
              m.metric_type = "tabular",
              m.description = "The number of " + row.what + " at " + campus.name + " in 2025-2026. The value has not been entered yet.",
              m.include_in_report = false
MERGE (m)-[:measured_in_year]->(ay)
MERGE (t)-[r:has_metric]->(m)
ON CREATE SET r.included_in_years = ["2025-2026"],
              r.excluded_from_years = [],
              r.added_date = date("2026-10-15"),
              r.modified_date = date("2026-10-15");


// ---------------------------------------------------------------------------
// SECTION 4: Goal 8. SF State's BuyIT Trackings, same pattern. BuyIT is SF
// State's purchase approval system, and every P-card ICT purchase there needs
// a BuyIT approval. An existing note on 1.7-pro-sfsu says BuyIT will be
// retired and replaced by CSUBuy.
// ---------------------------------------------------------------------------

UNWIND [
  {title: "SFSU BuyIT (Purchases)", slug: "buyit_purchases", key: "8.8-pro",
   label: "BuyIT ICT Purchases", what: "ICT purchases approved through BuyIT"},
  {title: "SFSU BuyIT (Reviews)",   slug: "buyit_reviews",   key: "8.9-pro",
   label: "BuyIT ICT Reviews",   what: "ICT accessibility reviews completed through BuyIT"}
] AS row
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-" + row.key + "-sfsu"})
MATCH (ay:AcademicYear {name: "2025-2026"})
MERGE (t:Tracking {title: row.title})
ON CREATE SET t.unique_id = replace(randomUUID(), "-", ""),
              t.retired = false,
              t.description = "The yearly count of " + row.what + ", SF State's purchase approval system, one Metric per academic year."
MERGE (t)-[:is_evidence_for]->(y)
MERGE (m:Metric {composite_key: "2025-2026_" + row.slug + "_sfsu"})
ON CREATE SET m.unique_id = replace(randomUUID(), "-", ""),
              m.name = row.label + " (sfsu)",
              m.metric_type = "tabular",
              m.description = "The number of " + row.what + " at SF State in 2025-2026. The value has not been entered yet.",
              m.include_in_report = false
MERGE (m)-[:measured_in_year]->(ay)
MERGE (t)-[r:has_metric]->(m)
ON CREATE SET r.included_in_years = ["2025-2026"],
              r.excluded_from_years = [],
              r.added_date = date("2026-10-15"),
              r.modified_date = date("2026-10-15");


// ---------------------------------------------------------------------------
// SECTION 5: Goal 8. All nine goal-8 YSEs to Established.
// Mirrors assign_status_to_yse. DOWNGRADES: 8.9-pro-sfsu and 8.10-pro-sfsu
// (Managed today). No-ops: the three ssu YSEs (already Established).
// ---------------------------------------------------------------------------

UNWIND ["2025-2026-8.8-pro-csueb",  "2025-2026-8.8-pro-sfsu",  "2025-2026-8.8-pro-ssu",
        "2025-2026-8.9-pro-csueb",  "2025-2026-8.9-pro-sfsu",  "2025-2026-8.9-pro-ssu",
        "2025-2026-8.10-pro-csueb", "2025-2026-8.10-pro-sfsu", "2025-2026-8.10-pro-ssu"] AS yid
MATCH (y:YearSuccessEvidence {year_identifier: yid})
MATCH (sl:StatusLevel {status_level: "Established"})
OPTIONAL MATCH (y)-[old:status_is]->(prev:StatusLevel)
WHERE prev <> sl
DELETE old
MERGE (y)-[:status_is]->(sl);


// ---------------------------------------------------------------------------
// SECTION 6: Ontology. Record the one-Tracking-per-campus convention on the
// Tracking descriptor. Mirrors update_descriptor in
// queries/descriptors/update.py: set the edited fields, recompute search_text
// with compose_search_text (title, both descriptions, target_label,
// target_field, target_value; each trimmed and lowercased, nulls and blanks
// skipped, joined by one space), and stamp last_updated.
// Not idempotent by content check: a re-run rewrites the same text and
// restamps last_updated, which changes nothing a reader sees.
// ---------------------------------------------------------------------------

MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Tracking"})
SET d.description_short = "One campus's running record of one measure over time, held as Metrics on the Tracking. A measure kept at several campuses gets one Tracking per campus.",
    d.description_full = "A Tracking is the running record of one measure at one campus over time: the number of ICT purchases, reviews or TAAPs in a year, or a dated series of scan snapshots. The values live in Metrics. Each Metric hangs on the Tracking through has_metric, names its academic year through measured_in_year, and the has_metric edge lists the years it is reported in (included_in_years). The Tracking reaches the indicator it informs through is_evidence_for to that campus's YearSuccessEvidence.\n\nA Tracking belongs to one campus. When the same measure is kept at several campuses, each campus gets its own Tracking, titled with the campus prefix, even when one shared unit such as SFBRN produces every count. CSUEB Pope Tech Scan Metrics, SFSU Pope Tech Scan Metrics and SSU Pope Tech Scan Metrics are the reference example. The reason is mechanical. The campus report reads every Metric on an implementation without a campus filter, so one Tracking carrying three campuses' Metrics would print all three counts on every campus's report.\n\nTrackings take Metrics. Holding them is what a Tracking is for, so a count kept as a running record goes on the Tracking through has_metric. A Metric can also be attached to a YearSuccessEvidence directly."
WITH d
WITH d, [p IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value]
         WHERE p IS NOT NULL AND trim(p) <> "" | toLower(trim(p))] AS parts
SET d.search_text = reduce(s = "", p IN parts | CASE WHEN s = "" THEN p ELSE s + " " + p END),
    d.last_updated = date("2026-10-15");
