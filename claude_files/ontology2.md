# Meta-Scaffold Phase 1 — SchemaElement + Principle Frontend Implementation Breakdown

**Audience:** a Claude Code session building the first two slices of the meta-scaffold, using the
**Governance** vertical slice as the structural reference to mirror, and the **Descriptor** layer
(`DescriptorContext` / `useDescriptors`) as the source of all human prose.

**What this phase builds:** two new master–detail CRUD slices —
- **SchemaElement**: thin handles for type-level elements of our own schema (a node label, a
  relationship type, a field). The anchor everything in the meta-layer points AT.
- **Principle**: the framework's conceptual commitments (parallel duties, closest-to-capacity,
  line-vs-functional authority, second-line function, Ostrom's boundaries). Grounded DOWN in
  Governance/IntellectualSource; shapes ACROSS to SchemaElements.

**Deferred to Phase 2 (do NOT build now):** the **Determination** slice (rulings/recommendations,
the trace-up ladder, lifecycle/supersede). It points at Principles and SchemaElements, so it is
built after both exist. This brief lays the foundations it will depend on.

**Two architectural departures from Governance (deliberate, see §3):**
1. **URL-driven selection** (like Implementations’ `:implementationType`), NOT Governance’s
   in-memory selection — because Phase 2’s trace-up crosses slices, and URL routing makes
   cross-slice navigation and deep-linking trivial. Build it in from the start.
2. **Context-based data sharing** (the `DescriptorContext` pattern), NOT Governance’s self-fetch —
   because the meta-layer is read across views (and by the trace-up). Mirror `DescriptorContext`.

---

## 1. File map

```
context/
  MetaScaffoldContext.js           # provider: fetches SchemaElements + Principles once, exposes
                                   #   loading/error + byHandle maps + reload(); mirror DescriptorContext.js
hooks/
  useMetaScaffold.js               # the use* hook over MetaScaffoldContext; lookup helpers
components/
  ati_explorer_containers/
    SchemaElementMasterContainer.js  # smart container: selection from URL, add/edit/delete flow
    PrincipleMasterContainer.js      # smart container: selection from URL, add/edit/delete flow
    WorkingGroupMasterContainer.js   # ADD routes: "schema-elements" + "principles" (mirror governance route)
  graph_components/schema_elements/
    schemaElementTypes.js          # STRUCTURAL registry only (element_kind options, field schema, colors)
    SchemaElementList.js           # left column: grouped by element_kind + search + Add
    SchemaElementDetailPanel.js    # right column: read view + Edit/Delete; descriptor prose; "shaped by" backrefs
    SchemaElementForm.js           # type-aware modal form (create + edit)
    SchemaElementKindBadge.js      # colored pill per element_kind (single color source)
  graph_components/principles/
    principleTypes.js              # STRUCTURAL registry only (field schema, colors) — Principle is single-type
    PrincipleList.js               # left column: list (grouped by grounding-kind or flat) + search + Add
    PrincipleDetailPanel.js        # read view + Edit/Delete; descriptor prose; grounding + shapes attach blocks
    PrincipleForm.js               # modal form (create + edit)
    PrincipleSourceBadge.js        # optional pill: law-grounded vs theory-grounded
services/api/
    get.js     fetchAllSchemaElements(), fetchAllPrinciples()
    post.js    createSchemaElement(), createPrinciple()
    put.js     updateSchemaElement(), updatePrinciple(),
               attach/detach Principle→Governance (derives_from),
               attach/detach Principle→SchemaElement (shapes),
               attach/detach Principle→IntellectualSource (derives_from)
    delete.js  deleteSchemaElement(), deletePrinciple()
components/functional_components/
    EntityAttachmentSelector.js    # REUSED for every relationship block (grounding, shapes)
```

**Backend (the contract):**
`app/endpoints/data_api/schema_elements.py` (MethodView at `/schema-elements`),
`app/endpoints/data_api/principles.py` (MethodView at `/principles`),
`app/endpoints/data_api/intellectual_sources.py` (MethodView at `/intellectual-sources` — small,
GET-heavy; needed as a `derives_from` target alongside Governance),
CRUD in `app/database/queries/{schema_elements,principles,intellectual_sources}/{create,read,update,delete}.py`.

---

## 2. Routing & how it mounts (URL-driven selection)

