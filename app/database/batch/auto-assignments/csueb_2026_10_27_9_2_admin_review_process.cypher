// CSUEB 9.2-ins (2025-2026): the Administrative Review Process (the ATI Annual Report Knowledge Graph's review
// workflow) listed as evidence. 2026-10-27, Daniel Fontaine, on the user's statement that this database is the process.
// Twin of assign_implementation_to_year_success_indicator + set_evidence_control + set_evidence_rationale.
// Strength 2 (partial): the review mechanism exists and holds the campus Instructional Materials plan, but no
// East Bay ATI Steering Committee is constituted and no CSUEB Instructional Materials indicator has completed
// admin review for 2025-26. Control external: SFBRN staff run the review for East Bay.
// 9.2-ins has no evidence requirements, so no satisfies claim. Status is not touched.

MATCH (i:Process {unique_id: 'e8eb9491ce4c4221b55ccbfdf481ee42'}), (y:YearSuccessEvidence {year_identifier: '2025-2026-9.2-ins-csueb'})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = 'external', r.satisfies = []
SET r.rationale = coalesce(r.rationale, "The ATI Annual Report Knowledge Graph is where East Bay's Instructional Materials plan is reviewed, revised and approved. It holds the 2025-26 Instructional Materials working group plan and each indicator's evidence, status, plans and recommendations, and designated admin reviewers check and approve each indicator before the report goes to the Chancellor's Office. That review and approval workflow is the process this indicator asks for. SFBRN staff run it for East Bay because the campus has no constituted ATI Steering Committee, and no East Bay Instructional Materials indicator has completed admin review for 2025-26.");
