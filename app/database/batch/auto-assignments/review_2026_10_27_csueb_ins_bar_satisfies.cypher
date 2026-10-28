// Companion bar claims, CSUEB 2025-2026 Instructional Materials, 2026-10-27.
// Records the requirements the 2026-10-27 bar coverage review graded Met, so the
// coverage view stops reporting them as unmet. Partly-met requirements are NOT
// claimed: the coverage view reads any claim as satisfied.
// Mirrors set_evidence_satisfies: satisfies is the full handle list in bar order
// (each link had no prior claim, so the replace drops nothing). Every handle belongs
// to the indicator the YSE tracks; the MATCH on EvidenceRequirement enforces that.
// The rationale says how the work answers the requirement (set_evidence_rationale).
// Idempotent: re-running sets the same values.

// 1.2-ins seq 9: tracking that monitors adoption status.
MATCH (i:Process {unique_id: '7fef8b4080ee49b5a43eac7f7bdd7a46'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(:EvidenceRequirement {handle: 'evidence:1.2-ins:established:9'})
SET r.satisfies = ['evidence:1.2-ins:established:9'],
    r.rationale = 'The platform takes a nightly Follett adoption feed by ISBN and reports adoption status and library coverage by section, which is the tracking mechanism this requirement asks for. It is still in test, at about 80 percent link accuracy.';

// 1.2-ins seq 6: faculty informed of adoption timelines that leave remediation time.
// New evidence link (assign_implementation_to_year_success_indicator twin), strength 2
// and control internal as on the same item's 4.5-ins link.
MATCH (i:Guidance {unique_id: '8550dd14-54a2-4e5f-8a34-185867067b24'})
MATCH (y:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(:EvidenceRequirement {handle: 'evidence:1.2-ins:established:6'})
MERGE (i)-[r:is_evidence_for]->(y)
ON CREATE SET r.strength = 2, r.control = 'internal'
SET r.satisfies = ['evidence:1.2-ins:established:6'],
    r.rationale = 'Accessibility Services publishes the textbook adoption deadlines to faculty, mid-March for summer and fall and mid-October for winter and spring, and states the reason: remediating a textbook takes four to six weeks. That is a published timeline that leaves time for accessibility review before instruction.';

// 6.7-ins seq 4 (Output): evaluation results generated, tracked and used for remediation.
MATCH (i:Tracking {unique_id: '61a432eed0524761924555edcce79884'})-[r:is_evidence_for]->(y:YearSuccessEvidence {year_identifier: '2025-2026-6.7-ins-csueb'})
MATCH (y)-[:tracks]->(:SuccessIndicator)-[:has_evidence_requirement]->(:EvidenceRequirement {handle: 'evidence:6.7-ins:established:4'})
SET r.satisfies = ['evidence:6.7-ins:established:4'],
    r.rationale = 'The dashboard pulls UDOIT reports nightly and produces a department scorecard trended week over week, and the Online Campus lead contacts departments that score poorly. Results are generated, tracked and used to direct remediation, which is the Output requirement.';
