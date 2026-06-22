# Ontology capability — plan & status

**Goal:** add capability around *improving, editing, and displaying the ontology* on top of the
ATI Cypher MCP server. Started from `app/database/cypher_runner/mcp/` (which we finished + tested
first — see "MCP server" below).

**Agreed scope (user decisions):**
- **Surface = Both.** MCP read/analysis tools as the engine *and* a frontend ontology browser, over a **shared backend**.
- **Write scope = descriptive-layer edits.** Author/edit `UniversalDescriptor` + `Principle` via the sanctioned `queries/` functions. **Not** structural code changes (no new node types/fields/vocab via this work).
- **Sequence = Engine → MCP read → Frontend browser → MCP edits.**

---

## Architecture (the keystone)

One shared engine, three consumers:

```
   app/database/queries/ontology/read.py   ◄── the keystone (DONE)
     introspect_schema()   pure: reflects the 54 neomodel classes (no DB)
     assemble_ontology()   joins UniversalDescriptor prose + shaping Principles by handle (DB)
     ontology_health()     drift + coverage from the same assembly (DB)
        │
        ├── MCP read feature   features/ontology.py            (DONE)
        ├── MCP write feature  (descriptors/principles)        (Phase 4 — TODO)
        └── Flask /ontology endpoint → React ontology browser  (Phase 3 — TODO)
```

**The two "ontologies":** *structural* (neomodel classes in `graph_schema.py` + vocab in `data_config.py`,
= source code, out of scope to edit here) vs *descriptive* (`UniversalDescriptor` + `Principle` +
`IntellectualSource`, = graph data with sanctioned CRUD, in scope). The MCP server is suited to the
descriptive layer.

---

## Phase status

| Phase | What | Status |
|---|---|---|
| 0 | Finish + test the MCP server itself | ✅ Done, live-verified (27 tools; on-prem DB OK on VPN) |
| 1 | Shared ontology engine | ✅ **DONE + live-verified** — 8/8 tests pass (6 unit + 2 integration) |
| 2 | MCP read tools + resource | ✅ **DONE + live-verified** — 30 tools; `describe_node_type`/`ontology_health`/resource all run live via FastMCP |
| 3 | Frontend ontology browser | ✅ **DONE** — `/ontology` endpoint live; React browser in Settings; `npm run build` green |
| 4 | MCP descriptive-layer edits | ✅ **DONE + live-verified** — 5 write tools, gated; all 5 exercised reversibly |

**Phase 4 files:** `cypher_runner/mcp/features/_appbootstrap.py` (shared lazy `ensure_app()`), `features/ontology_write.py`
(5 write-gated tools: `author_descriptor`, `update_descriptor`, `author_principle`, `attach_principle_shape`,
`detach_principle_shape`), registered in `features/__init__.py`. `features/ontology.py` refactored to use the shared
bootstrap. **Independence (one-way, in-process):** each tool only CALLS the sanctioned queries functions
(`create_descriptor`/`update_descriptor`/`create_principle`/`attach_shape`/`detach_shape`), imported INSIDE the tool
body after `ensure_app()`. No CRUD logic in the MCP package; the queries layer never imports MCP. Tools register ONLY
when `ATI_MCP_ALLOW_WRITE=true` (30 tools → 36). Verified live: create → update → author principle → attach → detach,
then deleted both throwaway nodes (`node_type:__MCPTEST__`, `principle:__mcptest__`) — graph restored.

**Phase 3 files:** backend `app/endpoints/data_api/ontology.py` (`OntologyAPI`, `GET /ontology` + `/ontology/health`)
registered in `endpoints/data_api/__init__.py`; `services/api/get.js` (`fetchOntology`, `fetchOntologyHealth`);
`graph_components/ontology/` (`ontologyConfig.js`, `OntologyStatStrip.js`, `OntologyList.js`, `OntologyDetailPanel.js`);
`settings_components/OntologyBrowser.js`; wired into `SettingsMasterContainer.js` under the **Ontology** menu
heading (Settings → Ontology → "Ontology Browser"). Diagnostic coverage/drift strip + master-detail. Endpoint
verified live (200, 54 node types / 85 rels / 18.7% coverage).

**Merge (single ontology section):** the old "Ontology Descriptions" flat-list section was merged INTO the browser
— `OntologyDescriptions.js` deleted, its Settings menu entry removed. Editing now happens IN CONTEXT inside the
browser: every node type / field / field value / relationship type has an edit affordance that opens the shared
`EditDescriptor` modal pre-scoped to that element (create if undescribed, edit if present, with Delete). `EditDescriptor`
was extended with a `presetTarget` prop (locks kind/target for in-context create) + a Delete action; the browser
refreshes silently after a save. `npm run build` green. **Not yet visually QA'd in a running browser.**

