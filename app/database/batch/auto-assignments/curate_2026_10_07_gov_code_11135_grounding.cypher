// =====================================================================================
// Ground principle:state-law-adopts-the-federal-standard on the text of Gov Code 11135.
// Run 2026-10-07 by Daniel Fontaine.
//
// WHY
//   Phase 1a (curate_2026_10_06_governance_phase1a_consolidation.cypher) marked Law 679451e9
//   ("ARTICLE 9.5. Discrimination [11135 - 11139]") duplicate_of Law 849abdeb ("California
//   Government Code Section 11135"). The statute text sat on 679451e9 and was not copied, so
//   later passes found no text on 849abdeb and recorded the grounding as unverified.
//   The text (as amended by Stats. 2016, Ch. 870, effective 2017-01-01) is copied onto
//   849abdeb separately through neo4j-cli (1,633 chars). duplicate_of is kept.
//
// WHAT THE TEXT CHANGES
//   The edge cited 11135(d). Subdivision (d) covers perceived and associated characteristics.
//   Subdivision (a) names the CSU, and (b) sets Title II (42 U.S.C. 12132) and its
//   regulations as the standard for disability, with stronger state law prevailing.
//   The stored text does not mention Section 508. The 508 duty is in Gov Code 7405(a),
//   which this principle already cites as a mandate. grounding_kind moves from unverified
//   to interpretation.
//
// NOT DONE
//   The ATI policy edge on this principle is unchanged. Its rationale attributes the
//   11135-applies-508 claim to the policy. Whether that claim reflects an earlier version
//   of 11135 was not checked.
//
// VALIDATE FIRST
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_gov_code_11135_grounding.cypher
//   python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/curate_2026_10_07_gov_code_11135_grounding.cypher --execute
// =====================================================================================

MATCH (p:Principle {handle: "principle:state-law-adopts-the-federal-standard"})-[r:derives_from]->(:Law {unique_id: "849abdeb538443e8be1e93e3b280d336"})
SET r.provision = "Cal. Gov. Code 11135(a)-(b)",
    r.grounding_kind = "interpretation",
    r.quote = "shall meet the protections and prohibitions contained in Section 202 of the federal Americans with Disabilities Act of 1990 (42 U.S.C. Sec. 12132), and the federal rules and regulations adopted in implementation thereof",
    r.rationale = "Section 11135(a) bars disability discrimination in programs and activities that the state conducts, funds, or assists, and states that the section applies to the California State University. Section 11135(b) requires those programs to meet Title II of the ADA and its implementing regulations. Where state law gives stronger protections, 11135(b) applies the stronger law. The section adopts the federal Title II standard. It does not mention Section 508. Government Code 7405(a) is the provision that adopts Section 508.",
    r.assessed_date = date("2026-10-07");
