// =====================================================================================
// Governance pass, Phase 1a: duplicate and mislabelled instruments.
// Run 2026-10-06 by Daniel Fontaine. Resolves backlog decisions 1, 3 and 4
// (app/database/ontology/graph-work-backlog.md) plus the Gov Code 11135 twin.
// User decision: consolidate onto one keeper per instrument; delete no nodes.
//
// WHAT THE SOURCES SHOWED (each checked before this file was written)
//   ATI. Not three copies of one thing. Two instruments and one duplicate:
//     - Directive ae8c836e is sourced from CSU PolicyStat 16173563, the "Accessible
//       Technology Initiative Policy": effective 2024-07-09, approved by EVC Steven Relyea,
//       owner Leon McNaught (Dir, Digital Accessibility and Equity), area Business and
//       Finance, codes AA-2006-41 through AA-2015-22, next review 2025-07-09. Its text is
//       the 2021 memo's text issued as policy. This is the CURRENT instrument.
//     - Memo 4dfefd81 is the 2021-03-08 ATI coded memorandum (Interim EVC Fred E. Wood),
//       which "supersedes all previous memos". The 2024 policy carries it forward.
//     - ExternalPolicy 7eed9794 ("CSU Systemwide ATI Policy", ati.calstate.edu) is the
//       2024 policy again. Duplicate. Two of its three sources were misfiled: the SJSU
//       PD 2007-02 PDF (already on the SJSU and EO 926 nodes) and the AA-2013-03 PDF
//       (belongs on the AA-2013-03 memo node).
//   EO 1111. Not a duplicate, a mislabel. Directive e6f402d1, titled "Executive Order
//     1111", holds the text of the "CSU Policy for Provision of Accommodations and Support
//     Services to Students with Disabilities" (PolicyStat 14568219), which refers to "the
//     interactive process as outlined in Executive Order 1111". Directive ae342354 is
//     EO 1111 itself and stays separate. Its source_institution held "6/5/2024".
//   Section 508. Law df2cce7f duplicates Law 2d9ef551 (backlog recommends keeping 2d9ef551,
//     which carries the principle edges).
//   Gov Code 11135. Law 679451e9 ("ARTICLE 9.5. Discrimination [11135 - 11139]", no edges)
//     duplicates Law 849abdeb.
//
// SECTIONS
//   1. duplicate_of: a new relationship type, with its UniversalDescriptor.
//   2. ATI: retitle and date the 2024 policy and the 2021 memo; policy supersedes memo;
//      move principle groundings and goal informs edges onto the 2024 policy; fold the
//      ExternalPolicy duplicate in and re-home its misfiled sources.
//   3. EO 1111 mislabel: retitle e6f402d1 to the student accommodations policy.
//   4. Section 508 twin into its keeper.
//   5. Gov Code 11135 twin marked.
//
// WHAT THIS FILE DELIBERATELY DOES NOT DO
//   - Delete any node. Twins stay, marked duplicate_of, so old ids still resolve.
//   - Fetch source text. EO 1111 (ae342354), the 2024 ATI policy's PolicyStat page and
//     the other gaps are Phase 1b, written through neo4j-cli with raw_text_captured.
//   - Fix e6f402d1's last_updated (2029-06-04). It is wrong, but the right value is not
//     in hand. Flagged in the report.
//   - Change derives_from edge properties (grounding_kind, provision, quote). Phase 3.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase1a_consolidation.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_governance_phase1a_consolidation.cypher --execute
// =====================================================================================


// --- 1. duplicate_of ------------------------------------------------------------------
MERGE (d:UniversalDescriptor {descriptor_handle: "rel_type:duplicate_of"})
ON CREATE SET d.unique_id = replace(randomUUID(), "-", ""), d.descriptor_kind = "rel_type",
              d.target_field = "duplicate_of", d.title = "Duplicate Of",
              d.description_short = "Marks a governance node as a duplicate of the keeper that represents the same instrument. Edges live on the keeper; the duplicate stays so its id still resolves.",
              d.search_text = "duplicate of marks a governance node as a duplicate of the keeper that represents the same instrument duplicate_of",
              d.include_in_report = false, d.last_updated = date("2026-10-06");


