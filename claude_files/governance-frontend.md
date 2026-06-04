# Governance — Frontend Implementation Breakdown

**Audience:** a Claude Code session building a NEW feature, using Governance as the reference
vertical slice to mirror. This describes the **frontend** of the governance domain end-to-end
(components, state, service layer) plus the **backend contract** the UI depends on.

Governance = the six rule/policy node types behind the ATI: **Law, Case, Directive, External
Policy, Memo, Guideline**. The UI is a master–detail CRUD explorer with a type-driven form and
document/webpage attachment.

---

## 1. File map

```
components/
  ati_explorer_containers/
    GovernanceMasterContainer.js     # TOP-LEVEL container: owns load + selection + add/edit/delete flow
    WorkingGroupMasterContainer.js   # routes "governance" -> GovernanceMasterContainer (line ~45)
  graph_components/governance/
    governanceTypes.js               # ⭐ KEYSTONE: the type registry (keys, labels, colors, field schema)
    GovernanceList.js                # left column: accordion grouped by type + search + "Add"
    GovernanceDetailPanel.js         # right column: read view + Edit/Delete + linked docs/webpages
    GovernanceForm.js                # type-aware modal form, drives BOTH create and edit
    GovernanceTypePicker.js          # step-1 of add flow: pick a type (6 cards)
    GovernanceTypeBadge.js           # colored pill for a type (single source of color truth)
services/api/
    get.js     fetchAllGovernance()
    post.js    createGovernance()
    put.js     updateGovernance(), attach/detach Document|Webpage to Governance
    delete.js  deleteGovernance()
components/functional_components/
    EntityAttachmentSelector.js      # REUSED generic attach/detach widget (not governance-specific)
components/graph_components/documentation/
    DocumentForm.js, WebsiteForm.js  # REUSED inline create forms for linked docs/webpages
```

**Backend (the contract):** `app/endpoints/data_api/governance.py` (MethodView at `/governance`),
`app/database/queries/governance/{create,read,update,delete}.py`.

---

## 2. Routing & how it mounts

- Nav link: `components/SubNavbar.js` → `{ label: 'Governance', path: \`${campusPrefix}/ati-explorer/governance\` }`.
- `App.js`: `<Route path="ati-explorer/*" element={<AtiExplorer />} />`.
- `AtiExplorer` → `WorkingGroupMasterContainer` holds the nested `<Routes>`:
  `<Route path="governance" element={<GovernanceMasterContainer />} />`.
- **Effective URL:** `/{campus}/ati-explorer/governance`. No URL param drives selection — selection
  is in-memory React state (unlike Implementations, which reads `:implementationType` from the URL).

---

## 3. Architecture pattern (mirror this for a new feature)

**Container / presentational split, master–detail, type-config-driven.**

- **One smart container** (`GovernanceMasterContainer`) owns ALL data + flow state and self-fetches
  on mount. It does NOT use a shared context — it calls `fetchAllGovernance()` directly and holds
  `items` locally. (Contrast: the Implementations feature reads from `DataContext`.) Choose per
  feature: self-contained list → local state; data shared across views → a context.
- **Dumb presentational children** (`GovernanceList`, `GovernanceForm`, `GovernanceTypePicker`,
  `GovernanceDetailPanel`, `GovernanceTypeBadge`) receive data + callbacks via props. Selection and
  the add handoff live in the parent so the children stay reusable.
- **A single type-config registry** (`governanceTypes.js`) is the keystone: list grouping, picker
  cards, form fields, detail rows, and badge colors ALL derive from it. Adding a 7th governance
  type = editing that one file; every component picks up the new shape automatically.
- **Two-step add flow:** `Add` → `GovernanceTypePicker` (choose type) → `GovernanceForm` (fill
  fields) → refresh + select the new item.

---

## 4. The keystone: `governanceTypes.js`

Exports:
- `GOVERNANCE_TYPES` — object keyed by backend type key. Each entry:
  ```js
  { key, label, plural, colorScheme, description, fields: [ { name, label, type, required? } ] }
  // field.type ∈ "text" | "textarea" | "date"; field.name === backend neomodel attribute
  ```
- `GOVERNANCE_TYPE_ORDER = ['law','case','directive','external_policy','memo','guideline']` — render order.
- Helpers: `getGovernanceTypeConfig(key)`, `getGovernanceTypeLabel(key)`, `getGovernanceTypeColorScheme(key)`.

`fields` is the contract between FE and backend: the form renders one input per field (by `type`),
the detail panel renders every non-`title` field as a labeled row, and only `title` is required/
validated client-side. Field sets differ per type (e.g. `case` has `ruling`; `law` has
`legislative_authority`/`relevant_sections`; `memo` has `authored_date`; `directive` has
`source_institution`).

---

## 5. Component responsibilities & props

