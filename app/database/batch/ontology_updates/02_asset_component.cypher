// 02_asset_component.cypher
// Harden Component descriptors against WCAG-EM 2.0 (app/database/ontology/wcag-em-2.md).
// The node_type gets a guarded append; the five component_kind values were empty
// placeholders and are replaced with real definitions sourced from WCAG-EM's sample-type
// and technology vocabulary (Steps 2.3, 2.4, 4.1, 4.2).

// ==== harden-component-node-type ========================================
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:Component"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_full = coalesce(d.description_full, "") + "\n\nWCAG-EM 2.0 grounding: Step 2.3 individuates sample variety at exactly this grain — 'different types of content, such as forms, tables, lists, headings, multimedia, and scripting' and 'different functional components, such as date pickers, modal overlays, and carousels'. The Step 4.1 note supports Component as a reusable evaluation grain: components that occur repeatedly across samples (header, navigation bars, search form) 'do not need to be re-evaluated on each occurrence unless they appear or behave differently'.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-component-kind-web-surface =================================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:component_kind.web-surface"})
SET d.description_short = "A rendered web page or view region — markup, styling, and scripting evaluated as a whole surface.",
    d.description_full = "The component is a web surface — a rendered page or view region whose accessibility rests on its markup, styling, and scripting (HTML, CSS, JavaScript, WAI-ARIA in WCAG-EM 2.0's Step 2.4 technology list). The default component kind for web-delivered interfaces, and the grain WCAG 2's 'full pages' conformance requirement evaluates.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-component-kind-structured-document =========================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:component_kind.structured-document"})
SET d.description_short = "A document artifact (PDF, Word, EPUB) whose accessibility lives in its internal structure.",
    d.description_full = "The component is a structured document — PDF, Word, EPUB, and similar artifacts, which WCAG-EM 2.0 classes as digital products in their own right ('documents (PDF, Word, EPUB)', glossary). Accessibility attaches to internal structure: tags, reading order, headings, text alternatives. WCAG-EM notes document samples may lack URLs and are identified by title or filename, and that a single document is scoped whole or by parts depending on complexity.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-component-kind-time-based-media ============================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:component_kind.time-based-media"})
SET d.description_short = "Audio/video content — the grain where captions, transcripts, and audio description attach.",
    d.description_full = "The component is time-based media — audio and video content, the 'multimedia' of WCAG-EM 2.0 Step 2.3. The grain where WCAG's time-based-media criteria (captions, transcripts, audio description) attach, and the canonical WCAG-EM example of a conforming alternate version: a video provided with and without captions is evaluated together with its sample as one unit, not as separate samples (Step 4.1).",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-component-kind-interactive-component =======================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:component_kind.interactive-component"})
SET d.description_short = "A functional widget — date picker, modal, carousel, form — where operability criteria attach.",
    d.description_full = "The component is an interactive widget — WCAG-EM 2.0 Step 2.3's 'different functional components, such as date pickers, modal overlays, and carousels', plus forms and dialogs (Step 4.2 evaluates 'interaction with forms, input elements, dialog boxes, and other components' along complete processes). The grain where operability and robustness criteria — keyboard access, focus management, name/role/value — attach.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-component-kind-static-non-text =============================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:component_kind.static-non-text"})
SET d.description_short = "Non-text, non-interactive content — images, charts, icons — where text-alternative criteria attach.",
    d.description_full = "The component is static non-text content — images, charts, diagrams, icons. The grain where WCAG's text-alternative criteria attach (1.1.1 Non-text Content). Distinct from time-based media (no time dimension) and from interactive components (no operable behavior).",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
