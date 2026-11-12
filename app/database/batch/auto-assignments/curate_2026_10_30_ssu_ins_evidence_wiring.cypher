// SSU instructional materials 2025-2026: list existing work on the indicators it answers.
// Seven additions across six indicators. No new nodes. Every item already exists and
// already evidences other indicators. Each link carries a strength, a control flag and
// a written reason, because none of the 63 existing links on this campus carries a reason.

// ---------------------------------------------------------------------------
// 1.2-ins  <-  the adoption platform and the Senate policy
// ---------------------------------------------------------------------------
MATCH (i:Process {unique_id: 'd3476faa88b44e588dd6b44004f05063'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 3,
              e.control = 'internal',
              e.rationale = "The indicator asks for technology and specified staff time behind timely adoption. The bookstore operates the Barnes and Noble adoption platform and commits staff time to weekly faculty communications during and after the ordering window. Spreadsheets of courses without orders, with charts, go to deans and chairs. Submission rates rose term over term from 54 percent in spring 2024 to 65 percent in fall 2024.";

MATCH (i:InternalPolicy {unique_id: 'db695b3e6fe84d19957d7c4c929152ce'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 3,
              e.control = 'internal',
              e.rationale = "The indicator asks for documented practices. This is the Academic Senate policy that sets the adoption requirement and obliges department chairs to communicate deadlines, including to faculty hired after the ordering window closes. Its scheduled review date passed in December 2015.";

// ---------------------------------------------------------------------------
// 4.3-ins  <-  the published faculty guidance
// ---------------------------------------------------------------------------
MATCH (i:Guidance {unique_id: '7f494374946644c181ce970a6fb11762'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-4.3-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 3,
              e.control = 'internal',
              e.rationale = "The indicator asks for documented guidelines and procedures for creating accessible content hosted in the learning management system. These are the published CTET and campus accessibility pages covering documents, multimedia, course design and the faculty accessibility guide. Five of the six pages carry captured text, so what they say can be checked.";

// ---------------------------------------------------------------------------
// 5.13-ins  <-  the written remediation path
// ---------------------------------------------------------------------------
MATCH (i:Guidance {unique_id: '7e6f7331-e420-4a48-9196-dae2cea14047'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.13-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 2,
              e.control = 'internal',
              e.rationale = "The indicator covers remediating word processor files, spreadsheets, presentations and PDFs. This manual is the written path the student remediation team follows for that work, maintained by Tim Hensel. It is built as a Canvas course and cannot be opened from outside CTET, which is why it is rated as supporting rather than strong evidence.";

// ---------------------------------------------------------------------------
// 5.14-ins and 5.16-ins  <-  the purchase accessibility review
// ---------------------------------------------------------------------------
MATCH (i:Procedure {unique_id: 'f8e96ec87cb24b4cad8667483f7a5564'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.14-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 2,
              e.control = 'external',
              e.rationale = "The indicator asks how emerging instructional technologies are reviewed before instructional use. This is the written review that evaluates a product's accessibility conformance against WCAG 2.1 A and AA, rates its risk, and requires a signed alternative access plan before a high-risk product is approved. Sonoma does not operate the procedure, so what is graded here is Sonoma's use of it rather than the procedure's own internals.";

MATCH (i:Procedure {unique_id: 'f8e96ec87cb24b4cad8667483f7a5564'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-5.16-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 2,
              e.control = 'external',
              e.rationale = "The indicator covers learning and engagement tools. Sonoma submits instructional tools that carry no purchase cost as zero dollar requisitions, which routes them through this accessibility and security review even though no money changes hands. Amanda McGowan described that route in October 2026. The procedure is operated by SFBRN procurement rather than by Sonoma.";

// ---------------------------------------------------------------------------
// 8.14-ins  <-  the written training path for the remediation team
// ---------------------------------------------------------------------------
MATCH (i:Guidance {unique_id: '7e6f7331-e420-4a48-9196-dae2cea14047'})
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-8.14-ins-ssu'})
MERGE (i)-[e:is_evidence_for]->(yse)
ON CREATE SET e.strength = 2,
              e.control = 'internal',
              e.rationale = "The indicator covers ongoing professional development for employees who hold accessible instructional materials duties. This manual is the written training path for the student remediation team, used alongside the checklist training Tim Hensel runs. It does not reach employees outside that team, which is the gap an open concern on this indicator records.";

// ---------------------------------------------------------------------------
// Mark the boundary on the existing 6.9 link to the same procedure.
// ---------------------------------------------------------------------------
// It carries a strength and no control flag, on a process Sonoma does not run.
MATCH (i:Procedure {unique_id: 'f8e96ec87cb24b4cad8667483f7a5564'})-[e:is_evidence_for]->(yse:YearSuccessEvidence {year_identifier: '2025-2026-6.9-ins-ssu'})
SET e.control = 'external';

// ---------------------------------------------------------------------------
// 1.2-ins: Defined -> Established
// ---------------------------------------------------------------------------
// With the adoption platform and the Senate policy listed, the indicator's four
// named elements are all evidenced: documented practices, specified staff time,
// educational and training resources, and technology. The practice has run since
// Fall 2020 and its results are measured each term.
MATCH (yse:YearSuccessEvidence {year_identifier: '2025-2026-1.2-ins-ssu'})-[r:status_is]->(:StatusLevel)
DELETE r
WITH yse
MATCH (sl:StatusLevel {status_level: 'Established'})
MERGE (yse)-[:status_is]->(sl);
