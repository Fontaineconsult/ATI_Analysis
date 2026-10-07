// =====================================================================================
// Public source for the 2021 ATI memorandum and the 2024 ATI policy.
// Run 2026-10-06 by Daniel Fontaine.
//
// WHY
//   The 2021 ATI coded memorandum (Memo 4dfefd81) had one source: a private SharePoint
//   link to a Teams chat file, which no one else can open. The 2024 ATI policy (Directive
//   ae8c836e) had no source carrying text. CSU Fullerton publishes the memo as
//   "FEW-to-Presidents-ATI-compliance.pdf", the same file CSU PolicyStat 16173563 lists as
//   the 2024 policy's attachment ("FEW to Presidents ATI compliance.pdf").
//
// VERIFIED BEFORE THIS FILE
//   Fetched 2026-10-06: 7 pages, PDF title "ATI Compliance", created 2021-03-08. Its
//   extracted text is word-for-word identical to the memo node's raw_text (2,589 words
//   each, zero differences).
//
// WHAT THIS DOES
//   Creates the Document (MERGE on uri_path) and links it is_sourced_from from the memo
//   and the policy. The SharePoint source stays. raw_text is written separately through
//   neo4j-cli with raw_text_captured, never in a batch file.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_ati_memo_public_source.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_ati_memo_public_source.cypher --execute
// =====================================================================================

MERGE (d:Document {uri_path: "https://www.fullerton.edu/ati/_resources/pdfs/FEW-to-Presidents-ATI-compliance.pdf"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.name = "Accessible Technology Initiative (ATI): memorandum to CSU Presidents, March 8, 2021 (FEW to Presidents ATI compliance)",
              d.description = "Public copy, hosted by CSU Fullerton, of Interim EVC Fred E. Wood's 2021-03-08 ATI memorandum to CSU Presidents. It is the attachment on CSU PolicyStat 16173563, the 2024 ATI policy.",
              d.include_in_report = true, d.depreciated = false,
              d.is_milestone_and_measures_documentation = false,
              d.is_administrative_review_documentation = false;

MATCH (d:Document {uri_path: "https://www.fullerton.edu/ati/_resources/pdfs/FEW-to-Presidents-ATI-compliance.pdf"})
MATCH (g) WHERE g.unique_id IN ["4dfefd8113e446dfae4e61acfba60223", "ae8c836ef5354e18afdedf905935ada7"]
MERGE (g)-[r:is_sourced_from]->(d)
ON CREATE SET r.added_date = date("2026-10-06");
