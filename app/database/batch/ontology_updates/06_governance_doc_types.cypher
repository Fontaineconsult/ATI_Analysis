// 06_governance_doc_types.cypher
// Light-touch hardening of the remaining Governance node_type descriptors
// (app/database/ontology/wcag-em-2.md). The existing authority-based definitions
// are serviceable; each gains one appended paragraph naming the FUNCTIONAL role
// that document type plays in a WCAG-EM 2.0 evaluation. Guarded appends
// (idempotent via the 'Evaluation-role note' marker).

// ==== harden-law-node-type ==============================================
// Law is what makes a technical standard binding.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Law"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "Evaluation-role note"
SET d.description_full = coalesce(d.description_full, "") + "\n\nEvaluation-role note (WCAG-EM 2.0): law is what makes a technical standard binding — the DOJ Title II web rule incorporates WCAG 2.1 AA by reference, turning a W3C standard into the conformance target (WCAG-EM Step 1.2) that evaluations are scoped against.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== harden-case-node-type =============================================
// Cases calibrate what evaluation evidence withstands scrutiny.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Case"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "Evaluation-role note"
SET d.description_full = coalesce(d.description_full, "") + "\n\nEvaluation-role note (WCAG-EM 2.0): cases calibrate how much evaluation evidence is enough — judicial application of the ADA and Section 508 determines what conformance evidence and methodology withstand scrutiny. WCAG-EM Step 5.2 makes the connection explicit: evaluators keep records of the evaluation specifics 'to support conflict resolution in the case of dispute'.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== harden-directive-node-type ========================================
// Directives are the evaluation commissioner's instrument (CO = commissioner,
// campus = evaluator).
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Directive"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "Evaluation-role note"
SET d.description_full = coalesce(d.description_full, "") + "\n\nEvaluation-role note (WCAG-EM 2.0): directives such as the CSU ATI coded memoranda function as the evaluation commissioner's instrument. In WCAG-EM terms the Chancellor's Office acts as evaluation commissioner and each campus as evaluator; the directive sets the additional evaluation requirements beyond the technical standard (Step 1.4) — success indicators, review cycles, and reporting obligations.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== harden-external-policy-node-type ==================================
// Policies fix the standing evaluation-scope choices evaluations inherit.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:ExternalPolicy"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "Evaluation-role note"
SET d.description_full = coalesce(d.description_full, "") + "\n\nEvaluation-role note (WCAG-EM 2.0): an organization's policy typically fixes the standing evaluation-scope choices that individual evaluations then inherit — the conformance target (Step 1.2) and the accessibility support baseline (Step 1.3: the operating systems, browsers, and assistive technologies content is expected to work with).",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== harden-memo-node-type =============================================
// Memos carry the agreed additional evaluation requirements of Step 1.4.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Memo"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "Evaluation-role note"
SET d.description_full = coalesce(d.description_full, "") + "\n\nEvaluation-role note (WCAG-EM 2.0): memos frequently carry the agreed additional evaluation requirements of Step 1.4 — reporting templates, indicator definitions, review cycles — that bind campus evaluations beyond what WCAG itself requires.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
