# Backend Working-Group SSOT — Consolidation Plan

**Status:** proposed (grounded in the code, 2026-07)
**Goal:** Make `app/data_config.py::WORKING_GROUP_DEFS` the **one backend source of truth** for
the working-group set. The five hand-maintained WG maps become **derived views** of it, so
adding a working group is a **single registry edit** — and the existing evidence query
(`GET /evidence/<wg>/<ay>?campus=`) accepts it automatically, assuming the graph has been
populated for it.

Mirrors the frontend `workingGroupIdentity.js` consolidation: harden the registry, derive
everything, pin parity with a test, change nothing else.

## Why this works with near-zero blast radius

The ~30 backend consumers import the five maps **by name** and only ever *read* them
(`working_group_names[x]` lookups, `for wg in working_groups` iteration, `x in
working_group_abbrevs` checks). If we keep each map's **name, type, shape, and order**
identical and only change how it is *built* (literal → derived-from-`WORKING_GROUP_DEFS`),
**every consumer keeps working untouched.** Blast radius = `data_config.py` + one new test.
`class_factory.py` re-exports these vocabularies from `data_config`, so the derived versions
flow through it unchanged.

## The query path is already generic

`app/endpoints/data_api/evidence_campus.py` (and `evidence.py`):

```python
if working_group not in working_group_names_web_query:      # gate
    return 400
results = fetch_evidence_for_working_group(
    working_group_names_web_query[working_group],           # slug -> canonical name
    academic_year, campus_abbreviation=campus)
```

Once `working_group_names_web_query` is derived from the SSOT, **this endpoint needs no
change**: a new registered `has_indicators` group appears in the gate map, its slug is
accepted, resolved to its name, and queried. The read "assumes the graph contains it" — it
returns that WG's data if authored, empty-200 if not. Exactly the requested behavior.

---

## 1. The SSOT: enrich `WORKING_GROUP_DEFS`

It already carries `abbrev, name, url_slug, has_indicators`. Add **one** flag so the
campus-plan set can also derive:

```python
WORKING_GROUP_DEFS = [
    {"abbrev": "web", "name": "Web",                             "url_slug": "web",                     "has_indicators": True,  "campus_plan": True},
    {"abbrev": "pro", "name": "Procurement",                     "url_slug": "procurement",             "has_indicators": True,  "campus_plan": True},
    {"abbrev": "ins", "name": "Instructional Materials",         "url_slug": "instructional-materials", "has_indicators": True,  "campus_plan": True},
    {"abbrev": "com", "name": "Communication & Training",        "url_slug": "communication-training",  "has_indicators": True,  "campus_plan": False},
    {"abbrev": "gov", "name": "Governance, Planning & Policies", "url_slug": "governance",              "has_indicators": True,  "campus_plan": False},
    {"abbrev": "ste", "name": "Steering",                        "url_slug": "steering",                "has_indicators": False, "campus_plan": True},
]
```

Two orthogonal flags fully describe today's inconsistent membership:
- `has_indicators` — carries Goals/SIs; appears in evidence/report vocab. (all but Steering)
- `campus_plan` — gets a per-campus WorkingGroupPlan. (all but com/gov)

## 2. Derive the five maps (exact parity)

| Map | Current members | Derivation | Reproduces |
|---|---|---|---|
| `working_group_names` | all 6, abbrev→name **and** name→name | `{d["abbrev"]: d["name"] for d} \| {d["name"]: d["name"] for d}` | all 6, both key forms |
| `compsite_key_wg_names` | web/pro/ins/com/gov, abbrev→abbrev **and** name→abbrev | for `has_indicators`: `{d["abbrev"]: d["abbrev"]} \| {d["name"]: d["abbrev"]}` | 5 groups, both key forms (no `ste`) |
| `working_group_names_web_query` | web/ins/pro/com/gov, slug→name | `{d["url_slug"]: d["name"] for has_indicators}` | 5 groups (no `ste`) |
| `working_groups` | `[Web, Procurement, Instructional Materials, Communication…, Governance…]` | `[d["name"] for has_indicators]` | same 5, **same order** |
| `working_group_abbrevs` | `("web","pro","ins","ste")` | `tuple(d["abbrev"] for campus_plan)` | same 4, **same order** |

`WORKING_GROUP_DEFS` order (web, pro, ins, com, gov, ste) is chosen so the two ordered
derivations (`working_groups`, `working_group_abbrevs`) come out byte-identical to today's
literals — **no export/report reordering** (unlike the FE, we preserve order exactly here).