**First live health snapshot (2026-06-18):** overall description coverage **18.7%** — node_type 72.2% (39/54),
field_value 79.2% (38/48), field 4.2% (12/289, opt-in), rel_type 0% (0/85). **10 orphan descriptors** (real
drift: removed `SchemaElement` node, `presented_by`/`derives_from`/`shapes` described as fields not rels,
a `field_value` seeded with a display label). Principles: 13 total, 4 ungrounded, 12 inert. Two reverse-only
rel types (`remediates`, `uses_tool`) have no forward neomodel manager (edges created via Cypher by design).

---

## Files created / modified this work

**New (ontology capability):**
- `app/database/queries/ontology/__init__.py` — empty package init.
- `app/database/queries/ontology/read.py` — the engine (`introspect_schema` / `assemble_ontology` / `ontology_health`).
- `app/database/cypher_runner/mcp/features/ontology.py` — MCP feature (`ontology_overview`, `describe_node_type`, `ontology_health`, resource `ati-graph://ontology`).
- `tests/test_ontology_engine.py` — 6 unit + 2 integration tests.

**Modified:**
- `app/database/cypher_runner/mcp/features/__init__.py` — added `ontology` to `ALL_FEATURES`.

**From Phase 0 (MCP server finish):**
- `app/database/cypher_runner/mcp/README.md` — fixed stale venv path → `.venv`.
- `app/database/cypher_runner/run_query.py` — `NEO4J_DATABASE` default `ati` → `neo4j` (Aura alignment).
- `requirements-dev.txt` — added `mcp[cli]>=1.28`.

**Env / deps installed into `.venv`:** `mcp[cli]` 1.28.0, `pytest`, `pytest-flask`. (Note: `mcp` install
also upgraded anyio/cffi/pydantic/etc.; `create_app()` still boots fine.)

---

## RESUME RUNBOOK (after restart)

1. **Reconnect campus VPN** — the dev DB is on-prem `bolt://…@130.212.104.18:7687`, reachable only on VPN. Off VPN it times out (`WinError 10060`).
2. **Confirm DB reachable + MCP healthy:**
   ```bash
   python -m app.database.cypher_runner.mcp --check-db
   ```
   Expect `30 tool(s)` and `Neo4j connectivity: OK`.
3. **Run the Phase-1 engine tests (incl. the 2 integration tests):**
   ```bash
   python -m pytest tests/test_ontology_engine.py -v
   ```
   Expect 8 passed. (Unit-only without VPN: `pytest tests/test_ontology_engine.py -m unit` → 6 passed.)
4. **Live-exercise the Phase-2 MCP DB tools** (in-process is simplest):
   ```bash
   python -c "import asyncio,json; from app.database.cypher_runner.mcp.server import build_server
   async def m():
     mcp,ctx=build_server()
     for t,a in [('ontology_health',{}),('describe_node_type',{'label':'Interface'})]:
       out=await mcp.call_tool(t,a); print(t,'OK')
     ctx.executor.close()
   asyncio.run(m())"
   ```
5. If 1–4 are green → **mark Phase 1 + 2 complete, start Phase 3.**

---

## Phase 3 — Frontend ontology browser (next)

