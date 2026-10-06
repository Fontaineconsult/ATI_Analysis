// =====================================================================================
// SF State web content editor training: evidence, documentation, stake and description.
// /implementation-rectify, YSE mode, run 2026-10-06 by Daniel Fontaine.
// Seed: Guidance "SF State Marcomm Training for Web Content Editors"
//       (62818e2d4cf24a719a5ecf3f0b9a33e4), wired to 2025-2026-5.2-web-sfsu earlier today
//       through neo4j-cli (control internal, rationale set, strength left unrated).
//
// WHY THIS PASS RAN
//   The seed was evidence for nothing until today. Its source text (Accessibility.docx,
//   captured 2026-10-02) is MarComm's Drupal 11 accessibility training for content editors.
//   It names the training as the gate to a Pope Tech account, which is the campus monitoring
//   process. That reaches past 5.2-web into the training indicators under the same goal.
//
// WHAT THE SEARCHES FOUND
//   Cross-campus peer: no campus wires anything else to 5.2-web in 2025-2026. Empty.
//   Sibling indicators (goal 5, web, sfsu): 5.5-web asks for a training process for web
//     content contributors including Section 508 standards and the campus monitoring
//     process. The seed is that process for SF State content editors. 5.6-web (documents)
//     and 5.7-web (audio and video) are each one section of the seed. 5.1-web and 5.14-web
//     carry no evidence at all.
//   Subject match: ten SFSU implementations. One orphan (Accessible Document Training).
//   Documentation: MarComm's live page marcomm.sfsu.edu/brand/guidelines/web holds an older,
//     shorter version of the same guidance (no Pope Tech, no SFBRN, no Drupal 11, links the
//     optional CSU WebAIM training). It sits in the graph under "General Guidance For Web
//     Content Creation that Includes Accessibility" and not under the seed.
//
// SECTIONS
//   1. Seed evidence: rate the 5.2-web link; add 5.5-web, 5.6-web, 5.7-web.
//   2. Seed documentation: cross-link MarComm's live web guidelines page.
//   3. Marketing & Communications stake in 5.2-web.
//   4. Accountable community on General Guidance For Web Content Creation.
//   5. Seed description rewritten from its source text.
//   6. Orphan: Accessible Document Training onto 5.6-web, documentation kept current.
//
// WHAT THIS FILE DELIBERATELY DOES NOT DO
//   - Unwire retired implementations. Four retired nodes (Social Media Accessibility Guides,
//     SF State Web Accessibility Process, Scheduled Web Monitoring Process, General Guidance
//     on Document Accessibility) still evidence 2025-2026 goal-5 YSEs, including 5.2-web.
//     Removing an evidence edge is a decision about what the year claims, so it is reported
//     for the user, not done here.
//   - Assign a community to SFBRN Pope Tech Training or Guidance for Accessible Marketing
//     Materials. The first is owned by a member of four communities, none plainly the
//     practice; the second has no owner and no unit named. Undecidable; reported.
//   - Fill Source Text. Six pages in this cluster have none. raw_text never goes in a batch
//     file; /get-source-text owns that write.
//   - Touch status_is. Status moves only through admin review.
//   - Wire 5.1-web or 5.14-web. Considered and rejected: content editors are not web or
//     application developers (5.1), and a one-time onboarding training is not ongoing
//     professional development (5.14).
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_sfsu_web_content_training.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_06_sfsu_web_content_training.cypher --execute
// =====================================================================================


// --- 1. Seed evidence ----------------------------------------------------------------
// 5.2-web, existing link: Partial (2). MarComm is the named body and Alexis Cabrera the
// named owner, and the source text makes the training required. No assignment document
// (a charge, a policy, a position description) is in hand, so the authority half of
// "assigned authority and responsibility" is attested by practice, not by record.
MATCH (g:Guidance {unique_id: "62818e2d4cf24a719a5ecf3f0b9a33e4"})-[e:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: "2025-2026-5.2-web-sfsu"})
SET e.strength = 2;

