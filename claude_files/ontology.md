# Implementation Brief: Ontology Descriptions Layer

**For:** Claude Code, working in the `ATI_Analysis` repo
**Spec author:** Daniel Fontaine (SFBRN Accessibility Lead), with design synthesis
**Files in scope:** `app/database/graph_schema.py` (the `UniversalDescriptor` node), `app/data_config.py`, the API/endpoints layer (locate the data-api, e.g. `endpoints/data_api/`), and the identifier factory module.
**Status:** Standalone, shippable. Does NOT depend on the executable-heuristic / meta-scaffold work, which is deferred.

---

## 0. Read first, then plan

1. Read the existing `UniversalDescriptor` class in `graph_schema.py`. It currently has only `unique_id` and `description`. We are extending it.
2. Read `app/data_config.py`, especially `PUBLIC_VOCABULARIES` and the existing settings endpoint pattern (referenced as `GET /ati/data-api/v1/settings` in `endpoints/data_api/settings.py`). The description-fetch endpoints should follow the same conventions.
3. Read how labels, field names, and rel-types are spelled in the schema so descriptor handles match them exactly.
4. Write a short plan before editing.

---

## 1. What we are building, in one paragraph

A **standalone descriptor subgraph** that holds human-readable descriptions of the ontology — node types, fields, and specific field/vocabulary values — surfaced by the web app. Descriptors are **never connected to first-order instance data by edges** (that would multiply repeated text across large result sets). Instead each descriptor carries a **handle** (the label name, the field key, or a keyword) and the app retrieves descriptors two ways: (a) **exact handle match**, run as a cheap second query that co-occurs with a first-order query so the app can stitch descriptions onto results in memory; and (b) **keyword search**, for browsing/exploring the ontology. We extend the existing `UniversalDescriptor` node rather than adding new node types.

Each descriptor carries **two description fields**: a **full description** (`description_full`) holding the complete reasoning, design rationale, and thinking behind the element — long-form, the place to store the whole idea — and a **short description** (`description_short`), the concise text the application renders in tooltips, help panels, and the ontology browser. The short form is what users see by default; the full form is available on demand (an expand / "more" affordance) and is the institutional memory of *why* the element is the way it is.

---

## 2. The retrieval mechanism (the architecturally important part)

This is the core design constraint; honor it exactly.

- First-order queries return instance nodes (e.g. 400 `Interface` nodes). Those nodes carry an intrinsic handle: their **label** (every Interface knows it is an `Interface`). Some descriptors are keyed to finer handles (a field, or a field value like `teaching-and-learning`) via an explicit **keyword**.
- A **separate** query fetches descriptors by handle. The app **merges descriptions onto results client-side / in the response assembler**, fetching each description **once per handle**, never once per instance.
- **No edges from instance nodes to `UniversalDescriptor`.** The join is by handle string, in application memory, not by graph traversal. This is the whole point: it keeps result sets from carrying repeated description text.
- The same descriptor nodes serve keyword search (browse the ontology) via full-text/`CONTAINS` matching on their searchable text.

---

## 3. Extend `UniversalDescriptor`