- **Backend:** new `app/endpoints/data_api/ontology.py` — `OntologyAPI` MethodView, read-only:
  `GET /ontology` → `assemble_ontology()`; `GET /ontology/health` → `ontology_health()`. Register URL
  rules at file bottom; add `ontology` to the eager import list in `endpoints/data_api/__init__.py`
  (it already eagerly imports all endpoint modules — that's the data_api warmup mechanism).
- **API service:** add `fetchOntology()` / `fetchOntologyHealth()` to `frontend/src/src/services/api/get.js`.
- **UI:** ontology browser under `frontend/src/src/components/.../graph_components/ontology/`, following
  `claude_files/design-sense.md` (stat-strip + 1:2 master-detail). Left = node types (tabs for
  relationship types / vocab); right = detail (fields, choices, descriptor prose, shaping principles).
  **Reuse** existing editors: `EditDescriptor.js`, `PrincipleDetailPanel.js`. Surface health/drift as
  stat-strip coverage % + "undescribed" badges.

## Phase 4 — MCP descriptive-layer edits (last)

- New write-gated tools in `features/ontology.py` (or a sibling), behind `ATI_MCP_ALLOW_WRITE`, wrapping
  the **sanctioned** functions — never raw Cypher:
  - `queries/descriptors/create.create_descriptor`, `queries/descriptors/update.update_descriptor`
  - `queries/principles/create.create_principle` + `update.attach_*/detach_*` (governance/source/shape)
  - `queries/intellectual_sources/create.create_intellectual_source`
- Reuse the same lazy `_ensure_app()` bootstrap already in `features/ontology.py`.

---

## Key design decisions & gotchas (don't relearn these)

- **Introspect the CLASSES, not the live DB.** `db.labels()` only shows labels with instance data; the
  ontology is defined by `graph_schema.py`. The engine reflects the classes via neomodel
  (`cls.defined_properties(...)`, rel `definition` dict + `_raw_class` for the target label, `choices`
  dicts, `base_property` for array choices).
- **Join by deterministic handle.** Descriptors/principles join to schema elements via
  `identifiers.make_{node_type,field,field_value,rel_type}_handle(...)`. This is the system's own design
  (unique index on `descriptor_handle`; `seed_descriptors.py` uses the same factory).
- **MCP server now (lazily) imports the app.** The ontology feature reaches the queries layer, so on the
  first DB-backed call it warms `data_api` (`import app.endpoints.data_api`) and configures neomodel
  (`graph_schema.set_connection()`). This is **lazy + isolated** — registry tools, the executor, and
  `--self-test` are unaffected; a failed app import is logged-and-skipped by `build_server`.
- **`app/database/tools/neomodelschema.py` is DEAD.** It's a stale orphaned copy of an old schema
  (misspelled `Proceedure`, `ATIRole`, `GenericNote`). It is **not** an introspection utility — ignore
  it; the engine builds introspection fresh. (Candidate for deletion later.)
- **`NEO4J_DATABASE`:** on-prem `.env.development` sets it to `ati` explicitly. Aura's default is `neo4j`
  (now the fallback default in both `run_query.py` and `web_config.py`).
- **Health coverage nuance:** `node_type` and `rel_type` are where full description coverage is the goal;
  `field` / `field_value` description is opt-in (salient elements only — `seed_descriptors.py` describes
  ~13 fields). Health reports all, but read the field gaps as informational, not a failing grade.

---

## Follow-on (2026-06-18)

- **Settings: merged the two ontology sections into one.** Deleted `OntologyDescriptions.js`; the
  Ontology Browser now edits descriptors IN CONTEXT (per node type / field / field value / rel type) via the
  shared `EditDescriptor` modal (extended with a `presetTarget` prop + Delete). Single Settings → Ontology entry.
- **Glossary sourced from the ontology.** `about_components/GlossaryTab.js` now reads node-type descriptions from
  `useDescriptors().describeNodeType(label)` (was hardcoded in `context/definitions.js`, now DELETED). Missing
  descriptions render an explicit "no description" marker. The legacy curated text was migrated INTO the ontology by
  `app/database/tools/seed_glossary_descriptors.py` (one-time: 5 created + 37 updated → node_type coverage 72%→81.5%).
  Two non-node-type concepts (Elevation signal, Trajectory) stay inline under "Derived concepts (not node types)".
  Vocab tables remain server-sourced.
- **Live refresh + description threading.** `EditDescriptor` now calls `useDescriptors().refreshDescriptors()`
  after create/update/delete, so the app-wide `DescriptorContext` refetches and every consumer (glossary, tooltips)
  updates without a page reload — closes the stale-cache gap (the "Class" issue: context was fetched once at app
  mount, pre-seed, and never refreshed). New reusable primitives in
  `components/functional_components/DescriptorHelp.js` — `useDescription`, `HelpTip` (ⓘ tooltip), `HelpBox` (inline
  help) — resolve `description_short` from the cached store by `nodeType` / `field` / `fieldValue` / `relType` /
  `handle` and render nothing when undescribed. Demo: a `HelpTip nodeType="UniversalDescriptor"` by the Ontology
  Browser title. **TODO: thread `HelpTip`/`HelpBox` through forms, badges, and headings app-wide.**
- **Implementations threaded (first area).** (1) `DescriptorContext.getNodeTypeDefinition` now prefers
  `description_short` (was `description_full` → the "Class representing…" docstrings showed in the implementations
  per-type definition card). (2) `tools/seed_implementation_field_descriptors.py` seeded the shared
  `field:Implementation.{title,description,dimensions,owned_by,participants,accountable_working_group}` +
  `rel_type:is_evidence_for` (the `field:Implementation.*` are VIRTUAL — the 7 impl types share these under a UI family
  label, so they show as `ontology_health` orphans by design). (3) `HelpTip`s threaded into the canon
  `graph_components/implementation/ImplementationsArea.jsx` (type buttons) and `ImplementationDetailPanel.jsx` (type
  badge + field labels + section headings), done by two parallel agents. Build green. Follow-on: surface the **Role**
  node's `.description` as a tooltip in `ParticipantsEditor` (Role text lives on the Role node, not the descriptor
  layer — needs a Tooltip wired to the roles data, not `HelpTip`).

_Last updated: 2026-06-18. **All four phases DONE + live-verified.** Engine (8/8 tests), MCP read (30 tools),
frontend browser (Settings → Ontology → Ontology Browser; build green), and MCP write tools (gated, reversibly
tested). Open items: visually QA the browser in a running app; optionally seed the surfaced gaps (15 undescribed
node types, 10 orphan descriptors, 12 inert principles) using the new tools / the descriptor editor._
