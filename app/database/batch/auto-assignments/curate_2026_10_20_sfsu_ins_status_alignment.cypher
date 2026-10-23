// Status alignment corrections for SFSU instructional materials 2025-2026.
// Four high-confidence corrections identified by evidence audit.

// 1.5-ins: Established -> Not Started
// Reason: zero evidence of any kind (no notes, no implementations, no documents).
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.5-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Not Started'})
MERGE (yse)-[:status_is]->(sl);

// 2.4-ins: Established -> Defined
// Reason: single attested claim ("reports are distributed"), no linked documentation
// or implementation. Testimony without stored documentation = Defined at best.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-2.4-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Defined'})
MERGE (yse)-[:status_is]->(sl);

// 5.14-ins: Not Started -> Initiated
// Reason: CEETL Courses Containing Accessibility Guidance is wired as evidence and
// a note describes PD content about emerging tech accessibility. Having guidance
// on file = at least ad hoc practice.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Initiated'})
MERGE (yse)-[:status_is]->(sl);

// 8.14-ins: Not Started -> Initiated
// Reason: note states "Various free materials are available." Available PD materials
// = ad hoc practice, which is the definition of Initiated.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.14-ins-sfsu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Initiated'})
MERGE (yse)-[:status_is]->(sl);