Each map keeps its exported name, so `class_factory.py` and all consumers are untouched.

## 3. Parity test (the guardrail)

New `tests/test_working_group_registry.py` (pure unit, no DB) asserting each derived map
`== ` the exact literal it replaces — the current values, hard-coded in the test:

```python
def test_working_groups_list_unchanged():
    assert working_groups == ["Web", "Procurement", "Instructional Materials",
                              "Communication & Training", "Governance, Planning & Policies"]
def test_web_query_map_unchanged():
    assert working_group_names_web_query == {
        "web": "Web", "instructional-materials": "Instructional Materials",
        "procurement": "Procurement", "communication-training": "Communication & Training",
        "governance": "Governance, Planning & Policies"}
# ...and the other three maps, plus: every abbrev/name/slug is unique; has_indicators ⊆ all;
# campus_plan set == ("web","pro","ins","ste").
```

Green suite ⇒ "derived == old literal" ⇒ zero behavior change for all 30 consumers.

## 4. Also align `queries/committees/create.py`

`WORKING_GROUP_ABBREVS = working_group_abbrevs` already (imported). No change needed — it
now transitively derives from the SSOT. Verify its docstring/validation still reads cleanly.

## 5. Optional (recommended) — the endpoint gate reads self-documenting

No code change required, but optionally improve the 400 message to name the SSOT
(`one of {sorted(working_group_names_web_query)}`) so a bad slug points the caller at the
registry. Cosmetic.

---

## What "add a working group" becomes (end-to-end)

After this plan, the **config/code** cost of a new WG is:

1. **Backend:** one entry in `WORKING_GROUP_DEFS` (`app/data_config.py`). The five maps,
   the evidence endpoint gate, campus-plan creation, and the AY-rollover stub set all derive.
2. **Frontend:** one entry in `workingGroupIdentity.js` (+ `ALL_ORDER`), `dashboard: true`
   when ready. Everything derives (done in the FE consolidation).
3. **Data (irreducible):** author the graph — `seed_working_groups --apply` (node),
   `add_goal` (goals), `create_success_indicator` (SIs), then roll the year for YSEs.

The evidence query `GET /evidence/<slug>/<ay>?campus=` works the moment step 1 lands (returns
empty-200 until step 3 authors data). That is the "assume the graph has it if it's in the
SSOT" behavior.

**Cross-language note:** FE (`workingGroupIdentity.js`) and BE (`WORKING_GROUP_DEFS`) remain
two registries that must agree — an unavoidable JS/Python boundary. A future step could serve
`WORKING_GROUP_DEFS` (name/slug/has_indicators + an `active` flag) over `/settings` so the FE
derives the SET from the BE while keeping colors/order client-side; deferred per the decision
to keep the FE registry authoritative for presentation.

## Phases

- **B0 — Enrich + derive + test.** Add `campus_plan` to `WORKING_GROUP_DEFS`; replace the 5
  map literals with derivations; add `tests/test_working_group_registry.py`. One file + one
  test. No consumer changes.
- **B1 — Verify.** Run `pytest -m "not integration"` (identifier/registry units) + the api
  tests that hit the evidence endpoint; confirm the derived maps flow through `class_factory`.
- **B2 (optional) — Serve to FE.** Expose the registry via `PUBLIC_VOCABULARIES` / `/settings`
  for a future FE that derives the WG *set* from the BE. Deferred.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| A derived map's order differs from the literal (breaks export/report column order) | `WORKING_GROUP_DEFS` ordered so `working_groups`/`working_group_abbrevs` derive byte-identical; parity test asserts full equality incl. order |
| A consumer mutates a map (would now mutate a fresh derived object) | All ~30 consumers are read-only (verified); derivations produce standard dict/list/tuple |
| Membership drift between the two flags and reality | Parity test pins `has_indicators` and `campus_plan` sets to today's exact members |
| `class_factory` re-export breaks | It re-exports by name from `data_config`; names unchanged |

## Definition of done

- `WORKING_GROUP_DEFS` is the only place the backend WG set is written; the five maps are
  derived from it.
- `tests/test_working_group_registry.py` green; existing api/unit tests green.
- Adding a WG on the backend = one `WORKING_GROUP_DEFS` entry; the evidence query accepts it
  with no further backend edits.
