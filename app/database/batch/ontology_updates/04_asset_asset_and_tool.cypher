// 04_asset_asset_and_tool.cypher
// Harden Asset and Tool node_type descriptors against WCAG-EM 2.0
// (app/database/ontology/wcag-em-2.md). Guarded appends only — the existing
// rationale prose is preserved verbatim.

// ==== harden-asset-node-type ============================================
// 'digital product' anchor + product-enclosure contrast.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Asset"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_full = coalesce(d.description_full, "") + "\n\nWCAG-EM 2.0 grounding and contrast: WCAG-EM defines a 'digital product' as a 'coherent collection of one or more related views that together provide common use or functionality' — websites, web apps, e-books, kiosk apps, mobile apps and documents. The two individuations compose: WCAG-EM cuts by coherence of views and use; the Asset cuts by remediation authority. WCAG-EM's own note that a product 'may be composed of smaller subsets of views, each of which can be considered to be an individual product' supports scope-splitting identity (canvas-sfsu vs canvas-systemwide). CONTRAST — the principle of product enclosure: a WCAG-EM conformance evaluation must scope ALL views, states and functionality of the product without excluding parts; the Interface set beneath an asset is a deliberately partial tracking selection. An asset's evaluable enclosure is total even where its tracked interface set is not.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== harden-tool-node-type =============================================
// Two adjacent WCAG-EM roles: evaluation instruments (record versions — Step 5.2)
// and systems relied upon for conformance (Step 2.4 note) — the latter is an
// open modeling decision, flagged here so it is not resolved by accident.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Tool"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_full = coalesce(d.description_full, "") + "\n\nWCAG-EM 2.0 distinguishes two adjacent roles worth keeping straight here. (1) EVALUATION instruments: Step 5.2 expects the names AND versions of evaluation tools, web browsers, and assistive technologies used in an evaluation to be recorded — Tool has no version property, so a Tool used for evaluation should carry its version in title or description. (2) Systems RELIED UPON for conformance (Step 2.4 note): authoring tools and CMSes, design systems, front-end frameworks — neither remediation instruments nor necessarily stewarded assets. The nearest existing hook is tool_of_asset / parent_asset; representing 'relied upon' explicitly remains an open modeling decision.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
