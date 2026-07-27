// 05_governance_guideline.cypher
// Harden the Guideline node_type descriptor against WCAG-EM 2.0
// (app/database/ontology/wcag-em-2.md). The short is replaced (the 'recommended
// practices' framing undersells bindingness); the full gets a guarded append
// adding the normative/informative axis and the versioning requirement.

// ==== harden-guideline-node-type ========================================
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Guideline"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_short = "A published accessibility standard or methodology worked against. Two species: normative standards that define what conformance IS (WCAG 2.x — binding where incorporated by reference into law), and informative methodologies that define how conformance is EVALUATED (WCAG-EM 2.0).",
    d.description_full = coalesce(d.description_full, "") + "\n\nHardened against WCAG-EM 2.0: 'recommended practices' understates one species of guideline. Distinguish two. (1) NORMATIVE STANDARDS define what conformance IS — WCAG 2.x, the Revised Section 508 Standards, EN 301 549. A standard may be incorporated by reference into binding law: the DOJ Title II web rule incorporates WCAG 2.1 AA as the binding floor (see the Conformance-to-an-external-technical-standard principle), at which point it is not 'recommended' but required. (2) INFORMATIVE METHODOLOGIES define how conformance is EVALUATED — WCAG-EM 2.0 itself, which is explicit that it 'does not define additional WCAG 2 requirements, nor does it replace or supersede them in any way'. Versioning is load-bearing for both species: a WCAG-EM evaluation statement must name 'guidelines title, version and URI' (Step 5.3), and the Title II rule fixes a specific version as the floor while permitting later versions — so Guideline titles here carry their version (e.g. 'Web Content Accessibility Guidelines (WCAG) 2.2'), and which version governs a given evaluation must remain trackable as standards evolve.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
