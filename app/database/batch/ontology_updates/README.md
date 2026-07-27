# Ontology updates — WCAG-EM 2.0 hardening

Named Cypher batches that harden Asset-category and Governance-category ontology
definitions against **WCAG Evaluation Methodology (WCAG-EM) 2.0** (W3C Group Note,
23 July 2026), converted to markdown at `app/database/ontology/wcag-em-2.md`.
Derived from the 2026-07-27 compare/contrast scan of the live `UniversalDescriptor`
content vs. the WCAG-EM text.

## Files (run in any order; each is independent and idempotent)

| File | Targets |
|---|---|
| `01_asset_interface.cypher` | `node_type:Interface`, `field:Interface.provenance`, `provenance.*` values, `function.internal-operations` |
| `02_asset_component.cypher` | `node_type:Component`, all five `component_kind.*` values |
| `03_asset_taap.cypher` | `node_type:TAAP`, all three `outcome.*` values |
| `04_asset_asset_and_tool.cypher` | `node_type:Asset`, `node_type:Tool` |
| `05_governance_guideline.cypher` | `node_type:Guideline` |
| `06_governance_doc_types.cypher` | `node_type:Law`, `Case`, `Directive`, `ExternalPolicy`, `Memo` |
| `07_principles_grounding.cypher` | grounds + activates two inert principles (`derives_from` / `shapes` edges) |

## Conventions

- **Placeholder descriptors** (short = full = title, e.g. the `component_kind` values)
  are fully **replaced** — `SET` is absolute, so re-running is a no-op.
- **Rich existing prose** (the node_type descriptors) is **appended to**, never
  replaced: each append is guarded by `WHERE NOT ... CONTAINS <marker>` so the
  statement is idempotent and the institutional-memory text is preserved verbatim.
- Every content statement **recomputes `search_text`** with the same recipe as
  `compose_search_text()` in `queries/descriptors/create.py` (lowercase, space-joined
  title + short + full + target parts) and stamps `last_updated = date()`.
- `07` only `MATCH`es existing nodes (the WCAG-EM 2.0 / WCAG 2.1 `Guideline` nodes and
  the Title II `Law` node already exist in the graph) and `MERGE`s edges — no node
  creation, no properties on the edges (matching `queries/principles/update.py`).
- A statement whose `MATCH` finds nothing is a **no-op**, not an error.

## Deliberately out of scope (needs code/schema, not Cypher)

- `Tool.version` property (WCAG-EM Step 5.2 wants tool names + versions).
- An **accessibility support baseline** anywhere in the model (Step 1.3) — the
  OS/browser/AT combinations conformance derivation assumes.
- **evaluator / evaluation-commissioner** roles (WCAG-EM glossary; maps to
  Chancellor's Office ↔ campus) — currently only prose in descriptors.
- Remaining placeholder vocab values WCAG-EM says nothing about (`asset_class.*`,
  `scope.*`, the other three `function.*`, `coverage_domains.*`, `audience.*`) —
  they need separate authoring from ATI/CSU sources, not from WCAG-EM.
