# Campus Plan Redesign v2 — Implementation Plan (draft)

Spec: `Downloads/ATI Analysis wireframes (1).zip` → `design_handoff_campus_plan/`
(`README.md` + authoritative prototype `Campus Plan v2.dc.html`).
Branch: `campus-plan-refactor-2` (at `44f4f61`, fresh off master; v1 discarded).

Single-page operational dashboard (no tabs). Keeps the `CampusPlanContainer` flow +
teal canon; replaces the accordion layout with a stat strip, a profile band, and four
working-group cards (**Steering, Web, Instructional Materials, Procurement**) whose
indicators are full-width table rows with inline expand, plus Query/Minutes modals.

---

## Guiding decisions

1. **Reuse the existing helpers/services; never re-derive tokens.** The repo already has
   exact matches for every color the spec names:
   - Maturity ramp → `services/utils/statusColors.js` `getStatusColor` (hexes are
     identical to the prototype's `.sl0–.sl5`). Use via existing `StatusProgression`.
   - Trajectory → `campusPlanConfig.js` `TRAJECTORY_CONFIG` / `getTrajectoryColorScheme`.
   - Plan status → `styles/planStatusColors.js` `getPlanStatusColorScheme`.
   - Query cat/status → `query_components/queriesConfig.js` `CATEGORY_META`/`STATUS_META`.
   - Minutes Markdown → `graph_components/common/Markdown.jsx`.
2. **Reuse existing form/detail sub-components inside new modal shells.** `QueryForm`,
   `QueryDetail`, `MeetingMinutesForm`, `MeetingMinutesDetail` already implement
   create/edit/settle/attach/notes against the services. Build only the compact list rows
   + modal chrome; wire modal bodies to the existing detail components.
3. **Data feeding — Option A (component-local self-load), Phase 1.** Queries and minutes
   are NOT in the campus-plan payload. Each WG card's footer fetches its own via
   `fetchQueryPanelForWorkingGroup(campus, year, wg)` and `fetchMinutesPanelForPlan(wgpId)`
   — the established pattern (existing `QueriesPanel`/`MeetingMinutesPanel` already self-load).
   No backend change for Phase 1. (Option B — embed into `_serialize_working_group_plan` for
   one round-trip — is a later optimization; it changes the campus-plan payload + tests.)
4. **Steering works in the UI today** because it's already in `working_group_plans[]`
   (`working_group === 'Steering'`, `-ste` identifier). Renders through the same card. The
   code-level fix (so create/rollover reproduce it) is Phase 2, not a blocker. See memory
   `steering-working-group-data-only`.
5. **Client-derived fields:** trajectory = `latestTrajectory(si)`; update age =
   `daysSince(si.progress.updates[0].update_date)`; `STALE_DAYS = 30` constant; risk =
   trajectory ∈ {at_risk, failing}.

---

## Data reconciliation (what's buildable now vs. backend gaps)

Buildable Phase 1 from `fetchCampusPlan` + the two panel reads: stat strip (all 5 tiles),
profile band, cross-campus control, 4 WG cards incl. Steering, indicator table
(key/name/maturity/trajectory/plans/age), expanded progress updates, Query modal core,
Minutes modal core (content as Markdown + attachments + notes).

Backend gaps (Phase 2; README flags all):
| # | Gap | Phase-1 fallback |
|---|---|---|
| G1 | Companion-plans table wants **Status + Year**; `_COMPANION_PLANS_FOR_WGP_QUERY` returns only `{unique_id,name,description}` | show name + View only |
| G2 | Minutes **Agenda / Decisions / Action items** — backend has only one Markdown `content` blob | render `content`; omit those 3 blocks |
| G3 | Query **discussion thread** (date/author/text) | render `notes[]` + `answer` (note: `notes` serialize lacks author today) |
| G4 | **Steering in code** (`data_config` + `WORKING_GROUP_ABBREVS`) so create/rollover build it | data already seeded; UI unaffected |

---

## Phase 1 — Frontend rebuild (no backend changes)

All paths under `app/frontend/src/src/`.

### 1.1 `campusPlanConfig.js` — extend config
- Add `STALE_DAYS = 30`.
- Add `WG_ORDER = ['Steering', 'Web', 'Instructional Materials', 'Procurement']`.
- Add `WG_ACCENT` map keyed by working-group name: Steering `#354A7A`, Web `#4966A4`,
  Instructional Materials `#635098`, Procurement `#DB5850`.
- Add helpers: `updateAgeDays(si)`, `isStale(si)`, `isAtRisk(si)`; extend
  `summarizeCampusPlan` to also return `staleCount` (and keep `atRisk`).

### 1.2 `CampusPlanStatStrip.jsx` — 5 tiles + filter
- Add 5th tile **"Stale > 30d"** (accent red.500, number red.600 when >0).
- Make **At-Risk** and **Stale** tiles clickable filters. Lift filter state to the
  container: props `activeFilter` ('all'|'risk'|'stale'), `onFilterChange`. Active tile gets
  a 2px teal ring (`box-shadow 0 0 0 2px #319795`). "Working Groups" help = "incl. Steering
  (oversight)".

### 1.3 `CampusPlanContainer.js` — page shell (heavy rework)
- Layout: `max-width 1280px`, centered, `padding 24px 24px 56px`, bg gray.50.
- Title row; stat strip (owns `indicatorFilter` state); **profile band** = one row, 3 cards
  (Executive Summary flex 2 / Sponsors flex 1 / President's Report flex 1) replacing the
  stacked Sections — reuse existing inline summary editor, `PersonAssignmentSelector` modal,
  and report link; sponsors stacked vertically (avatar+name row, title beneath).
- President's Report: missing → red alert + "Upload report".
- Cross-campus comparison: compact single-row card, existing `MenuOptionGroup` logic kept.
- Render WG cards ordered by `WG_ORDER`; pass down `indicatorFilter`.
- Host the Minutes/Query modals (`activeModal` state) OR let each card host its own
  (decide in 1.5). New page state: `indicatorFilter`, `expandedIndicators` (Set),
  `activeModal`, plus existing peer/summary state.

### 1.4 `WorkingGroupCard.jsx` (new) — replaces `WorkingGroupPlan.js` body
- Props: `wgp`, `campusAbbrev`, `campusName`, `academicYear`, `indicatorFilter`,
  `currentUserUniqueId`, `peerWorkingGroupPlans` (D2), refresh callbacks.
- Rebuild the deduped cross-campus indicator union (keyed by `composite_key`) from
  `WorkingGroupPlan.js:115` so each row can look up its peer counterparts.
- Card: white, 3px top accent (`WG_ACCENT[wgp.working_group]`).
- Header: 9px dot · name (17/700) · plan id (mono) · Leads (avatars+names inline) ·
  Manage → existing leads modal (`assignGroupLead`/`unassignGroupLead`).
- "PRIORITIZED INDICATORS (N)" + "+ Add Indicator" → existing `IndicatorSelectorModal`.
- Indicator table: header microlabels + `IndicatorRow` per SI, filtered by `indicatorFilter`.
  Grid: `56px minmax(240px,2fr) minmax(120px,205px) 76px 56px 40px 72px`. **Card always
  renders even when all rows filter out** (Steering → empty table + "+ Add Indicator").
- Footer: two columns — Queries (self-loaded) + Meeting Minutes (self-loaded).

### 1.5 `IndicatorRow.jsx` (new)
- Columns: Key (`composite_key`, mono) · **Name = View link** (`success_indicator`,
  `getGoalViewUrlFromCompositeKey(composite_key, campusAbbrev)`; wraps, never truncates;
  `stopPropagation` so it doesn't toggle expand) · Maturity (`StatusProgression`
  prev→curr) · Trajectory (`getTrajectoryColorScheme`/`Label`) · Plans
  (`companion_plans.length` → "N plans" teal / "no plan" red) · Upd (`updateAgeDays` →
  "Nd", red when >30) · Actions ("Log" → `ProgressUpdateModal` + caret).
- **Peer badges (D2)**: beneath the name (default D2b), render one chip per peer campus that
  prioritizes the same `composite_key` — campus abbrev + `StatusPill` for that campus's current
  level. Absent peers omitted. Data from `peerWorkingGroupPlans` matched by `composite_key`.
- Row click toggles expand (`expandedIndicators`). Expanded panel:
  - Progress updates list (`progress.updates`) + inline composer → `addProgressUpdate`.
  - Companion plans: table (name + View; **Status/Year deferred → G1**) or, when zero, red
    "No plans attached yet…" alert.

### 1.6 Query & Minutes — compact footer sections + modals
- `WgQueriesSection.jsx` (new): self-load via `fetchQueryPanelForWorkingGroup`; header
  "Queries (N)" + "+ New" (→ `QueryForm` create). Compact `qrow` per query (3px left border,
  green when settled) with category+status badges (`queriesConfig`) + "raised-by · date".
  Row click → **Query modal**.
- `WgMinutesSection.jsx` (new): self-load via `fetchMinutesPanelForPlan`; header "Meeting
  Minutes (N)" + "+ Add minutes" (→ `MeetingMinutesForm` create). Compact `mrow`
  (title · date · att count · ▸). Row click → **Minutes modal**.
- `QueryModal.jsx` / `MinutesModal.jsx` (new Chakra `Modal`, size 3xl / maxW 800px,
  `scrollBehavior="inside"`): header (title + badges/meta + WG dot) + body reusing
  `QueryDetail` / `MeetingMinutesDetail` + footer actions (settle/link-YSE; edit/delete).
  Agenda/Decisions/Action-items omitted in Phase 1 (G2).

### 1.7 Retire / adjust
- `WorkingGroupPlan.js` (487 lines) → superseded by 1.4/1.5. **Salvage the cross-campus
  peer-badge logic** (`:115` union + peer lookup) into `WorkingGroupCard`/`IndicatorRow` per
  D2 before deleting. `CampusPlanStatStrip`, `Card`, `Section`, `StatusProgression`,
  `IndicatorSelectorModal`, `ProgressUpdateModal`, `PersonAssignmentSelector`, `QueryForm/
  Detail`, `MeetingMinutesForm/Detail` all reused as-is.

---

## Phase 2 — Backend (net-new data; each independently shippable)

1. **Steering in code (G4)** — add `ste`/`Steering` to `data_config` (`working_group_names`,
   `compsite_key_wg_names`, `working_group_names_web_query` as needed) and
   `queries/committees/create.py WORKING_GROUP_ABBREVS`. ⚠ **Audit ripple first**:
   `working_groups` (the 3-list) is read by reports/other consumers — adding Steering there
   may change report output. Prefer a dedicated steering constant + explicit inclusion in
   `create_campus_plan`, not blanket addition to `working_groups`. Add a create test.
2. **Companion plan Status + Year (G1)** — extend `_COMPANION_PLANS_FOR_WGP_QUERY`
   (`queries/committees/read.py`) to return `plan_status` + plan year; surface in
   `companion_plans`. Deep-diff old vs new payload (memory `neomodel-defaults-vs-apoc-null`).
3. **Minutes structured fields (G2)** — add `agenda`, `decisions`, `action_items`
   (`{text, owner, done, due}`) to `MeetingMinutes` (schema + create/update + serialize) and
   `MeetingMinutesForm`/`Detail`. Largest item; optional.
4. **Query discussion (G3)** — surface note author in `_serialize_query` notes (currently
   `n.serialize()` only), or add a structured responses concept. Small.
5. **(Optional) `list_minutes_for_campus`** grouped read + FE wrapper to cut per-card fetches
   (parallels existing `list_queries_for_campus`).

---

## Phase 3 — Tests
- Frontend: rewrite `CampusPlanContainer.test.js` + `WorkingGroupPlan.test.js` (both change
  shape; per memory `frontend-test-axios-resetmocks` they're pre-existing-red and need a full
  inline axios mock + `beforeEach` impls). New tests: stat-strip filter toggle, indicator row
  expand/collapse, name-link navigation (no expand), modal open/close, Steering empty card.
- Backend (only if Phase 2 lands): create test for Steering WGP; read test for companion
  plan status/year; serialize test for minutes structured fields. Scope test data to sentinel
  year `9999-9999`.

---

## Risks / watchouts
- **Steering vocab ripple** (Phase 2.1) — don't blanket-add to `working_groups`; audit
  report/consumer code first.
- **Two color systems** already reconciled by existing helpers — use them; do not introduce
  `sfsuTheme` brand tokens here (campus-plan components use Chakra `teal`/`gray` defaults).
- **Fetch count** — Option A = up to 8 panel fetches/page (4 WG × queries+minutes), parallel
  and cache-warm; acceptable. Revisit with Option B if it drags.
- **Query category vocab** — real set is 5 (`policy_decision`, `resource_request`,
  `technical_clarification`, `risk_compliance`, `information_gap`), not the prototype's 4;
  use `queriesConfig`, not the prototype's inline map.

## Decisions (LOCKED)
- **D1. Data feeding = Option A** — component-local self-load per WG card; no backend change
  for queries/minutes in Phase 1.
- **D2. Peer badges = PORT** — reimplement the per-indicator cross-campus comparison badges in
  the new table (see §1.3–§1.5 peer-badge notes). Container keeps loading peer campus plans;
  the feature carries into the new row.
- **D3. First PR = Phase 1 only** — ship the new look on existing data with G1–G3 fallbacks;
  Phase 2 backend gaps as follow-up PRs.

### Remaining micro-decision
- **D2b. Peer-badge placement** — the prototype's fixed 7-col grid has no peer column. Default
  plan: render peer maturity chips (campus-abbrev + current StatusPill) **beneath the indicator
  name** in the name column (which already wraps), so the grid stays intact. Alt: surface them
  in the expanded row's "Across campuses" mini-section. Proceeding with the beneath-name default
  unless changed.