// 5.5-web: Full (3). A training process for web content contributors that covers the
// accessibility standards and hands the editor into Pope Tech, the campus monitoring process.
MATCH (g:Guidance {unique_id: "62818e2d4cf24a719a5ecf3f0b9a33e4"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.5-web-sfsu"})
MERGE (g)-[e:is_evidence_for]->(y)
ON CREATE SET e.strength = 3, e.control = "internal",
              e.rationale = "MarComm's required training for SF State web content editors. It covers the accessibility standards for Drupal content and grants a Pope Tech account, the campus monitoring process.";

// 5.6-web: Indirect (1). One section covers accessible documents, PDF monitoring and Equidox.
MATCH (g:Guidance {unique_id: "62818e2d4cf24a719a5ecf3f0b9a33e4"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.6-web-sfsu"})
MERGE (g)-[e:is_evidence_for]->(y)
ON CREATE SET e.strength = 1, e.control = "internal",
              e.rationale = "One section of the editor training covers accessible documents, SFBRN PDF monitoring and Equidox remediation. It is not a documents training in its own right.";

// 5.7-web: Indirect (1). One section covers captions, transcripts and audio description.
MATCH (g:Guidance {unique_id: "62818e2d4cf24a719a5ecf3f0b9a33e4"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.7-web-sfsu"})
MERGE (g)-[e:is_evidence_for]->(y)
ON CREATE SET e.strength = 1, e.control = "internal",
              e.rationale = "One section of the editor training covers captions, transcripts and audio description for media on a page. It is not a training for media publishers.";


// --- 2. Seed documentation -----------------------------------------------------------
// MarComm's live "Website Content" guidelines page (already in the graph, c27a82a6...) is the
// published form of the same guidance. It stays on General Guidance For Web Content Creation
// as well; one page backing two implementations is correct here.
MATCH (g:Guidance {unique_id: "62818e2d4cf24a719a5ecf3f0b9a33e4"})
MATCH (w:Webpage {unique_id: "c27a82a6016a4d808297c6cdef95ba85"})
MERGE (g)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("2026-10-06"), r.modified_date = date("2026-10-06"),
              r.included_in_years = ["2025-2026"], r.excluded_from_years = [];


// --- 3. Marketing & Communications stake in 5.2-web ---------------------------------
// MarComm holds 5.5-web, 5.12-web and 5.13-web but not 5.2-web, the indicator for which it
// is now the named training body.
MATCH (c:CommunityOfPractice {name: "Marketing & Communications"})
MATCH (s:SuccessIndicator {composite_key: "5.2-web"})
MERGE (c)-[r:has_stake_in]->(s)
ON CREATE SET r.added_date = date("2026-10-06"),
              r.note = "MarComm is the body that trains campus web content editors.";


// --- 4. Accountable community: General Guidance For Web Content Creation ------------
// Signal 4 (documentation names the unit): two of its three sources are MarComm's brand
// site and MarComm's web guidelines page. The third is a Library checklist. No owner.
// Veto this section if the node is meant as a cross-unit catch-all.
MATCH (i:Guidance {unique_id: "0718e3b9533c4813af3f6e84ff614cec"})
MATCH (c:CommunityOfPractice {name: "Marketing & Communications"})
WHERE NOT (i)-[:accountable_community]->()
MERGE (i)-[:accountable_community]->(c);


// --- 5. Seed description -------------------------------------------------------------
// Written from the source text, not pasted from it. Says what the training is; how it was
// found and when is in this header, not on the node.
MATCH (g:Guidance {unique_id: "62818e2d4cf24a719a5ecf3f0b9a33e4"})
SET g.description = "Accessibility training that Strategic Marketing and Communications requires of SF State web content editors. It covers headings, tables, link text, alt text, audio and video, acronyms and accessible documents in Drupal 11. Completing it gives the editor a Pope Tech account for reviewing scan results on their own pages.";


// --- 6. Orphan: Accessible Document Training -----------------------------------------
// The CSU's WebAIM document training. MarComm's live guidelines page still links it in
// 2025-2026, so its documentation is current. External: the Chancellor's Office runs it.
MATCH (i:Guidance {unique_id: "bce9989c1bb04d82b88f0b0ec631487b"})
MATCH (y:YearSuccessEvidence {year_identifier: "2025-2026-5.6-web-sfsu"})
MERGE (i)-[e:is_evidence_for]->(y)
ON CREATE SET e.strength = 1, e.control = "external",
              e.rationale = "The CSU's monthly WebAIM document accessibility training, open to SF State staff and linked from MarComm's web guidelines. SF State relies on it and does not run it.";

MATCH (i:Guidance {unique_id: "bce9989c1bb04d82b88f0b0ec631487b"})-[r:is_documented_by]->(w:Webpage {unique_id: "ad1dff249c684980bc21135a8b95daa0"})
WHERE NOT "2025-2026" IN r.included_in_years
SET r.included_in_years = r.included_in_years + ["2025-2026"], r.modified_date = date("2026-10-06");