Keep `unique_id` and `description`. Add the following (match the codebase's property style and `serialize()` conventions):

```python
class UniversalDescriptor(StructuredNode):
    """
    A standalone descriptor for an ontology element — a node type, a field, or a
    specific field/vocabulary value. Surfaced by the web app for help text, tooltips,
    and an ontology browser.

    DESCRIPTORS ARE NOT EDGE-CONNECTED TO INSTANCE DATA. They are retrieved by matching
    `descriptor_handle` (exact) or by keyword-searching `search_text`, and merged onto
    query results in the application layer — fetched once per handle, never once per
    instance. Connecting them by edges would multiply repeated description text across
    result sets.

    Two descriptions per element:
      - description_full  : long-form. The complete reasoning, design rationale, and
                            thinking behind the element. Where the whole idea is stored.
                            Shown on demand (expand / "more"); institutional memory of WHY.
      - description_short : concise. The text the application renders by default in
                            tooltips, help panels, and the ontology browser.

    descriptor_kind: node_type | field | field_value
    """
    unique_id = UniqueIdProperty()

    # The stable retrieval handle. Built by a factory so two authors describing the same
    # element produce the same handle. Examples:
    #   node_type:   "node_type:Interface"
    #   field:       "field:Interface.function"
    #   field_value: "field_value:function.teaching-and-learning"
    descriptor_handle = StringProperty(unique_index=True, required=True)

    descriptor_kind = StringProperty(choices=descriptor_kinds)  # node_type | field | field_value

    # For field and field_value descriptors, the label/field/value parts, so the app can
    # filter ("all field descriptors for Interface") without parsing the handle.
    target_label = StringProperty(index=True)   # e.g. "Interface" (null for pure vocab values not tied to a label)
    target_field = StringProperty(index=True)   # e.g. "function" (null for node_type descriptors)
    target_value = StringProperty(index=True)   # e.g. "teaching-and-learning" (only for field_value)

    title = StringProperty()                     # short human label, e.g. "Function"

    # The two descriptions. `description_short` is the default UI text; `description_full`
    # holds the complete rationale. (If the existing `description` field is in use, migrate
    # its contents into `description_full` and keep `description` as a deprecated alias or
    # drop it — see migration note in §7.)
    description_short = StringProperty()          # concise; rendered in the app by default
    description_full = StringProperty()           # long-form; the whole idea / rationale

    # Concatenation of title + both descriptions + handle parts, lowercased, for keyword
    # search. Populated on save (see §5). Enables CONTAINS / full-text matching for browse.
    search_text = StringProperty(index=True)

    # Optional housekeeping, matching other nodes in the schema:
    include_in_report = BooleanProperty(default=False)
    last_updated = DateProperty()

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "descriptor_handle": self.descriptor_handle,
            "descriptor_kind": self.descriptor_kind,
            "target_label": self.target_label,
            "target_field": self.target_field,
            "target_value": self.target_value,
            "title": self.title,
            "description_short": self.description_short,
            "description_full": self.description_full,
        }
```

Adjust names/style to match the codebase. The essential additions are: `descriptor_handle` (unique), `descriptor_kind`, the `target_*` decomposition, **`description_short` and `description_full`**, and `search_text`.

---

## 4. The handle convention

Handles must be deterministic so two authors describing the same element generate the same handle (same discipline as `asset_identifier` / `interface_identifier`). Write small helpers in the identifier factory module:

- `make_node_type_handle(label)` -> `f"node_type:{label}"` (e.g. `node_type:Interface`)
- `make_field_handle(label, field)` -> `f"field:{label}.{field}"` (e.g. `field:Interface.function`)
- `make_field_value_handle(field, value)` -> `f"field_value:{field}.{value}"` (e.g. `field_value:function.teaching-and-learning`)

Use a consistent prefix (`node_type:` / `field:` / `field_value:`) so handle namespaces don't collide and so the app can tell a handle's kind from its prefix. Match these against:
- **node_type** handles ← a result node's label
- **field** handles ← a label + field name the app knows it's rendering
- **field_value** handles ← a field + a value, including the controlled-vocabulary entries in `data_config` (so `teaching-and-learning`, `course-content`, etc. can each be described)

---

## 5. data_config additions and search_text population

- Add the `descriptor_kinds` vocabulary to `data_config.py` (dict-keyed style): `{"node_type": "Node Type", "field": "Field", "field_value": "Field Value"}`. Add to `PUBLIC_VOCABULARIES` if appropriate.
- Populate `search_text` on save: lowercase concatenation of `title`, `description_short`, `description_full`, and the human-readable parts of the handle. Do this in a `pre_save` hook / overridden `save()` if the codebase uses that pattern, or in the create/update service functions. The point is that `search_text` always reflects current `title` + both descriptions so keyword search finds matches in either the short or the full text.

---

## 6. API endpoints

Follow the existing data-api conventions (see the settings endpoint). Add:

1. **Bulk fetch by handles** — `POST /ati/data-api/v1/descriptions/by-handles` taking a list of handles, returning `{handle: descriptor}` map. This is the co-query endpoint: the app collects the handles present in a first-order result (the distinct labels, the fields being rendered, the values shown), calls this once, and merges. Returning a map keyed by handle makes the client-side stitch trivial.

2. **Keyword search** — `GET /ati/data-api/v1/descriptions/search?q=<keyword>` returning descriptors whose `search_text` matches. For the ontology-browser / help-search use.

3. **(Optional) fetch by target** — `GET /ati/data-api/v1/descriptions/for-label/<label>` returning the node_type descriptor plus all field descriptors for that label, for rendering a full form's help in one call.

All read-only. No descriptor write endpoints in this pass unless the user wants in-app editing (descriptors can be seeded by script — see §7).

---

## 7. Seeding the descriptors

The descriptions themselves should be authored from the existing class docstrings, which already contain high-quality definitions. The docstrings are typically rich enough to seed the **full** description directly; write a condensed one-or-two-sentence **short** description for each. Write a **seed script** (e.g. `scripts/seed_descriptors.py`) that creates/updates `UniversalDescriptor` nodes, populating both `description_short` and `description_full`, for:

**Migration of the existing `description` field:** if any `UniversalDescriptor` nodes already carry data in the old single `description` field, the seed/migration should move that text into `description_full` and then either keep `description` as a deprecated read-only alias or drop it. Decide based on whether anything else in the codebase reads `description`; grep for it first.

- **Every node type** in the schema — handle `node_type:<Label>`, description from the class docstring (condensed to a clean definition).
- **Every identity-bearing and salient field** — at minimum, for `Interface`: `function`, `locus`, `interface_identifier`, `presented_by`, `audience`, `coverage_domain(s)`, `provenance`; for `Asset`: `asset_identifier`, `asset_class`, `scope`, the stewardship edges; and the equivalents on the implementation nodes. Use judgment; cover the fields a user actually fills or reads.
- **Every controlled-vocabulary value worth explaining** — pull from `data_config` (`functions`, `asset_classes`, `asset_scopes`, `audiences`, `coverage_domains`, `interface_provenances`, etc.). Each value gets a `field_value` descriptor explaining what that choice means.

Make the seed script **idempotent** (upsert on `descriptor_handle`), so re-running it updates rather than duplicates. This is how descriptions get maintained: edit the seed source (or the docstrings it draws from) and re-run.

---

## 8. Implementation order

1. Confirm plan.
2. `data_config.py`: add `descriptor_kinds`.
3. Identifier factory: add the three handle helpers (§4).
4. `graph_schema.py`: extend `UniversalDescriptor` (§3); add `search_text` population (§5).
5. API: add the by-handles, search, and (optional) for-label endpoints (§6).
6. Seed script (§7), idempotent, drawing descriptions from docstrings and `data_config` labels.
7. Run `install_all_labels()` / the project's schema-install step; verify no neomodel errors.
8. Smoke test: seed, then call by-handles with `["node_type:Interface","field:Interface.function","field_value:function.teaching-and-learning"]` and confirm three descriptors return in a handle-keyed map, each carrying both `description_short` and `description_full`; call search with `q=stewardship` and confirm relevant descriptors return (matching text in either description).

---

## 9. Acceptance checks

- `UniversalDescriptor` has `descriptor_handle` (unique), `descriptor_kind`, `target_label/field/value`, `title`, `description_short`, `description_full`, `search_text`.
- No edge exists, anywhere in the schema, from an instance node to `UniversalDescriptor`. (Grep for any `RelationshipTo("UniversalDescriptor"...)` / `RelationshipFrom` and confirm there are none tying descriptors to data.)
- The by-handles endpoint returns a handle-keyed map and is called **once** per result set, not once per node (verify the app-side merge fetches per distinct handle).
- Keyword search returns descriptors by `search_text` match.
- The seed script is idempotent (run twice → no duplicates, `descriptor_handle` uniqueness holds).
- A first-order query for many `Interface` nodes does NOT carry description text per node; descriptions arrive via the separate by-handles call and are merged in the app.

---

## 10. Design rationale

- **Descriptions are metadata about types, not facts about the world**, so they live in a parallel subgraph keyed by type-handles, not woven into the data by edges.
- **Edge-joining descriptors to instances would multiply repeated text** across result sets (400 interfaces → 400 copies of the Interface description). Handle-match + in-app merge fetches each description once.
- **Handles are deterministic** (factory-built, prefixed by kind) for the same reason identifiers are: so the same element always resolves to the same descriptor and the co-query merge is reliable.
- **Extending `UniversalDescriptor`** rather than adding node types keeps the meta-vocabulary in one place, consistent with `data_config` being the single source of truth for choice vocabularies.
- This layer is the **flat "what each element means"** layer. The deferred meta-scaffold (Principles/Heuristics, the "why it's shaped this way" and executable diagnostics) is a separate, richer layer that will also key to schema elements but is intentionally NOT part of this pass.