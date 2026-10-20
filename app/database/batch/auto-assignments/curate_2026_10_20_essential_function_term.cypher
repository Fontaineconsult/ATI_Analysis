// =====================================================================================
// Curate: the matrix term "core task" becomes "essential function".
// Prepared 2026-10-20 for Daniel Fontaine. Validated, NOT executed.
//
// The SFBRN review rubric (app/database/ontology/impact-matrix/rubric-core.md) now calls
// the unit of severity an essential function, the term WCAG-EM 2.0 and the CSU TAAP
// template use. This batch brings the graph's own prose into line. It touches only text
// the project wrote: a Principle and an IntellectualSource description. Quoted source
// text (raw_text) and the GSA ACR Supplement's description of GSA's severity scale, which
// says "core tasks" in GSA's words, are left alone.
//
// RECON (2026-10-20, neo4j-cli, read-only)
//   - "core task" appears in project-written text on two nodes:
//       Principle {handle: "principle:severity-from-task-impact"}: description_short (1),
//         description_full (2)
//       IntellectualSource {name: "AIAG and VDA, FMEA Handbook (2019)"}: description_full (1)
//   - The handle principle:severity-from-task-impact is an identifier and stays.
//   - The Principle's name changes with the term. Rationale text on its derives_from edges
//     was checked and does not use the term.
//
// Idempotent: replace() on text that no longer contains the term is a no-op.
// =====================================================================================

MATCH (p:Principle {handle: "principle:severity-from-task-impact"})
SET p.name = "Severity is judged by the effect on an essential function",
    p.description_short = replace(replace(replace(replace(p.description_short,
        "a core task", "an essential function"), "core tasks", "essential functions"),
        "core task", "essential function"), "effect on a task", "effect on an essential function"),
    p.description_full = replace(replace(replace(p.description_full,
        "a core task", "an essential function"), "core tasks", "essential functions"),
        "core task", "essential function");

MATCH (s:IntellectualSource {name: "AIAG and VDA, FMEA Handbook (2019)"})
SET s.description_full = replace(replace(s.description_full,
        "S3 on a core task", "S3 on an essential function"), "core task", "essential function");