// --- 2. ATI -------------------------------------------------------------------------
MATCH (p:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
SET p.title = "CSU Accessible Technology Initiative Policy (2024)",
    p.effective_date = date("2024-07-09"),
    p.source_institution = "California State University Office of the Chancellor",
    p.description = "Systemwide CSU policy on the Accessible Technology Initiative, PolicyStat 16173563, effective 2024-07-09 under Business and Finance. It carries forward the 2021 ATI coded memorandum: the ATI's vision and principles, the capability maturity strategy, the web, procurement and instructional materials goals, campus responsibilities, and annual reporting.";

MATCH (m:Memo {unique_id: "4dfefd8113e446dfae4e61acfba60223"})
SET m.title = "CSU Coded Memorandum: Accessible Technology Initiative (2021)";

MATCH (p:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
MATCH (m:Memo {unique_id: "4dfefd8113e446dfae4e61acfba60223"})
MERGE (p)-[s:supersedes]->(m)
ON CREATE SET s.scope = "full", s.added_date = date("2026-10-06"),
              s.note = "The 2024 policy (PolicyStat 16173563) issues the 2021 memo's text as systemwide policy. The memo is the prior issuance.";

// Principles grounded in the 2021 memo now ground in the 2024 policy. Edges carry no
// properties yet (checked), so nothing is lost in the move.
MATCH (pr:Principle)-[r:derives_from]->(m:Memo {unique_id: "4dfefd8113e446dfae4e61acfba60223"})
MATCH (p:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
MERGE (pr)-[:derives_from]->(p)
DELETE r;

// The ATI goals are defined by the current policy.
MATCH (m:Memo {unique_id: "4dfefd8113e446dfae4e61acfba60223"})-[r:informs]->(g:Goal)
MATCH (p:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
MERGE (p)-[:informs]->(g)
DELETE r;

// ExternalPolicy duplicate: ati.calstate.edu moves to the policy; misfiled sources re-homed.
MATCH (x:ExternalPolicy {unique_id: "7eed9794f1284786b08fbc43c0f5077b"})-[r:is_sourced_from]->(w:Webpage {unique_id: "d168ef47974646729d35efa913155242"})
MATCH (p:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
MERGE (p)-[n:is_sourced_from]->(w)
ON CREATE SET n.added_date = r.added_date
DELETE r;

MATCH (x:ExternalPolicy {unique_id: "7eed9794f1284786b08fbc43c0f5077b"})-[r:is_sourced_from]->(doc:Document {unique_id: "99b8079d77ff43c69b985f436e7abff1"})
MATCH (aa:Memo {unique_id: "f1de196432c44979909a0bbc325bc34d"})
MERGE (aa)-[n:is_sourced_from]->(doc)
ON CREATE SET n.added_date = r.added_date
DELETE r;

MATCH (x:ExternalPolicy {unique_id: "7eed9794f1284786b08fbc43c0f5077b"})-[r:is_sourced_from]->(:Document {unique_id: "1abb270dfe694e0b9aa7481ad1f3ff75"})
DELETE r;

MATCH (x:ExternalPolicy {unique_id: "7eed9794f1284786b08fbc43c0f5077b"})
MATCH (p:Directive {unique_id: "ae8c836ef5354e18afdedf905935ada7"})
MERGE (x)-[d:duplicate_of]->(p)
ON CREATE SET d.added_date = date("2026-10-06"),
              d.note = "ati.calstate.edu program page for the same instrument as PolicyStat 16173563.";


// --- 3. EO 1111 mislabel ---------------------------------------------------------------
MATCH (e:Directive {unique_id: "e6f402d1454048baa0774281e82e64d7"})
SET e.title = "CSU Policy for Provision of Accommodations and Support Services to Students with Disabilities",
    e.source_institution = "California State University Office of the Chancellor";


// --- 4. Section 508 -------------------------------------------------------------------
MATCH (t:Law {unique_id: "df2cce7f7b664737b408c4e4250d893d"})-[r:is_sourced_from]->(w:Webpage)
MATCH (k:Law {unique_id: "2d9ef5513cca4b4a958c1f3e6a84aac6"})
MERGE (k)-[n:is_sourced_from]->(w)
ON CREATE SET n.added_date = r.added_date
DELETE r;

MATCH (t:Law {unique_id: "df2cce7f7b664737b408c4e4250d893d"})
MATCH (k:Law {unique_id: "2d9ef5513cca4b4a958c1f3e6a84aac6"})
MERGE (t)-[d:duplicate_of]->(k)
ON CREATE SET d.added_date = date("2026-10-06"), d.note = "Same statute, 29 U.S.C. 794d.";


// --- 5. Gov Code 11135 ----------------------------------------------------------------
MATCH (t:Law {unique_id: "679451e91ba84b669c2f883eb31c9bc6"})
MATCH (k:Law {unique_id: "849abdeb538443e8be1e93e3b280d336"})
MERGE (t)-[d:duplicate_of]->(k)
ON CREATE SET d.added_date = date("2026-10-06"),
              d.note = "Same statute. Section 11135 sits in Article 9.5 (11135-11139) of the Government Code.";
