// =====================================================================================
// The 2024-08-26 memorandum on the DOJ Title II rule and campus responsibilities.
// Run 2026-10-06 by Daniel Fontaine.
//
// WHY
//   Christina Passmore cited it as one of three CSU anchor documents (with the 2013 and
//   2021 ATI memos). A search of titles, names, URLs, descriptions, file paths and raw
//   text found no node for it. It is the bridge between the ATI and Title II: it moved the
//   ATI into the Division of Information Technology and asked presidents to confirm an
//   ATI Coordinator distinct from the Executive Sponsor.
//
// SOURCE (fetched 2026-10-06)
//   https://content-calpoly-edu.s3.amazonaws.com/canvassupport/1/documents/SR-Presidents%20ADA-Accessible%20Technology%20Initiative%2008-26-24.pdf
//   2 pages, created 2024-08-29. From Steve Relyea (EVC and CFO) to CSU Presidents, dated
//   August 26, 2024. Subject: "Department of Justice Title II ADA Ruling and Campus
//   Responsibilities". Text extracted with pypdf (4,266 chars), written separately
//   through neo4j-cli to the memo node and this Document with raw_text_captured.
//
// NOT DONE, AND WHY
//   - No edge to the 2024 Title II rule, the 2024 ATI policy, or the 2021 memo. The Memo
//     schema allows informs, drives, is_sourced_from, is_documented_by and supersedes; none
//     means "references", and the memo supersedes nothing (it asks presidents to review
//     the 2021 memo). A references relationship type is a schema decision.
//   - No principle groundings yet. Candidates are in the run report.
//   - The memo's April 24, 2026 deadline is historical; DOJ's 2026 interim final rule moved
//     it to April 26, 2027. Recorded in the description, not changed in the text.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_memo_2024_title_ii_campus_responsibilities.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_memo_2024_title_ii_campus_responsibilities.cypher --execute
// =====================================================================================

MERGE (m:Memo {title: "CSU Memorandum: Department of Justice Title II ADA Ruling and Campus Responsibilities (2024)"})
ON CREATE SET m.unique_id = replace(randomUUID(), "-", ""),
              m.authored_date = date("2024-08-26"),
              m.description = "Memorandum from Steve Relyea, Executive Vice Chancellor and Chief Financial Officer, to CSU Presidents. It states that the DOJ's 2024 Title II rule applies to the CSU, sets campus compliance for websites, mobile apps, online courses and digital content, and announces the ATI's reorganization within the Division of Information Technology. It asks presidents to reaffirm the ATI, confirm an ATI Coordinator distinct from the Executive Sponsor, and assign responsibility for remediation in the LMS and web CMS. Its April 24, 2026 deadline was later extended by DOJ to April 26, 2027.";

MERGE (d:Document {uri_path: "https://content-calpoly-edu.s3.amazonaws.com/canvassupport/1/documents/SR-Presidents%20ADA-Accessible%20Technology%20Initiative%2008-26-24.pdf"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""),
              d.name = "Presidents ADA - ATI Ruling, August 26, 2024 (SR-Presidents ADA-Accessible Technology Initiative 08-26-24)",
              d.description = "Copy of the 2024-08-26 Relyea memorandum hosted on Cal Poly's Canvas support site.",
              d.include_in_report = true, d.depreciated = false,
              d.is_milestone_and_measures_documentation = false,
              d.is_administrative_review_documentation = false
WITH d
MATCH (m:Memo {title: "CSU Memorandum: Department of Justice Title II ADA Ruling and Campus Responsibilities (2024)"})
MERGE (m)-[r:is_sourced_from]->(d)
ON CREATE SET r.added_date = date("2026-10-06");
