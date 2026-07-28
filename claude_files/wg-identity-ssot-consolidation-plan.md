# Working-Group Identity: Single Front-End Source of Truth — Consolidation Plan

**Status:** proposed (validated against the code, 2026-07 — see "Validation" at bottom)
**Goal:** Make `app/frontend/src/src/styles/workingGroupIdentity.js` the **only** place the
front end hardcodes working-group (WG) identity. Every other component/util **derives** from
it. **Zero behavior change today** — the dashboard still shows exactly Web / Instructional
Materials / Procurement in the same order, colors, and routes. The payoff: adding or
activating a WG (Steering, Communication & Training `com`, Governance `gov`) later becomes a
**one-line edit** in the SSOT instead of a ~20-file sweep.

## Scope

**In scope:** consolidate all FE WG hardcoding onto one module; rewire every consumer to
derive from it; delete the duplicated maps; adopt the already-built generic
`WorkingGroupReportContainer` and retire the three per-WG report containers.

**Out of scope (explicit):**
- Backend WG *discovery* / serving the list over the API. The set stays hardcoded on the
  FE (in the SSOT) — the user's constraint. The SSOT still drives *querying* (DataContext
  fetches per slug).
- Active-year tab gating (com/gov are `introduced_in_year=2026-2027`, so they'd be empty
  tabs now). Handled today by `dashboard:false`; a real active-year signal is a later change.
- Steering as a dashboard tab — blocked by a backend endpoint gate
  (`evidence_campus.py` validates the slug against `working_group_names_web_query`, which
  omits `steering`). `dashboard:false` for Steering is load-bearing, not cosmetic.

**Guiding rule:** *Parity, not behavior change.* Every derived value MUST equal the current
hardcoded value. Reviewers verify derived == current.

---

## 1. The SSOT (`styles/workingGroupIdentity.js`)

Already exists and defines all 6 groups (`web, instructional-materials, procurement,
communication-training, governance, steering`) with `slug, code, name, dataKey, dashboard,
accent/accentDark/accentTint, colorScheme`. It is currently **imported by nothing** — P0 is
greenfield-safe.

### Fields to ADD (required by real consumers)

| Field | Why | Authoring note |
|---|---|---|
| `hex` | `campusPlanConfig.WG_ACCENT` and `IndicatorReportView.WG_DOT` need **raw hex** (inline SVG / print / email export), not a Chakra token. | **Author explicitly — do NOT derive from `accent`.** For the 3 dashboard WGs `hex` == the token's resolved value; for **Steering `hex` = `#354A7A`** (dark brand blue = `teal.700`), which is **NOT** the resolve of its `accent:'orange.500'`. |
| `trendKey` | `reportMetrics.WG_DEFS` reads year-over-year trends by this key. | Optional — at parity `trendKey === name`. Add for clarity or derive from `name`. |
| `campusPlanOrder` (or `priority`) | Campus-plan cards are **Steering-first**; the SSOT `ALL_ORDER` is Steering-**last**. Deriving order from `ALL_ORDER` reorders cards and breaks tests. | Explicit per-WG sort key for the campus plan (Steering=0, then Web, IM, Procurement). |
| `shortLabel` *(optional)* | `report_components/members.js` (`'Ins. M'/'Proc'/'Web'`) and `settings_components/Members.js` headers (`'Ins'/'Pro'`). | If omitted, these two keep local short-label maps (an accepted, documented GAP). |

### Parity values (author `hex` from this table)

| WG | slug | code | dataKey | name | accent token | **hex** | trendKey |
|---|---|---|---|---|---|---|---|
| Web | `web` | `web` | `web` | Web | `teal.500` | `#4966A4` | `Web` |
| Instr. Materials | `instructional-materials` | `ins` | `instructionalMaterials` | Instructional Materials | `purple.500` | `#635098` | `Instructional Materials` |
| Procurement | `procurement` | `pro` | `procurement` | Procurement | `coral.500` | `#DB5850` | `Procurement` |
| Steering | `steering` | `ste` | `steering` | Steering | `orange.500` (dormant) | **`#354A7A`** | n/a |

