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
4. Read `app/database/tools/create_new_ay_campus.py:17` and surface the current `ALL_CAMPUSES` list to the user. If a campus has been added in Neo4j since the last migration but is not in this list, stop and prompt the user to add it before proceeding.

## Steps

### 1. Configure the migration script

Edit `app/database/tools/create_new_ay_campus.py`:
- Line 238: `OLD_YEAR = "<OLD_YEAR>"`
- Line 239: `NEW_YEAR = "<NEW_YEAR>"`

Do not modify any other line.

### 2. Run the migration

From the repo root:

```
python -m app.database.tools.create_new_ay_campus
```

`run_migration(OLD_YEAR, NEW_YEAR)` executes in this order:
1. `ensure_academic_year(new_year)` — creates the `AcademicYear` node if absent (idempotent).
2. `duplicate_year_success_evidence(old_year, new_year)` — for every YSE in the old year: creates a new node with `year_identifier = <NEW_YEAR> + substring(old_identifier, 9)`, copies all non-`evidence_in_year` relationships (both directions) via APOC, connects the new node to the new `AcademicYear`.
3. `create_stub_yse_for_missing_campuses(new_year)` — for each campus in `ALL_CAMPUSES` that has fewer YSEs than the active `SuccessIndicator` count, creates `Not Started` stubs.
4. `reset_admin_review_for_year(new_year)` — sets `administrative_review_complete = false`, removes `administrative_review_completed_date`, and deletes all `admin_review_completed_by` edges for the new year's YSEs.
5. `propagate_documentation_years_for(new_year)` — for every implementation that has YSE evidence in `new_year`, finds its `is_documented_by` rels whose `included_in_years` is a non-empty whitelist missing `new_year`, and appends `new_year`. Empty `included_in_years` lists (the default — "applies to all years") are left alone. Without this step, documentation tagged for the old year silently disappears from the master query for the new year. Idempotent.
6. `create_campus_plans_for_year(new_year)` — creates the `CampusPlan` + three `WorkingGroupPlan` nodes per campus for the new year. Idempotent.
7. `verify(new_year)` — prints YSE counts per campus.

Capture the full stdout. Surface the verification table to the user verbatim.

### 3. Verify DB state

From the `verify()` output, confirm:
- Each campus in `ALL_CAMPUSES` has YSE count `≥` the active `SuccessIndicator` count.
- No `NO CAMPUS` row appears — that would indicate a YSE without an `evidence_at_campus` edge, which is a failure worth investigating in Neo4j before proceeding.

If either check fails, stop and report to the user. Do not touch the frontend.

### 4. Update the frontend year references

Apply all three edits — all three or none:

1. `app/frontend/src/src/context/SettingsContext.js:19`
   Change the `useState` default from the old year to `<NEW_YEAR>`.

2. `app/frontend/src/src/context/DataContext.js:33`
   Change the `useState` default from the old year to `<NEW_YEAR>`.

3. `app/frontend/src/src/App.js:88-94`
   Append `'<NEW_YEAR>'` to the `yearOptions` array. Do **not** remove any existing entries — historical years must remain selectable.

Do not touch `services/report_constructor.js`. It consumes `currentAcademicYear` from context and holds no year literals.

### 5. Smoke test

- Restart the dev server.
- Load `/<campus>/dashboard/reports`. Confirm:
  - The year selector now lists `<NEW_YEAR>`.
  - `<NEW_YEAR>` is the default selection.
- Open any YSE report page. Stubbed YSEs will show status `Not Started` — that is expected.

## Rollback

- Partial failure: re-run step 2. The Cypher at `app/database/tools/create_new_ay_campus.py:57` skips any `year_identifier` that already exists, so duplicates are not created.
- Full unwind: in Neo4j Browser, detach-delete every YSE connected to the new `AcademicYear` and delete the `AcademicYear` node:
  ```cypher
  MATCH (y:AcademicYear {name: $new_year})<-[:evidence_in_year]-(e:YearSuccessEvidence)
  DETACH DELETE e;
  MATCH (y:AcademicYear {name: $new_year}) DETACH DELETE y;
  ```
  Then revert the frontend edits.

## Files touched by this skill

Modified:
- `app/database/tools/create_new_ay_campus.py` (lines 238, 239)
- `app/frontend/src/src/context/SettingsContext.js` (line 19)
- `app/frontend/src/src/context/DataContext.js` (line 33)
- `app/frontend/src/src/App.js` (lines 88-94, append-only)

Referenced (read-only):
- `app/database/graph_schema.py` — `AcademicYear`, `YearSuccessEvidence`, `Campus`, `SuccessIndicator`, `StatusLevel`, `set_connection`
- `app/database/batch/new_ay_query.cypher` — standalone version of the duplication Cypher (not used by the orchestrator, kept for manual/ad-hoc use)
