// 01_asset_interface.cypher
// Harden Interface descriptors against WCAG-EM 2.0 (app/database/ontology/wcag-em-2.md).
// Appends are guarded (idempotent); placeholder field values are replaced outright.
// Every statement recomputes search_text per compose_search_text() and stamps last_updated.

// ==== harden-interface-node-type ========================================
// Anchor the 'unit of conformance' claim in WCAG-EM 2.0's formal 'view' definition,
// give the salience judgment its citable rubric (Steps 2.1-2.5), and state the
// enclosure-vs-selection contrast so interface coverage is never read as
// conformance coverage.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Interface"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_short = "A salient point of interaction identified by a four-coordinate signature (backing asset, locus, function, title). The unit that remediation work targets — the ATI's equivalent of a WCAG-EM 2.0 'view', the unit of conformance.",
    d.description_full = coalesce(d.description_full, "") + "\n\nWCAG-EM 2.0 grounding (W3C Group Note, 23 July 2026): the claim that this is WCAG's unit of conformance now has a formal external definition — a 'view' is 'a web page, document, software or view, or an equivalent unit of conformance defined in the accessibility standard being evaluated' (WCAG-EM 2.0 glossary). The Interface is the ATI's equivalent unit of conformance. The 'judgment of salience' that selects interfaces has a citable rubric in WCAG-EM Steps 2.1-2.5: a view earns attention because it is a COMMON VIEW (entry points; views linked from every header, footer, or navigation menu), carries ESSENTIAL FUNCTIONALITY ('functionality that, if removed, fundamentally changes the use or purpose of the product for users'), is an ACCESSIBILITY-RELEVANT sample (views explaining accessibility features, settings, help, contact and support), or supports SENSITIVE OR HIGH-RISK functionality (authentication, personal information, financial transactions). CONTRAST — enclosure vs selection: WCAG-EM's principle of product enclosure requires a conformance evaluation to scope ALL views, states and functionality of a product, without excluding parts; the interface set is a deliberately partial TRACKING selection, not a conformance-claim scope. Interface coverage must never be read as conformance coverage.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== harden-interface-provenance-field =================================
// The declared-vs-enacted gap makes the same epistemic move as WCAG-EM's
// structured-vs-random sampling comparison.
MATCH (d:UniversalDescriptor {descriptor_handle: "field:Interface.provenance"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_full = coalesce(d.description_full, "") + "\n\nWCAG-EM 2.0 parallel: structured-vs-random sampling makes the same epistemic move. The structured sample set is the deliberately chosen picture (declared); the random sample set reveals what actually exists (enacted); divergence between them is the signal that the declared picture is not representative (WCAG-EM Steps 3.1, 3.2, 4.3).",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-provenance-declared ========================================
// Placeholder replacement (was title-only).
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:provenance.declared"})
SET d.description_short = "Named by the ATI in advance — the interface entered the graph by deliberate declaration.",
    d.description_full = "The ATI named this interface deliberately, before or independent of remediation activity — the top-down selection path. Analogue of WCAG-EM 2.0's structured sample set (Step 3.1): views chosen to represent common views, essential functionality, sample types, and technologies relied upon. A declared interface records where the institution SAYS its accessibility duty lands.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-provenance-enacted =========================================
// Placeholder replacement (was title-only).
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:provenance.enacted"})
SET d.description_short = "Emerged from where remediation work actually clustered, without prior declaration.",
    d.description_full = "This interface entered the graph because remediation work clustered around it — bottom-up evidence of where the duty actually lands. Analogue of WCAG-EM 2.0's randomly selected sample set (Step 3.2): the check on the declared picture. An enacted interface that was never declared parallels WCAG-EM Step 4.3, where the random sample surfaces content types the structured sample missed — the signal that the declared selection is not representative.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-provenance-both ============================================
// Placeholder replacement (was title-only).
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:provenance.both"})
SET d.description_short = "Declared by the ATI and confirmed by where remediation work clustered.",
    d.description_full = "The interface was declared in advance AND confirmed by enacted remediation work — the two selection paths agree. In WCAG-EM 2.0 terms (Step 4.3) this is the case where the structured and random sample sets correlate, which is exactly what raises confidence that the declared picture is representative.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-function-internal-operations ===============================
// Placeholder replacement (was title-only). The one function value WCAG-EM
// speaks to, via the closed-network baseline note (Step 1.3).
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:function.internal-operations"})
SET d.description_short = "ICT serving employees' internal work rather than public- or student-facing functions.",
    d.description_full = "The interface serves internal operations — administrative and operational work by employees (HR self-service, finance systems, intranets); audience is typically employees. WCAG-EM 2.0's closed-network note (Step 1.3) recognizes that products whose users and access computers are all known may justify a NARROWER accessibility-support baseline than public-facing products — a distinction that matters for internal-operations interfaces, though the underlying duty (Title II / Section 508) is not reduced.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