Token→hex confirmed via `theme.js` (`teal.500`=#4966A4, `purple.500`=#635098,
`coral.500`=#DB5850). For the 3 dashboard WGs the nav/GoalNavigator/reportMetrics token and
the campus-plan hex are the **same** color. Steering is the one intentional mismatch.

### Derived exports to ADD

- `makeInitialWgState()` → `Object.fromEntries(WORKING_GROUP_LIST.map(w => [w.dataKey, null]))`
  (DataContext initial state, WG keys only — caller merges non-WG keys).
- `REPORT_METRICS_WGS` → `WORKING_GROUP_LIST.map(w => ({ key: w.dataKey, name: w.name, trendKey: w.trendKey ?? w.name, accent: w.accent }))` (shape `reportMetrics.WG_DEFS` expects; keep the exported name `WG_DEFS` so its test keeps passing).
- `getWgHex(key)` → `getWorkingGroupIdentity(key).hex`.
- `CAMPUS_PLAN_ORDER` → `ALL_WORKING_GROUPS` sorted by `campusPlanOrder` (Steering-first).

Existing derived maps (`CODE_TO_SLUG, SLUG_TO_CODE, NAME_TO_CODE, CODE_TO_NAME,
SLUG_TO_DATAKEY, DATAKEY_TO_SLUG, WORKING_GROUP_LIST, WORKING_GROUPS_ORDER,
getWorkingGroupIdentity, getWorkingGroupAccent`) already cover most consumers.

### Hard constraints (from validation)

1. **Preserve `dataKey` strings exactly** (`web`/`instructionalMaterials`/`procurement`). ~12
   files index `data.<dataKey>` by fixed key; unchanged strings mean they keep working and
   need not ship lockstep with DataContext.
2. **Author `hex` explicitly** (Steering caveat above).
3. **Campus-plan order is explicit (`campusPlanOrder`), never `ALL_ORDER`.**

---

## 2. Phases (each independently shippable + reviewable)

### P0 — Harden the SSOT (no consumer changes)
- Add `hex`, `trendKey`, `campusPlanOrder`, optional `shortLabel`; add `makeInitialWgState`,
  `WG_DEFS`/`REPORT_METRICS_WGS`, `getWgHex`, `CAMPUS_PLAN_ORDER`.
- Add a **parity unit test** locking derived values to the table above (hex, tokens,
  dataKeys, order, dashboard set = 3).
- Safe: nothing imports the SSOT yet.

### P1 — DataContext (keystone; self-contained)
`context/DataContext.js`:
- `transformWorkingGroup` → `SLUG_TO_DATAKEY` (keep passthrough fallback).
- initial state → `{ ...makeInitialWgState(), indicators, implementations }` (preserve non-WG keys).
- both `Promise.all` blocks (`loadData` L~121, `refreshImplementations` L~224) →
  `WORKING_GROUP_LIST.map(w => fetchPrimaryData(w.slug, year, campus))` then reduce into
  `{ [w.dataKey]: result }`.
- `fetchPrimaryData` takes the **slug** — confirmed — so the list drives it directly.
- **No other file must change in this PR** (dataKeys preserved). Internal coupling only.

### P2 — Nav
- `components/SubNavbar.js`: allowlist → `WORKING_GROUPS_ORDER`; WG tab items derived from
  `WORKING_GROUP_LIST` (`label=name, path=/${campusPrefix}/dashboard/${slug}/goal/1,
  accent`). Non-WG items (Reports/Copy/Campus Plan/Settings) stay literal.
- `components/ati_explorer_containers/GoalNavigator.js`: replace local `WORKING_GROUPS` map
  with `getWorkingGroupIdentity(workingGroup)`; read `data[identity.dataKey]`.

### P3 — services/utils (collapse duplicated maps)
- `services/utils/tools.js` — 5 WG maps → SSOT: `getUrlFromCompositeKey`/
  `getGoalViewUrlFromCompositeKey`/`getReportUrlFromCompositeKey` = `CODE_TO_SLUG`;
  `workingGroupCodeFromName` (keys are slugs) = `SLUG_TO_CODE`; `workingGroupWebSafe` =
  `DATAKEY_TO_SLUG`. Keep each `|| input` fallback.
- `services/utils/copy_to_clipboard.js` — 2 code→slug maps → `CODE_TO_SLUG`; the `#354A7A`
  constant → `getWgHex('steering')`.
- `services/utils/workingGroupStatusReport.js` — `STATUS_REPORT_WORKING_GROUPS` derived
  (`key=dataKey, name, segment=slug`). `ReportMasterList.js` then needs no change.

### P4 — Report layer
- `report_components/reportMetrics.js` — `WG_DEFS` → `REPORT_METRICS_WGS` (keep export name).
- `report_components/ReportOverviewMasterContainer.js` — buttons + panels loop
  `WORKING_GROUP_LIST`; render `<WorkingGroupReportContainer data={data[w.dataKey]}
  name={w.name}/>`. **Delete** `WebReportContainer` / `InstructionalMaterialsReportContainer`
  / `ProcurementReportContainer` (generic is behavior-identical).
- `report_components/SuccessIndicatorReportTables.js` — code→slug=`CODE_TO_SLUG`; name→slug
  via identity; anchor/key maps derived; render loop over `WORKING_GROUP_LIST`. **Preserve
  its current section order (web→procurement→IM)** with an explicit order or accept the
  cosmetic change — decide and note in the PR.
- `report_components/atistats.js` — **dead/superseded** (header says unmounted). Delete, or
  derive if kept.
- `ati_explorer_containers/ApprovalMasterContainer.js` — slug→data switch →
  `data[getWorkingGroupIdentity(wg).dataKey]`.
- `PlansAndAccomplishments/PlansAccomplishmentsManager.js` — 3 `forEach` dataKey arrays →
  `WORKING_GROUP_LIST.map(w=>w.dataKey)`.
- `PlansAndAccomplishments/PlansList.jsx` — `WG_SECTIONS` derived (`key=slug, label=name`);
  **preserve current section order (procurement→web→IM)** or accept cosmetic change.
- `dashboard_components/WorkingGroupGoalsView.js` + `components/AtiExplorer.js` — empty
  checks → `WORKING_GROUP_LIST.every(w => !data[w.dataKey])`.

### P5 — Campus plan (highest risk)
`campus_plan_components/campusPlanConfig.js`:
- `WG_ACCENT` (name→hex) → derive from `ALL_WORKING_GROUPS` name + **`hex`** (Steering
  #354A7A). Keep the exported symbol name so tests resolve.
- `WG_ORDER` → **explicit `CAMPUS_PLAN_ORDER` (Steering-first)** — do NOT use `ALL_ORDER`.
- Keep `getWgAccent`/`orderWorkingGroupPlans` signatures.
- Update tests (below).

### P6 — Sweep + the 7 missed consumers
- `context/SettingsContext.js` — default `currentWorkingGroup` = `WORKING_GROUP_LIST[0].slug`.
- `report_components/IndicatorReportView.js` **L92** — `WG_DOT` name→hex → `getWgHex(name)`
  (**this is the second consumer that justifies the `hex` field**).
- `about_components/AtiOverview.js` — WG stats calculator (live duplicate of dead atistats).
- `settings_components/Members.js` — code→name + WG columns by name; short headers
  `'Ins'/'Pro'` stay local unless `shortLabel` added.
- `settings_components/EditIndividual.js` — WG-membership checkboxes → name list.
- `graph_components/people/PersonYseList.js` — code/name→display resolver → `CODE_TO_NAME` +
  identity.
- `report_components/members.js` — full-name→short abbrev `'Ins. M'/'Proc'` → `shortLabel`
  or documented local GAP.
- Final grep sweep for residual literals; delete now-dead duplicated maps.
- **Leave alone (prose/copy):** About-page tabs (`OverviewTab`, `CoreModelTab`,
  `AddingDataTab`, `PlansProgressTab`), `App.css` classnames. **Leave alone (pass-through):**
  `services/api/put.js` WG assign, `services/utils/indicatorReportExport.js`.

---

## 3. Tests to update

- `reportMetrics.test.js` — pins to `WG_DEFS` + length 3; **stays green** if the derivation
  yields the same 3 keys in order. Verify only.
- `campusPlanConfig.test.js` — asserts `WG_ACCENT` values + `orderWorkingGroupPlans` →
  `['Steering','Web','Instructional Materials','Procurement']`. Stays green **iff** WG_ORDER
  keeps Steering-first (hence `campusPlanOrder`, not `ALL_ORDER`).
- `CampusPlanContainer.test.js` — asserts 4 cards + **Steering-first** order. Same condition.
- Add the P0 SSOT parity test.

---

## 4. Risks & mitigations

| Risk | Mitigation |
|---|---|
| DataContext state-shape ripple | Preserve `dataKey` strings exactly → 12 fixed-key readers unaffected; DataContext changes are internal. |
| Color format (hex vs token) | Add authored `hex` field; Steering `#354A7A` ≠ its accent token. |
| Campus-plan reorder breaks tests | Explicit `campusPlanOrder` (Steering-first), never `ALL_ORDER`. |
| Report/plans section reorder | Preserve current explicit order or consciously accept cosmetic change. |
| Latent com/gov inclusion | Deriving campus order from `ALL_WORKING_GROUPS` would include com/gov — harmless now (no WGPs) but note it. |
| Short labels not in SSOT | Add `shortLabel` or accept 2 local maps (documented GAP). |

## 5. Definition of done

- `styles/workingGroupIdentity.js` is the only file with a hardcoded WG list/identity.
- Grep for WG literals in FE **logic** files returns only the SSOT (+ intentional
  prose/pass-through).
- All existing tests green; SSOT parity test added.
- No visual/behavioral diff on the dashboard, reports, plans, or campus plan.
- Adding a WG to the dashboard later = flip `dashboard:true` (+ author its `hex`) in one file.

---

## Validation (what a code-checking agent confirmed / corrected)

- SSOT is imported by nobody today → P0 safe. `fetchPrimaryData` takes the slug → DataContext
  derivation works. `dataKey`s are stable → no lockstep consumer changes with DataContext.
- **Required additions:** `hex` (campusPlanConfig **and** IndicatorReportView.WG_DOT);
  Steering `hex=#354A7A` must be authored, not derived from `orange.500`.
- **Must stay explicit:** campus-plan Steering-first order (else `CampusPlanContainer.test.js`
  + `campusPlanConfig.test.js` break and cards reorder).
- **7 consumers missed by the first pass** added to P6 (IndicatorReportView, AtiOverview,
  AtiExplorer, Members, EditIndividual, PersonYseList, members.js).
- **Single genuine data GAP:** short labels (`shortLabel` optional). **Single behavior risk:**
  Steering-first ordering. Otherwise every consumer derives with zero behavior change.