**`GovernanceMasterContainer`** (no props) — state: `items`, `loading`, `error`, `selectedId`,
`pendingType`, two `useDisclosure()` (typePicker, createForm). `loadAll()` → `fetchAllGovernance()`
→ `response.data.items`. Handlers: `handleAddClick` (open picker), `handlePickType(typeKey)`
(picker→form), `handleCreated/handleEdited/handleDeleted` (reload + reconcile `selectedId`).
Renders the two-column `Flex` + `GovernanceTypePicker` + `GovernanceForm`.

**`GovernanceList`** — props `{ items, selectedId, onSelect(item), onAdd(), emptyMessage }`. Groups
`items` by `type` into a Chakra `Accordion` (one section per `GOVERNANCE_TYPE_ORDER` entry). Local
search filters across `title/description/legislative_authority/source_institution` and auto-expands
matching sections (`defaultIndex` keyed so re-search re-applies).

**`GovernanceDetailPanel`** — props `{ item, onAfterEdit(item), onAfterDelete(item), placeholder }`.
Null `item` → dashed placeholder. Renders header (badge + title + Edit/Delete), then every non-title
field as a row ("Not set" when empty). Two `EntityAttachmentSelector` blocks for **Linked Documents**
and **Linked Webpages** (attach/detach + inline "create new" via `DocumentForm`/`WebsiteForm` in
modals). Candidate lists fetched once (`fetchAllDocuments`/`fetchAllWebpages`) and cached. Uses
`UserContext` for `createdBy`. Delete uses `window.confirm`. Embeds `GovernanceForm` in edit mode.

**`GovernanceForm`** — props `{ isOpen, onClose, governanceType, existingItem, onSaved(item) }`.
`isEditMode = Boolean(existingItem)`; effective type from `existingItem.type` (edit) or
`governanceType` (create). Builds `formData` from `config.fields`, trims + drops empties on submit,
requires `title`, calls `updateGovernance` or `createGovernance`, then `onSaved(response.data.item)`.

**`GovernanceTypePicker`** — props `{ isOpen, onClose, onPick(typeKey) }`. 6 cards from the registry.

**`GovernanceTypeBadge`** — props `{ type, size }`. Colored pill; reused across list/detail/picker/form.

---

## 6. Service layer (`services/api/`)

All hit `${REACT_APP_API_URL}/governance`. get/post/put use **axios**; delete uses **fetch**
(codebase convention). Each returns `response.data` (the full envelope) and rethrows on error.

| Function | Verb | Body | Returns |
|---|---|---|---|
| `fetchAllGovernance()` | GET | — | envelope; items at `.data.items` |
| `createGovernance(type, fields)` | POST | `{ type, ...fields }` | `.data.item` |
| `updateGovernance(type, uniqueId, fields)` | PUT | `{ type, unique_id, ...fields }` | `.data.item` |
| `attach/detachDocumentToGovernance(type, govId, docId)` | PUT | `{ action:'attach_document'\|'detach_document', type, governance_unique_id, document_unique_id }` | `.data.item` |
| `attach/detachWebpageToGovernance(type, govId, pageId)` | PUT | `{ action:'attach_webpage'\|'detach_webpage', type, governance_unique_id, webpage_unique_id }` | `.data.item` |
| `deleteGovernance(type, uniqueId)` | DELETE | `{ type, unique_id }` | `.data` |

(The attach/detach four are thin wrappers over a private `_governanceAttachDetach` helper in put.js.)

---

## 7. Backend contract (`endpoints/data_api/governance.py`)

Single `GovernanceAPI` MethodView at `/governance` (GET/POST/PUT/DELETE). Standard error ladder:
`ValidationError→400`, `NotFoundError→404`, `CrudError/Exception→500`. Response envelope is
`make_response(status, data, error, message)` → `{ status, data, error, message }`.

- **GET** → `{ data: { items: [ <item>, ... ] } }`
- **POST** body `{ type, ...fields }` → 201 `{ data: { item } }`
- **PUT** — action-dispatch: if `action ∈ {attach_document, detach_document, attach_webpage,
  detach_webpage}` → needs `governance_unique_id` + `document_unique_id`/`webpage_unique_id`.
  Otherwise generic update needs `unique_id` + fields. Both → `{ data: { item } }`.
- **DELETE** body `{ type, unique_id }` → `{ data: { deleted: unique_id } }`.

**Item shape** (`_serialize_governance_node`) — the canonical object the whole FE consumes:
```jsonc
{
  "type": "law",                       // governance type key (drives the registry lookup)
  "unique_id": "…",                    // selection key throughout the UI
  "title": "…", "description": "…",
  "effective_date": "ISO|null", "last_updated": "ISO|null", "authored_date": "ISO|null",
  "relevant_sections": "…|null", "legislative_authority": "…|null",
  "ruling": "…|null", "source_institution": "…|null",
  "documents": [ { "unique_id", "name", "uri_path", "file_path" } ],
  "webpages":  [ { "unique_id", "name", "url" } ]
}
```
All type variants share this superset shape; fields absent on a type come back `null`. `type` is the
hinge between backend and the FE registry.

---

## 8. Data-flow walkthroughs

- **Load:** mount → `loadAll()` → `fetchAllGovernance()` → `items`; `selectedItem` derived by
  `items.find(unique_id === selectedId)`.
