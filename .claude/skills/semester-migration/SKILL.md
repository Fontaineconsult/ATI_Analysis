---
name: semester-migration
description: Use when rolling the ATI Analysis app to a new academic year — creating the new AcademicYear node, duplicating YearSuccessEvidence (YSE) across all campuses with relationships intact, stubbing missing campuses, resetting admin review flags, and updating the frontend year defaults. Triggered by requests like "migrate to 2025-2026", "semester migration", "academic year rollover", "roll over to next year", "create new AY".
---

# Semester migration

Roll the ATI Analysis app to a new academic year. This procedure is idempotent — the Cypher skips any `year_identifier` that already exists, so re-running is safe.

## Preconditions

1. Ask the user for `OLD_YEAR` and `NEW_YEAR` (format `YYYY-YYYY`, e.g. `2024-2025` → `2025-2026`) if not supplied.
2. Confirm Neo4j is reachable — `.env.development` must define `DATABASE_URL` and `NEO4J_DATABASE`. The script loads them via `set_connection()` in `app/database/graph_schema.py`.
3. APOC must be installed on the Neo4j server — the Cypher uses `apoc.create.relationship` to copy edges.
4. Read the `ALL_CAMPUSES` constant near the top of `app/database/tools/create_new_ay_campus.py` and surface it to the user. If a campus has been added in Neo4j since the last migration but is not in this list, stop and prompt the user to add it before proceeding.

## Steps

### 1. Configure the migration script

In the `if __name__ == "__main__":` block at the bottom of
`app/database/tools/create_new_ay_campus.py`, set:
- `OLD_YEAR = "<OLD_YEAR>"`
- `NEW_YEAR = "<NEW_YEAR>"`

Do not modify any other line.

### 2. Run the migration

From the repo root:

```
python -m app.database.tools.create_new_ay_campus
```

