// =====================================================================================
// Wire Coded Memo AA-2013-03 into the ATI lineage.
// Run 2026-10-07 by Daniel Fontaine.
//
// WHY
//   AA-2013-03 (January 29, 2013) had no text until today. Its PDF was fetched from
//   calstate.edu; the Internet Archive copy is byte-identical. Source text went onto both
//   Document nodes through neo4j-cli (18,124 chars), and onto the August 13, 2013 online
//   education memo's Document (7,285 chars). Two sentences that principles ground on in the
//   2024 ATI policy already appear in AA-2013-03:
//     Vision: "Technology accessibility is an institution-wide responsibility that requires
//       commitment and involvement from leadership across the enterprise."
//     Background: "California Government Code 11135 applies Section 508 of the 1973
//       Rehabilitation Act, as amended in 1998, to State entities and to the California
//       State University (CSU)."
//   The online education memo repeats the Background sentence.
//
// SECTIONS
//   1. Lineage sentence on the two derives_from edges to the 2024 policy.
//   2. AA-2013-03 supersedes AA-2010-13 and AA-2007-04 ("This coded memo supersedes all
//      previous coded memos."). The 2021 memo already supersedes AA-2013-03.
//
// NOT DONE
//   No derives_from edges to AA-2013-03. Phase 1a moved groundings off the superseded
//   2021 memo onto the 2024 policy: principles ground on the current issuance, and the
//   supersedes chain carries history.
//   AA-2006-41, AA-2007-13, AA-2008-21, AA-2009-19 and AA-2011-21 are named in the memo
//   but are not in the graph, so they get no edges. AA-2015-22 has no text, so whether it
//   supersedes AA-2013-03 was not recorded.
//   The online education memo cites AA-2013-03, but no `references` relationship type
//   exists. It stays unlinked.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_aa_2013_03_lineage.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_aa_2013_03_lineage.cypher --execute
// =====================================================================================


// --- 1. Lineage on the 2024 policy groundings -------------------------------------------
UNWIND [
  {h: "principle:institution-wide-responsibility",
   why: "The policy's Vision says all CSU programs, services, and activities should be accessible to students, staff, faculty, and the general public, across all technology used to deliver academic, student, information technology, and auxiliary services. The first of its three driving principles calls technology accessibility an institution-wide responsibility that requires commitment and involvement from leadership across the enterprise. The same sentence is the first principle in the Vision of Coded Memo AA-2013-03, issued January 29, 2013."},
  {h: "principle:state-law-adopts-the-federal-standard",
   why: "The policy's Background states that the ADA and Section 504 require equal access to programs, services, and activities. It states that Government Code 11135 applies Section 508 to state entities and to the CSU, and that Section 508 was enacted to eliminate barriers in information technology. It names Executive Order 1111 as the CSU's policy statement on accessibility. The 11135 sentence appears in the Background of Coded Memo AA-2013-03, issued January 29, 2013, and in the August 13, 2013 memo on online education. The current text of 11135 does not mention Section 508."}
] AS row
MATCH (p:Principle {handle: row.h})-[r:derives_from]->(:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
SET r.rationale = row.why, r.assessed_date = date("2026-10-07");


// --- 2. AA-2013-03 supersedes the earlier memos in the graph ------------------------------
MATCH (m:Memo {unique_id: "f1de196432c44979909a0bbc325bc34d"})
UNWIND ["61376230cac04ba2b7446b7345aecc4a", "b1cddd79de6644c8858fcc486300f253"] AS old_id
MATCH (o:Memo {unique_id: old_id})
MERGE (m)-[s:supersedes]->(o)
ON CREATE SET s.scope = "full", s.added_date = date("2026-10-07"),
              s.note = "AA-2013-03 Background: \"This coded memo supersedes all previous coded memos.\"";