- **Create:** `Add` → picker `onPick(typeKey)` sets `pendingType`, opens form → submit →
  `createGovernance(type, cleanedFields)` → `handleCreated` reloads + selects new `unique_id`.
- **Edit:** DetailPanel `Edit` opens `GovernanceForm` with `existingItem` → `updateGovernance` →
  `onAfterEdit` reloads + keeps selection.
- **Delete:** DetailPanel confirm → `deleteGovernance` → `onAfterDelete` reloads + moves selection to
  first remaining item.
- **Attach doc/webpage:** `EntityAttachmentSelector` `onAttach`/`onDetach` → attach/detach service →
  `afterChange` → `onAfterEdit(item)` reloads so nested `documents`/`webpages` refresh. Inline create
  goes through `DocumentForm`/`WebsiteForm`, then auto-attaches the new node (matched by
  `uri_path`/`url`/`name` since the create endpoint returns success-only).

---

## 9. Conventions to reuse when building a NEW feature

1. **Type/config registry** for STRUCTURAL config only — field schema, input types, ordering,
   colors (mirror `governanceTypes.js`). Keep that in code. But **human-readable prose** (type/field
   names, descriptions, help text) should come from the **descriptor context**, not be hardcoded in
   the registry or a constants file — see §10.
2. **Smart container + dumb children**; selection & flow state in the container, data + callbacks
   down via props. Self-fetch with a `useCallback` `loadAll()`; reload after every mutation and
   reconcile `selectedId`.
3. **One service function per verb**, hitting one REST resource; PUT carries an `action` field for
   edge/relationship mutations (attach/detach), bare PUT for field updates. Match the existing
   axios(get/post/put)/fetch(delete) split.
4. **Modal forms** with `useDisclosure()`; `isEditMode = Boolean(existingItem)`; trim+drop-empty
   before submit; toast on success/failure; `onSaved`/`onAfter*` callbacks bubble to the container.
5. **Backend:** one MethodView per domain registered in `endpoints/data_api/__init__.py`; CRUD in
   `queries/<domain>/{create,read,update,delete}.py`; a single `_serialize_*` projector defines the
   item shape the FE depends on. (This mirrors the Interface/Asset/Descriptor slices too.)
6. Reuse cross-feature widgets: **`EntityAttachmentSelector`** for any many-to-many attach UI, and
   the documentation `DocumentForm`/`WebsiteForm` for linking docs/webpages.

## 10. Definitions & descriptions — use the descriptor context, never hardcode

The repo is migrating OFF hardcoded definition tables. The old `context/definitions.js` (a static
`{ name, description }` map of node types) has been **retired as a data source** — its consumers now
read from the **ontology descriptions layer** via a context manager. Build the new feature the same
way: source prose from context, not constants.

- **Use `useDescriptors()`** (`hooks/useDescriptors.js`, provided app-wide by
  `context/DescriptorContext.js` — fetched once on mount, exposes `loading`/`error`). Lookup helpers:
  - `describeNodeType(label)` → descriptor for `node_type:<Label>`
  - `describeField(label, field)` → `field:<Label>.<field>`
  - `describeFieldValue(field, value)` → `field_value:<field>.<value>`
  - `getDescriptor(handle)` / the `byHandle` map for direct lookup
  - `getNodeTypeDefinition(label)` → legacy `{ name, description }` shape — a **drop-in for the old
    `getDefinition`**; this is exactly how both `ImplementationMasterContainer`s were rewired off
    `definitions.js`.
  Each descriptor carries `title`, `description_short` (default UI text), `description_full` (rationale).
- **DB-backed & editable** in Settings → Ontology Descriptions (full CRUD), seeded by
  `app/database/tools/seed_descriptors.py`. Prose edits need no code change or redeploy.
- **Keep the split clear:** STRUCTURAL config (which fields exist, input type, order, colors) stays
  in a code registry like `governanceTypes.js`; PROSE (names, descriptions, tooltips) comes from
  descriptors. The governance type labels/descriptions currently still live in `governanceTypes.js`
  and could later be sourced via `describeNodeType('Law')` etc. — for a NEW feature, wire help text
  through the descriptor context from day one rather than adding another hardcoded table.
- **Dependency:** descriptor-sourced text is empty until `seed_descriptors.py` has run against the DB.

## 11. Notes / gotchas

- Governance is the cleanest **standalone self-fetching** example (local state, direct
  `fetchAllGovernance()`). If your new feature's data is needed across multiple views, prefer a React
  **context manager** (the `DescriptorContext` pattern: `createContext` + a provider that fetches +
  a `use*` hook in `hooks/`, wired into the provider tree in `index.js`) instead of self-fetch.
- The Webpage "URL stored in `name`, title in `url`" data wart is handled in `GovernanceDetailPanel`
  (`looksLikeUrl`). Watch for it if you render webpage links.
- Selection is in-memory only (no deep-linking to a specific governance item via URL).
- `colorScheme` values in the registry are Chakra color tokens; `GovernanceTypeBadge` is the only
  place that should render the chip.