`run_migration(OLD_YEAR, NEW_YEAR)` executes in this order:
1. `ensure_academic_year(new_year)` — creates the `AcademicYear` node if absent (idempotent).
2. `duplicate_year_success_evidence(old_year, new_year)` — for every YSE in the old year **whose tracked SuccessIndicator is not removed** (a retired indicator's evidence line ends in the year it was retired; history stays intact and visible in settings): creates a new node with `year_identifier = <NEW_YEAR> + substring(old_identifier, 9)`, copies its relationships (both directions) via APOC, connects the new node to the new `AcademicYear`. NOT copied: `evidence_in_year` (repointed); the episodic record-of-a-year edges `advances_yse` (Accomplishment), `about_yse` (ProgressUpdate), `addresses_evidence` (Query); and any edge whose other end is retired or no longer available — `depreciated` notes/documents/messages, `no_longer_exists` webpages, `abandoned` Plans, and inactive sources (`active = false`: departed Persons, expired TAAPs). Live standing context (`implements`, `is_evidence_for`, `furthers_yse`, `has_note`) carries forward.
3. `create_stub_yse_for_missing_campuses(new_year)` — creates `Not Started` stubs for every missing (campus, active-SI) pair, year-gated on `SuccessIndicator.introduced_in_year <= NEW_YEAR`. There is deliberately no campus-level count guard — the per-identifier existence check is the gate (a count heuristic could silently skip a campus whose carried-forward total matches the active-SI count while gated SIs still lack stubs).
4. `reset_year_workflow_fields(new_year)` — applies fresh-year defaults to the new year's YSEs: sets the booleans `administrative_review_complete`, `ready_for_admin_review`, `worked_on_in_current_year`, `will_work_on_next_year` to `false`; clears the scalars `administrative_review_completed_date`, `priority_level`, `documentation_status`, `resources_status`, `implementation_plan_status`, `admin_review_description`; and deletes all `admin_review_completed_by` edges. (The duplication step deliberately copies no scalar workflow fields — this makes the fresh-year reset explicit.)
5. `propagate_documentation_years_for(new_year)` — for every implementation that has YSE evidence in `new_year`, finds its `is_documented_by` rels whose `included_in_years` is a non-empty whitelist missing `new_year`, and appends `new_year`. Empty `included_in_years` lists (the default — "applies to all years") are left alone. Without this step, documentation tagged for the old year silently disappears from the master query for the new year. Idempotent.
6. `create_campus_plans_for_year(new_year)` — creates the `CampusPlan` + four `WorkingGroupPlan` nodes (web/pro/ins/ste) per campus for the new year. Idempotent.
7. `verify(new_year)` — prints YSE counts per campus.

Capture the full stdout. Surface the verification table to the user verbatim.

### 3. Verify DB state

From the `verify()` output, confirm:
- Each campus in `ALL_CAMPUSES` has YSE count `≥` the active `SuccessIndicator` count.
- No `NO CAMPUS` row appears — that would indicate a YSE without an `evidence_at_campus` edge, which is a failure worth investigating in Neo4j before proceeding.

If either check fails, stop and report to the user. Do not touch the frontend.

### 4. Update the frontend + vocabulary year references

Apply all six edits — all six or none:

1. `app/frontend/src/src/context/SettingsContext.js`
   Change the `currentAcademicYear` `useState(...)` default to `<NEW_YEAR>`.

2. `app/frontend/src/src/context/DataContext.js`
   Change the `selectedYear` `useState(...)` default to `<NEW_YEAR>`.

3. `app/frontend/src/src/App.js`
   Append `'<NEW_YEAR>'` to the `yearOptions` array. Do **not** remove any existing entries — historical years must remain selectable.

4. `app/frontend/src/src/services/report_constructor.js`
   Update the fallback literal `const academicYear = evidenceItem.currentAcademicYear || "<OLD_YEAR>";` to use `<NEW_YEAR>`. This is a defensive fallback for evidence items that carry no `currentAcademicYear`; leaving it stale silently pins those to the prior year.

5. `app/data_config.py`
   Append `"<NEW_YEAR>"` to the `academic_years` list (served to the frontend via `PUBLIC_VOCABULARIES` / the settings endpoint and shown in the glossary).

6. `app/frontend/src/src/styles/workingGroupIdentity.js`
   If any working group was staged `dashboard: false` pending this year's activation (com/gov were, pending 2026-2027), flip it to `true` and update the FE registry test expectations (`WORKING_GROUP_LIST` / `WORKING_GROUPS_ORDER` / `WG_DEFS` / `makeInitialWgState`). One-time per staged group — skip if none are staged.

### 5. Smoke test

- Restart the dev server.
- Load `/<campus>/dashboard/reports`. Confirm:
  - The year selector now lists `<NEW_YEAR>`.
  - `<NEW_YEAR>` is the default selection.
- Open any YSE report page. Stubbed YSEs will show status `Not Started` — that is expected.

## Rollback

- Partial failure: re-run step 2. The duplication Cypher skips any `year_identifier` that already exists (the `WHERE existing IS NULL` guard), so duplicates are not created.
- Full unwind: in Neo4j Browser, detach-delete every YSE connected to the new `AcademicYear` and delete the `AcademicYear` node:
  ```cypher
  MATCH (y:AcademicYear {name: $new_year})<-[:evidence_in_year]-(e:YearSuccessEvidence)
  DETACH DELETE e;
  MATCH (y:AcademicYear {name: $new_year}) DETACH DELETE y;
  ```
  Then revert the frontend edits.

## Files touched by this skill

Modified:
- `app/database/tools/create_new_ay_campus.py` (`OLD_YEAR` / `NEW_YEAR` in the `__main__` block)
- `app/frontend/src/src/context/SettingsContext.js` (`currentAcademicYear` default)
- `app/frontend/src/src/context/DataContext.js` (`selectedYear` default)
- `app/frontend/src/src/App.js` (`yearOptions` array, append-only)
- `app/frontend/src/src/services/report_constructor.js` (`academicYear` fallback literal)
- `app/data_config.py` (`academic_years` list, append-only)
- `app/frontend/src/src/styles/workingGroupIdentity.js` (staged `dashboard` flips, if any)

Referenced (read-only):
- `app/database/graph_schema.py` — `AcademicYear`, `YearSuccessEvidence`, `Campus`, `SuccessIndicator`, `StatusLevel`, `set_connection`