Mirror the Governance mount, but add a URL param for selection like Implementations does.

- Nav links in `components/SubNavbar.js`:
  `{ label: 'Schema Elements', path: \`${campusPrefix}/ati-explorer/schema-elements\` }`
  `{ label: 'Principles',      path: \`${campusPrefix}/ati-explorer/principles\` }`
- `WorkingGroupMasterContainer` nested `<Routes>` — add, each with an OPTIONAL selection param:
  ```jsx
  <Route path="schema-elements"            element={<SchemaElementMasterContainer />} />
  <Route path="schema-elements/:handle"    element={<SchemaElementMasterContainer />} />
  <Route path="principles"                 element={<PrincipleMasterContainer />} />
  <Route path="principles/:handle"         element={<PrincipleMasterContainer />} />
  ```
- **Effective URLs:** `/{campus}/ati-explorer/principles` (none selected) and
  `/{campus}/ati-explorer/principles/{handle}` (that principle open).
- **Selection comes from the URL param**, NOT in-memory state. The container reads `:handle` via
  `useParams()`, derives `selectedItem` from the loaded list by matching `handle`, and selecting an
  item is a `navigate()` to that item’s URL (not a `setState`). This is the key difference from
  Governance and the foundation that lets Phase 2’s trace-up be plain links. Use `handle` (the
  stable, human-meaningful identifier) as the URL key, not `unique_id`, so links are readable and
  deep-linking is durable.

---

## 3. Architecture pattern

Same container/presentational, master–detail, registry-driven shape as Governance, with the two
departures noted above.

- **Smart container per slice** (`SchemaElementMasterContainer`, `PrincipleMasterContainer`) owns
  the add/edit/delete FLOW state (`useDisclosure` for forms/pickers, `pendingType` for the add
  handoff) and reconciles after mutations. But it gets its DATA + `reload()` from
  **`useMetaScaffold()`** (the context), not from a local self-fetch — because the data is shared
  across slices and with Phase 2. After a mutation, call the context’s `reload()` then `navigate()`
  to reconcile selection (e.g. after delete, navigate to the first remaining item or the bare list).
- **Dumb presentational children** receive data + callbacks via props, exactly as Governance’s do.
- **Registries carry STRUCTURE ONLY.** `schemaElementTypes.js` and `principleTypes.js` define which
  fields exist, their input `type` (`text`/`textarea`/`date`), render order, and Chakra color
  tokens. They do **NOT** carry human descriptions — all prose comes from descriptors (§9). This is
  the §9/§10 rule from the governance doc, applied from day one.
- **Add flow:** SchemaElement is multi-`element_kind`, so it uses a two-step picker→form like
  Governance (pick `node_label`/`rel_type`/`field`, then fill). Principle is single-type, so its Add
  goes straight to the form (no picker).

---

## 4. The keystones: the two structural registries

### `schemaElementTypes.js`
- `SCHEMA_ELEMENT_KINDS` — keyed by `element_kind`:
  ```js
  { key, plural, colorScheme, fields: [ { name, label?, type, required? } ] }
  // label is OPTIONAL here; if omitted, the UI sources the label from the descriptor
  // (describeField) so prose stays in the descriptor layer.
  ```
  Kinds: `node_label`, `rel_type`, `field`. Shared field superset: `handle` (required, unique),
  `name`, `element_kind`. (`handle` examples: `label:Tool`, `rel:develops`, `field:Asset.scope`.)
- `SCHEMA_ELEMENT_KIND_ORDER = ['node_label','rel_type','field']`.
- Helpers: `getSchemaElementKindConfig`, `getSchemaElementKindColorScheme`.

### `principleTypes.js`
- Principle is a single node type, so this is light — one field schema, no multi-type split:
  ```js
  PRINCIPLE_FIELDS = [
    { name: 'handle',            type: 'text',     required: true },  // e.g. principle:closest-to-capacity
    { name: 'name',              type: 'text',     required: true },
    { name: 'description_short', type: 'textarea' },                  // concise statement (UI default)
    { name: 'description_full',  type: 'textarea' },                  // full rationale (the whole idea)
  ]
  ```
- A `PRINCIPLE_COLOR` token for the badge. Optionally a small `GROUNDING_KIND` enum
  (`law_grounded` | `theory_grounded` | `mixed`) used only for list grouping + `PrincipleSourceBadge`
  color — DERIVED from whether `derives_from` points at Governance vs IntellectualSource, not stored.

`fields` remains the FE/BE contract: the form renders one input per field by `type`; the detail
panel renders non-identity fields as rows; only `handle`/`name` are client-validated.

---

## 5. Component responsibilities & props

Mirror Governance’s component contracts. Deltas only:

**`*MasterContainer`** — reads `:handle` from `useParams()`; gets `{ items, loading, error, reload }`
for its slice from `useMetaScaffold()`; derives `selectedItem` by `items.find(handle === param)`;
`onSelect(item)` = `navigate(\`…/<slice>/${item.handle}\`)`. Add/edit/delete handlers call the
service then `reload()` then `navigate()` to reconcile.

**`*List`** — props `{ items, selectedHandle, onSelect(item), onAdd(), emptyMessage }`. Grouped
accordion (SchemaElement by `element_kind` per `SCHEMA_ELEMENT_KIND_ORDER`; Principle flat or by
derived grounding-kind). Local search filters across `handle`/`name` + descriptor text if available.

**`SchemaElementDetailPanel`** — props `{ item, onAfterEdit, onAfterDelete, placeholder }`. Header
(kind badge + `name` + Edit/Delete). Prose (the element’s meaning) via `describeNodeType` /
`describeField` from `useDescriptors()` — NOT from the registry. Then a **read-only "Shaped by"
section** listing the Principles whose `shapes` edge points at this element (backref from the item’s
serialized `shaped_by`), each a link to `…/principles/{principleHandle}`. (Determinations’ "Concerned
by" backref is Phase 2 — leave a comment placeholder.)

**`PrincipleDetailPanel`** — props `{ item, onAfterEdit, onAfterDelete, placeholder }`. Header
(source badge + `name` + Edit/Delete). `description_short` shown; `description_full` behind an
expand ("Full rationale"). Then **two `EntityAttachmentSelector` blocks**:
- **Grounded in** — attach/detach Governance nodes AND IntellectualSource nodes via `derives_from`.
  Candidate lists from `fetchAllGovernance()` + `fetchAllIntellectualSources()` (cached). This is the
  DOWN link toward law/theory.
- **Shapes** — attach/detach SchemaElement nodes via `shapes`. Candidates from
  `fetchAllSchemaElements()`. This is the ACROSS link to the schema.
Field labels/help sourced via `describeField('Principle', …)`. Delete via `window.confirm`. Embeds
`PrincipleForm` in edit mode.

**`*Form`** — props `{ isOpen, onClose, <kind for SchemaElement>, existingItem, onSaved(item) }`.
`isEditMode = Boolean(existingItem)`. Build `formData` from the registry fields; field LABELS/help
pulled from descriptors, inputs by `type`; trim + drop empties; require `handle`+`name`; call
update/create; `onSaved(response.data.item)`. (Relationship edges are managed in the DetailPanel via
`EntityAttachmentSelector`, NOT in the create form — mirror how Governance manages docs/webpages
post-create.)

**`SchemaElementForm` add** uses `SchemaElementTypePicker`-style step (or a `kind` select inside the
form). **Principle add** opens the form directly (single type).

**Badges** — `SchemaElementKindBadge` (per `element_kind`), `PrincipleSourceBadge` (derived
grounding-kind). Single source of color truth each.

---

## 6. Service layer (`services/api/`)

Mirror governance exactly: get/post/put via **axios**, delete via **fetch**; each returns
`response.data`; PUT carries an `action` for edge mutations, bare PUT for field updates.

| Function | Verb | Body | Returns |
|---|---|---|---|
| `fetchAllSchemaElements()` | GET | — | `.data.items` |
| `createSchemaElement(kind, fields)` | POST | `{ element_kind, ...fields }` | `.data.item` |
| `updateSchemaElement(handle, fields)` | PUT | `{ handle, ...fields }` | `.data.item` |
| `deleteSchemaElement(handle)` | DELETE | `{ handle }` | `.data` |
| `fetchAllPrinciples()` | GET | — | `.data.items` |
| `createPrinciple(fields)` | POST | `{ ...fields }` | `.data.item` |
| `updatePrinciple(handle, fields)` | PUT | `{ handle, ...fields }` | `.data.item` |
| `attach/detachGovernanceToPrinciple(principleHandle, governanceType, governanceId)` | PUT | `{ action:'attach_grounding'\|'detach_grounding', principle_handle, source_kind:'governance', governance_type, governance_unique_id }` | `.data.item` |
| `attach/detachSourceToPrinciple(principleHandle, sourceId)` | PUT | `{ action:'attach_grounding'\|'detach_grounding', principle_handle, source_kind:'intellectual_source', source_unique_id }` | `.data.item` |
| `attach/detachShapeToPrinciple(principleHandle, schemaElementHandle)` | PUT | `{ action:'attach_shape'\|'detach_shape', principle_handle, schema_element_handle }` | `.data.item` |
| `deletePrinciple(handle)` | DELETE | `{ handle }` | `.data` |
| `fetchAllIntellectualSources()` | GET | — | `.data.items` |

(Attach/detach wrappers over a private `_principleAttachDetach` helper in put.js, mirroring
`_governanceAttachDetach`.)

---

## 7. Backend contract

One MethodView per domain at `/schema-elements`, `/principles`, `/intellectual-sources`, registered
in `endpoints/data_api/__init__.py`. Same error ladder (`ValidationError→400`, `NotFoundError→404`,
`CrudError/Exception→500`) and `make_response` envelope as governance.

**SchemaElement** — GET `{ data:{ items:[…] } }`; POST `{ element_kind, ...fields }`→201; PUT
`{ handle, ...fields }`; DELETE `{ handle }`. Item via `_serialize_schema_element`:
```jsonc
{
  "element_kind": "node_label",        // node_label | rel_type | field
  "handle": "label:Tool",              // unique; URL + selection key
  "name": "Tool",
  "shaped_by": [ { "handle": "principle:…", "name": "…" } ]   // backref: Principles that shape this
  // (Phase 2 will add "concerned_by" for Determinations)
}
```

**Principle** — GET/POST/PUT/DELETE. PUT action-dispatch: `attach_grounding`/`detach_grounding`
(needs `principle_handle` + a governance or intellectual-source target) and
`attach_shape`/`detach_shape` (needs `principle_handle` + `schema_element_handle`); otherwise generic
update needs `handle` + fields. Item via `_serialize_principle`:
```jsonc
{
  "handle": "principle:closest-to-capacity",   // unique; URL + selection key
  "name": "…",
  "description_short": "…", "description_full": "…",
  "grounded_in": {
    "governance": [ { "type":"law", "unique_id":"…", "title":"…" } ],
    "intellectual_sources": [ { "unique_id":"…", "name":"…" } ]
  },
  "shapes": [ { "handle":"label:Tool", "name":"Tool", "element_kind":"node_label" } ]
}
```

**IntellectualSource** — GET/POST/PUT/DELETE; item `{ unique_id, name, description_short, description_full }`.

CRUD in `queries/<domain>/{create,read,update,delete}.py`. A single `_serialize_*` projector per
domain is the canonical item shape the FE consumes (mirrors `_serialize_governance_node`).

---

## 8. Data-flow walkthroughs

- **Load:** `MetaScaffoldContext` provider fetches SchemaElements + Principles (+ IntellectualSources)
  once on mount; containers read from it. `selectedItem` derived from `:handle` URL param.
- **Create (Principle):** `Add` → `PrincipleForm` → submit → `createPrinciple(fields)` → context
  `reload()` → `navigate(\`…/principles/${newHandle}\`)`.
- **Create (SchemaElement):** `Add` → kind pick → form → `createSchemaElement(kind, fields)` →
  `reload()` → navigate to new handle.
- **Edit:** DetailPanel `Edit` → `*Form` with `existingItem` → update → `reload()` → stay on
  `:handle`.
- **Delete:** confirm → delete → `reload()` → `navigate()` to first remaining item or bare list.
- **Attach grounding/shape:** `EntityAttachmentSelector` `onAttach`/`onDetach` → attach/detach
  service → `afterChange` → `reload()` so nested `grounded_in`/`shapes` (and the SchemaElement
  `shaped_by` backref) refresh. No inline-create for targets (Governance/Sources/SchemaElements are
  created in their own slices) — unlike governance’s inline DocumentForm.

---

## 9. Definitions & descriptions — descriptor context, never hardcode

Follow the governance doc §9/§10 rule from day one:

- **All human prose comes from `useDescriptors()`** (`hooks/useDescriptors.js`, provided by
  `context/DescriptorContext.js`). Use `describeNodeType('Principle')`, `describeNodeType('SchemaElement')`,
  `describeField('Principle','description_full')`, `describeFieldValue('element_kind','node_label')`,
  etc. Registries hold STRUCTURE only (fields, input types, order, colors); descriptors hold NAMES,
  LABELS, DESCRIPTIONS, HELP TEXT.
- **Seed the meta-layer’s OWN descriptors:** extend `app/database/tools/seed_descriptors.py` to seed
  `node_type:Principle`, `node_type:SchemaElement`, `node_type:IntellectualSource`, their fields, and
  the `element_kind` values. The scaffold is self-describing through the same descriptor layer it
  sits beside. (Descriptor-sourced text is empty until the seed runs.)
- Field/type labels in forms and detail rows should prefer the descriptor; fall back to a humanized
  field name only if no descriptor exists yet.

---

## 10. Conventions to reuse (same list as governance)

1. Registry = STRUCTURAL config only; prose via descriptor context.
2. Smart container (FLOW state) + dumb children; DATA via `useMetaScaffold()` context; `reload()` +
   `navigate()` to reconcile selection after every mutation.
3. One service function per verb, one REST resource; PUT carries `action` for edge mutations.
   axios(get/post/put)/fetch(delete) split.
4. Modal forms with `useDisclosure()`; `isEditMode = Boolean(existingItem)`; trim+drop-empty; toast;
   `onSaved`/`onAfter*` bubble to the container.
5. One MethodView per domain in `endpoints/data_api/__init__.py`; CRUD in `queries/<domain>/…`; a
   single `_serialize_*` projector per domain.
6. Reuse **`EntityAttachmentSelector`** for every relationship block (grounding, shapes).

---

## 11. Notes / gotchas

- **URL-driven selection is the intentional departure** from Governance’s in-memory selection, taken
  now so Phase 2’s trace-up is plain routing and so determinations/principles deep-link. Use `handle`
  (not `unique_id`) as the URL key for readable, durable links.
- **Context, not self-fetch** — mirror `DescriptorContext` (createContext + fetching provider + a
  `use*` hook, wired into `index.js`). The meta-layer is read across slices and by Phase 2.
- **No inline-create for relationship targets.** Governance creates Documents/Webpages inline;
  here, grounding (Governance/IntellectualSource) and shape (SchemaElement) targets are created in
  their own slices, so the attachment selectors only attach existing nodes.
- **Integrity is queryable later** (Phase 2+): a Principle with no `derives_from` (ungrounded) or one
  that `shapes` nothing (inert) are findable — leave the data shaped to allow it; don’t enforce at
  the form level yet.
- **Phase 2 hooks to leave in place:** `_serialize_schema_element` should reserve a `concerned_by`
  slot (Determinations); `SchemaElementDetailPanel` a placeholder for a "Concerned by" section; the
  `MetaScaffoldContext` should be easy to extend to also load Determinations.
- **MCP-mindedness (no MCP built now):** every read used here (`fetchAll*`, the by-handle lookups,
  the grounding/shapes traversals) is a bounded, read-only operation — the same set a future MCP
  server would expose as tools. Keep these as clean service functions / query helpers so the future
  MCP layer can call the same core without rework.

---

## 12. Acceptance checks

- Visiting `/{campus}/ati-explorer/principles/{handle}` opens that principle directly (deep-link
  works); selection is read from the URL, not in-memory.
- SchemaElement and Principle each list/create/edit/delete via their MethodView; items match the
  `_serialize_*` shapes.
- A Principle can attach/detach Governance, IntellectualSource (both via `derives_from`), and
  SchemaElement (`shapes`); the detail panel reflects changes after `reload()`.
- A SchemaElement detail panel shows its descriptor prose (from `useDescriptors`) AND the Principles
  that shape it (`shaped_by` backref), each linking to the principle’s URL.
- No human description string is hardcoded in `schemaElementTypes.js` / `principleTypes.js`; all
  prose resolves through the descriptor context (and `seed_descriptors.py` seeds the new meta-types).
- `MetaScaffoldContext` fetches once and is consumed by both containers; mutations call `reload()`.
- Phase 2 slots present: `concerned_by` reserved in the schema-element serializer; context trivially
  extensible to Determinations.