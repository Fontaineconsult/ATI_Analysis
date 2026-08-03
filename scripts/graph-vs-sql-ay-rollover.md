# Why the ATI System Runs on a Graph Database, Not SQL

## A worked comparison using our annual academic-year rollover

**Audience:** leadership evaluating the technology choice.
**Method:** take one real, business-critical job — the academic-year rollover we run
every summer (`app/database/tools/create_new_ay_campus.py`) — and show the same job
written against a relational (SQL) database. Both versions below do identical work.
Everything in the SQL version is a faithful, competently-written equivalent, not a
strawman.

---

## Executive summary

Every August we "roll over" the system to the new academic year: several hundred
evidence records are duplicated for the new year **with every connection they have
intact** — to indicators, campuses, status, reviewers, notes, metrics, plans,
accomplishments, progress updates, pending questions, and eight different kinds of
implementation work — then review flags are reset and new campus plans are stubbed out.

| | Graph (today) | SQL equivalent |
|---|---|---|
| Core "copy everything connected" step | **~55 lines, generic** — copies every connection type, including ones that don't exist yet | **13+ hand-written copy statements**, one per link table, every column typed out |
| When a new feature adds a new connection | Rollover needs **zero changes** — it copies "all relationships" by definition | Rollover **must be found and edited by hand** — or the new data silently vanishes at rollover |
| Failure mode if maintenance is missed | None — nothing to miss | **Silent data loss**, discovered months later mid-year |
| Tables/structures the ETL must know about | 0 (schema-free copy) | **~28 tables**, incl. 8 near-identical ones for implementation types |
| Business rules duplicated into the database layer | 0 | **3** (two identifier formats + the "empty year-list means all years" rule) |

The line counts are close (319 vs ~460). That is not the argument. The argument is
**what has to be maintained, by whom, and what breaks when it isn't**: the graph
version has one step that can never fall out of date; the SQL version has thirteen
steps that each must be updated in lockstep with every future feature, and forgetting
one does not throw an error — it quietly loses a year of somebody's work.

---

## 1. What the rollover actually does

1. **Create the new academic year** (if it doesn't exist).
2. **Duplicate every Year Success Evidence (YSE) record** from the old year into the
   new year — *including all of its connections*: which indicator it tracks, which
   campus it belongs to, its status, its notes, messages, metrics, assigned
   reviewers, the people implementing it, the plans that further it, the
   accomplishments that advance it, working-group progress annotations (with their
   dates/authors), progress updates, pending questions, and the evidence links from
   eight kinds of implementation records (processes, projects, procedures, services,
   guidance, tracking, internal policies, TAAPs) — each carrying a 0–3 "strength"
   rating. Retired implementations stay attached to history but do not carry forward.
3. **Stub records for any campus added since last year** (one per active indicator,
   status "Not Started").
4. **Reset administrative review** on the new year (flags off, sign-off links removed).
5. **Extend documentation year-whitelists**: documentation links curated with an
   explicit year list get the new year appended (links with an *empty* list mean
   "all years" and must be left alone).
6. **Create the new campus plans** (one per campus, each with its working-group
   sub-plans), then **verify** the counts.

---

## 2. How the graph version does step 2 — the whole trick in ~55 lines

This is the heart of the real script. Note what it does **not** contain: it never
names the connection types. "Copy everything except the year link, and don't carry
forward retired implementations" is expressed *directly*:

```cypher
MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(:AcademicYear {name: $old_year})
WITH e, $new_year + substring(e.year_identifier, $year_prefix_length) AS new_id
OPTIONAL MATCH (existing:YearSuccessEvidence {year_identifier: new_id})
WITH e, new_id, existing WHERE existing IS NULL          // idempotent: safe to re-run

CREATE (e2:YearSuccessEvidence {year_identifier: new_id, unique_id: randomUUID()})
// ...copy scalar properties...

// Copy EVERY outgoing connection (except the year pointer) — whatever its type,
// whatever data rides on it, including types added by features we haven't built yet.
CALL {
    WITH e, e2
    MATCH (e)-[rel_out]->(n) WHERE type(rel_out) <> 'evidence_in_year'
    CALL apoc.create.relationship(e2, type(rel_out), properties(rel_out), n) YIELD rel
    RETURN count(*) AS out
}
// Same for every incoming connection; retired implementations stay in history only.
CALL {
    WITH e, e2
    MATCH (n)-[rel_in]->(e)
    WHERE type(rel_in) <> 'evidence_in_year'
      AND NOT (type(rel_in) = 'is_evidence_for' AND coalesce(n.retired, false))
    CALL apoc.create.relationship(n, type(rel_in), properties(rel_in), e2) YIELD rel
    RETURN count(*) AS inc
}
MATCH (newYear:AcademicYear {name: $new_year})
MERGE (e2)-[:evidence_in_year]->(newYear)
```

When we added working-group progress annotations in spring, and progress updates,
and pending questions, and TAAP evidence links — **this code did not change**. It
was already copying them, because "all relationships" includes relationships
invented after it was written.

---

## 3. The same job in SQL

### 3a. What the relational model has to look like first

A graph edge is free; a SQL relationship is a table. To store what the app stores
today, the rollover ETL must know about **~28 tables**. The ones it reads or writes:

**Entity tables (14):** `academic_year`, `campus`, `success_indicator`,
`status_level`, `person`, `note`, `message`, `metric`, `accomplishment`, `plan`,
`working_group_plan`, `progress_update`, `query`, `campus_plan` — plus **8
near-identical implementation tables** (`process`, `project`, `procedure`,
`service`, `guidance`, `tracking`, `internal_policy`, `taap`), because SQL has no
good answer to "eight kinds of thing that all behave the same way here."

**The evidence table** — 1:1 links become foreign-key columns:

```sql
CREATE TABLE year_success_evidence (
    id                          bigserial PRIMARY KEY,
    year_identifier             text UNIQUE NOT NULL,
    academic_year_id            bigint NOT NULL REFERENCES academic_year(id),
    status_level_id             bigint REFERENCES status_level(id),
    campus_id                   bigint REFERENCES campus(id),
    indicator_id                bigint REFERENCES success_indicator(id),
    description                 text,
    status                      text,
    documentation_status        text,
    resources_status            text,
    implementation_plan_status  text,
    priority_level              text,
    administrative_review_complete       boolean DEFAULT false,
    administrative_review_completed_date date,
    admin_review_description    text,
    ready_for_admin_review      boolean DEFAULT false,
    worked_on_in_current_year   boolean DEFAULT false,
    will_work_on_next_year      boolean DEFAULT false,
    created_at                  timestamptz,
    updated_at                  timestamptz
);
```

**Link tables (13) — every many-to-many connection becomes one**, and connection
*data* becomes columns:

```sql
CREATE TABLE yse_note              (yse_id bigint REFERENCES year_success_evidence(id), note_id    bigint REFERENCES note(id),    PRIMARY KEY (yse_id, note_id));
CREATE TABLE yse_message           (yse_id bigint REFERENCES year_success_evidence(id), message_id bigint REFERENCES message(id), PRIMARY KEY (yse_id, message_id));
CREATE TABLE yse_metric            (yse_id bigint REFERENCES year_success_evidence(id), metric_id  bigint REFERENCES metric(id),  PRIMARY KEY (yse_id, metric_id));
CREATE TABLE yse_admin_reviewer    (yse_id bigint REFERENCES year_success_evidence(id), person_id  bigint REFERENCES person(id),  PRIMARY KEY (yse_id, person_id));
CREATE TABLE yse_assigned_reviewer (yse_id bigint REFERENCES year_success_evidence(id), person_id  bigint REFERENCES person(id),  PRIMARY KEY (yse_id, person_id));
CREATE TABLE yse_admin_review_note (yse_id bigint REFERENCES year_success_evidence(id), note_id    bigint REFERENCES note(id),    PRIMARY KEY (yse_id, note_id));
CREATE TABLE yse_implementer       (yse_id bigint REFERENCES year_success_evidence(id), person_id  bigint REFERENCES person(id),  PRIMARY KEY (yse_id, person_id));
CREATE TABLE accomplishment_advances_yse (accomplishment_id bigint REFERENCES accomplishment(id), yse_id bigint REFERENCES year_success_evidence(id), PRIMARY KEY (accomplishment_id, yse_id));
CREATE TABLE plan_furthers_yse           (plan_id bigint REFERENCES plan(id),                     yse_id bigint REFERENCES year_success_evidence(id), PRIMARY KEY (plan_id, yse_id));
CREATE TABLE progress_update_about_yse   (progress_update_id bigint REFERENCES progress_update(id), yse_id bigint REFERENCES year_success_evidence(id), PRIMARY KEY (progress_update_id, yse_id));
CREATE TABLE query_addresses_yse         (query_id bigint REFERENCES query(id),                   yse_id bigint REFERENCES year_success_evidence(id), PRIMARY KEY (query_id, yse_id));

-- Connection that carries data: working-group progress annotations
CREATE TABLE wgp_yse_progress (
    wgp_id       bigint REFERENCES working_group_plan(id),
    yse_id       bigint REFERENCES year_success_evidence(id),
    update_date  date,
    update_note  text,
    updated_by   text,
    PRIMARY KEY (wgp_id, yse_id)
);

-- The polymorphic one. Eight implementation types → either eight more link tables,
-- or this: a type-discriminator column and NO foreign key on impl_id. The database
-- can no longer guarantee these rows point at anything real.
CREATE TABLE evidence_link (
    id        bigserial PRIMARY KEY,
    impl_type text   NOT NULL CHECK (impl_type IN ('process','project','procedure',
                     'service','guidance','tracking','internal_policy','taap')),
    impl_id   bigint NOT NULL,          -- ← unenforceable
    yse_id    bigint NOT NULL REFERENCES year_success_evidence(id),
    strength  int    CHECK (strength BETWEEN 0 AND 3)
);

-- Documentation links: polymorphic on BOTH ends, and the per-link year lists
-- explode into two more side tables.
CREATE TABLE impl_documentation_link (
    id            bigserial PRIMARY KEY,
    impl_type     text NOT NULL,
    impl_id       bigint NOT NULL,      -- ← unenforceable
    target_type   text NOT NULL CHECK (target_type IN ('document','webpage','note','message')),
    target_id     bigint NOT NULL,      -- ← unenforceable
    added_date    date,
    modified_date date,
    added_by      text
);
CREATE TABLE impl_doc_included_year (link_id bigint REFERENCES impl_documentation_link(id), year_name text, PRIMARY KEY (link_id, year_name));
CREATE TABLE impl_doc_excluded_year (link_id bigint REFERENCES impl_documentation_link(id), year_name text, PRIMARY KEY (link_id, year_name));
```

That's the *starting* cost, before the ETL is written. In the graph, all of the
above is simply "nodes can be connected, and connections can carry data."

### 3b. The ETL itself

```sql
------------------------------------------------------------------------------
-- Academic-year rollover, SQL edition.       Params: :old_year, :new_year,
-- :year_prefix_length (the identifier's "YYYY-YYYY" prefix width)
------------------------------------------------------------------------------
BEGIN;

-- STEP 1: ensure the academic year exists ------------------------------------
INSERT INTO academic_year (name) VALUES (:new_year)
ON CONFLICT (name) DO NOTHING;

-- STEP 2: duplicate every YSE record from the old year -----------------------
-- 2a. Build an old-id → new-identifier map, skipping already-migrated rows.
CREATE TEMP TABLE yse_map ON COMMIT DROP AS
SELECT e.id AS old_id,
       :new_year || substring(e.year_identifier FROM :year_prefix_length + 1)
           AS new_identifier
FROM year_success_evidence e
JOIN academic_year oy ON oy.id = e.academic_year_id
WHERE oy.name = :old_year
  AND NOT EXISTS (
      SELECT 1 FROM year_success_evidence dup
      WHERE dup.year_identifier =
            :new_year || substring(e.year_identifier FROM :year_prefix_length + 1));

ALTER TABLE yse_map ADD COLUMN new_id bigint;

-- 2b. Clone the rows. EVERY column typed out by hand; add a column to the
--     evidence table next year and forget to add it here → it silently
--     arrives NULL in every subsequent year.
WITH inserted AS (
    INSERT INTO year_success_evidence
        (year_identifier, academic_year_id, status_level_id, campus_id,
         indicator_id, description, status, documentation_status,
         resources_status, implementation_plan_status, priority_level,
         worked_on_in_current_year, will_work_on_next_year,
         created_at, updated_at)
    SELECT m.new_identifier, ny.id, e.status_level_id, e.campus_id,
           e.indicator_id, e.description, e.status, e.documentation_status,
           e.resources_status, e.implementation_plan_status, e.priority_level,
           e.worked_on_in_current_year, e.will_work_on_next_year,
           e.created_at, e.updated_at
    FROM yse_map m
    JOIN year_success_evidence e ON e.id = m.old_id
    JOIN academic_year ny ON ny.name = :new_year
    RETURNING id, year_identifier
)
UPDATE yse_map m SET new_id = i.id
FROM inserted i WHERE i.year_identifier = m.new_identifier;

-- 2c. Carry forward every connection. In the graph this is ONE generic
--     operation. Here it is one hand-written statement PER LINK TABLE.
--     This list must be kept in sync with the schema forever. A statement
--     missing from this list does not error — the data just doesn't
--     roll forward, and nobody finds out until mid-year.

INSERT INTO yse_note (yse_id, note_id)
SELECT m.new_id, j.note_id
FROM yse_note j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO yse_message (yse_id, message_id)
SELECT m.new_id, j.message_id
FROM yse_message j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO yse_metric (yse_id, metric_id)
SELECT m.new_id, j.metric_id
FROM yse_metric j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO yse_assigned_reviewer (yse_id, person_id)
SELECT m.new_id, j.person_id
FROM yse_assigned_reviewer j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO yse_admin_review_note (yse_id, note_id)
SELECT m.new_id, j.note_id
FROM yse_admin_review_note j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO yse_implementer (yse_id, person_id)
SELECT m.new_id, j.person_id
FROM yse_implementer j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO accomplishment_advances_yse (accomplishment_id, yse_id)
SELECT j.accomplishment_id, m.new_id
FROM accomplishment_advances_yse j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO plan_furthers_yse (plan_id, yse_id)
SELECT j.plan_id, m.new_id
FROM plan_furthers_yse j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO progress_update_about_yse (progress_update_id, yse_id)
SELECT j.progress_update_id, m.new_id
FROM progress_update_about_yse j JOIN yse_map m ON m.old_id = j.yse_id;

INSERT INTO query_addresses_yse (query_id, yse_id)
SELECT j.query_id, m.new_id
FROM query_addresses_yse j JOIN yse_map m ON m.old_id = j.yse_id;

-- Link tables that carry data: every payload column enumerated again.
INSERT INTO wgp_yse_progress (wgp_id, yse_id, update_date, update_note, updated_by)
SELECT j.wgp_id, m.new_id, j.update_date, j.update_note, j.updated_by
FROM wgp_yse_progress j JOIN yse_map m ON m.old_id = j.yse_id;

-- The polymorphic evidence links. "Retired implementations don't carry
-- forward" — one line in the graph — becomes an 8-way EXISTS ladder,
-- because the row can't tell us what table it points into.
INSERT INTO evidence_link (impl_type, impl_id, yse_id, strength)
SELECT el.impl_type, el.impl_id, m.new_id, el.strength
FROM evidence_link el
JOIN yse_map m ON m.old_id = el.yse_id
WHERE NOT (el.impl_type = 'process'         AND EXISTS (SELECT 1 FROM process i         WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'project'         AND EXISTS (SELECT 1 FROM project i         WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'procedure'       AND EXISTS (SELECT 1 FROM procedure i       WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'service'         AND EXISTS (SELECT 1 FROM service i         WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'guidance'        AND EXISTS (SELECT 1 FROM guidance i        WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'tracking'        AND EXISTS (SELECT 1 FROM tracking i        WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'internal_policy' AND EXISTS (SELECT 1 FROM internal_policy i WHERE i.id = el.impl_id AND i.retired))
  AND NOT (el.impl_type = 'taap'            AND EXISTS (SELECT 1 FROM taap i            WHERE i.id = el.impl_id AND i.retired));

-- ⚠ MAINTENANCE CONTRACT: any feature that adds a new link table referencing
-- year_success_evidence MUST add a copy statement above. There is no error,
-- test, or constraint that catches the omission.

-- STEP 3: stub records for campuses missing the new year ---------------------
-- Note: the identifier format here is a SECOND COPY of application logic
-- (make_yse_identifier in Python). If the app changes the format, this
-- script corrupts identifiers until someone notices the drift.
INSERT INTO year_success_evidence
    (year_identifier, academic_year_id, status_level_id, campus_id, indicator_id)
SELECT :new_year || '-' || si.composite_key || '-' || c.abbreviation,
       ny.id, sl.id, c.id, si.id
FROM campus c
CROSS JOIN success_indicator si
JOIN academic_year ny ON ny.name = :new_year
JOIN status_level sl  ON sl.status_level = 'Not Started'
WHERE c.abbreviation IN ('sfsu', 'ssu', 'csueb')
  AND NOT coalesce(si.removed, false)
  AND NOT EXISTS (
      SELECT 1 FROM year_success_evidence e
      WHERE e.year_identifier =
            :new_year || '-' || si.composite_key || '-' || c.abbreviation);

-- STEP 4: reset administrative review on the new year ------------------------
UPDATE year_success_evidence e
SET administrative_review_complete = false,
    administrative_review_completed_date = NULL
FROM academic_year y
WHERE y.id = e.academic_year_id AND y.name = :new_year;

DELETE FROM yse_admin_reviewer r
USING year_success_evidence e
JOIN academic_year y ON y.id = e.academic_year_id
WHERE r.yse_id = e.id AND y.name = :new_year;

-- STEP 5: extend documentation year-whitelists --------------------------------
-- Business rule: an EMPTY whitelist means "applies to all years" and must be
-- left alone; a NON-empty whitelist gets the new year appended. That rule now
-- lives here AND in every report query that reads these tables.
INSERT INTO impl_doc_included_year (link_id, year_name)
SELECT DISTINCT dl.id, :new_year
FROM impl_documentation_link dl
WHERE EXISTS (SELECT 1 FROM impl_doc_included_year iy
              WHERE iy.link_id = dl.id)                      -- non-empty only
  AND NOT EXISTS (SELECT 1 FROM impl_doc_included_year iy
                  WHERE iy.link_id = dl.id
                    AND iy.year_name = :new_year)            -- idempotent
  AND EXISTS (                                               -- impl is active in the new year
      SELECT 1
      FROM evidence_link el
      JOIN year_success_evidence e ON e.id = el.yse_id
      JOIN academic_year y         ON y.id = e.academic_year_id
      WHERE el.impl_type = dl.impl_type                      -- polymorphic join,
        AND el.impl_id   = dl.impl_id                        -- no FK integrity
        AND y.name = :new_year);

-- STEP 6: create campus plans + working-group sub-plans ----------------------
-- (make_campus_plan_identifier duplicated from Python — third copy of
-- application logic living in the database layer.)
INSERT INTO campus_plan (plan_identifier, campus_id, academic_year_id)
SELECT :new_year || '-' || c.abbreviation, c.id, ny.id
FROM campus c
JOIN academic_year ny ON ny.name = :new_year
WHERE c.abbreviation IN ('sfsu', 'ssu', 'csueb')
  AND NOT EXISTS (SELECT 1 FROM campus_plan cp
                  WHERE cp.plan_identifier = :new_year || '-' || c.abbreviation);

INSERT INTO working_group_plan (plan_identifier, campus_plan_id, working_group_id)
SELECT cp.plan_identifier || '-' || wg.suffix, cp.id, wg.id
FROM campus_plan cp
JOIN academic_year ny ON ny.id = cp.academic_year_id AND ny.name = :new_year
CROSS JOIN ati_working_group wg
WHERE NOT EXISTS (SELECT 1 FROM working_group_plan wgp
                  WHERE wgp.plan_identifier = cp.plan_identifier || '-' || wg.suffix);

-- STEP 7: verify ---------------------------------------------------------------
SELECT coalesce(c.abbreviation, 'NO CAMPUS') AS campus, count(*) AS yse_count
FROM year_success_evidence e
JOIN academic_year y ON y.id = e.academic_year_id AND y.name = :new_year
LEFT JOIN campus c   ON c.id = e.campus_id
GROUP BY 1 ORDER BY 1;

COMMIT;
```

---

## 4. The scorecard

| Metric | Graph (real script) | SQL equivalent |
|---|---|---|
| Total length | 319 lines (incl. logging, comments, verification) | ~300 lines ETL + ~130 lines of schema the ETL depends on |
| "Copy connected data" step | 1 generic operation (~55 lines) | 13 enumerated statements + an id-remapping temp table |
| Knows which connection types exist? | **No — and doesn't need to** | Yes — all 13, with every column, forever |
| New connection type added by a feature | Carried forward automatically | ETL edit required; omission = **silent data loss** |
| New column on the evidence record | Copied automatically¹ | ETL edit required; omission = silently NULL |
| "Skip retired implementations" | 1 predicate | 8-way EXISTS ladder over 8 tables |
| Connection metadata (strength ratings, progress-note dates/authors, year lists) | Rides along via `properties(rel)` — untyped, automatic | Columns re-enumerated per statement; lists become 2 extra side tables |
| Referential integrity on implementation links | Inherent (an edge must connect two real nodes) | **Given up** (`impl_id` has no foreign key) or ×8 link tables |
| Application logic duplicated into the DB layer | 0 | 3 (two identifier formats, the empty-whitelist rule) |

¹ The current script copies four named properties explicitly plus everything else via
the generic path; either way the graph offers a generic option. SQL has no built-in
equivalent — a specialist could emulate one with dynamic SQL over `information_schema`,
but in practice teams almost never do, and maintaining that machinery requires exactly
the dedicated SQL expertise this project does not have.

## 5. Where SQL is fine — and why that doesn't change the conclusion

To be credible: steps 1, 4, 6, and 7 (year creation, review reset, plan stubs,
verification) are unremarkable in either technology, and SQL's single-transaction
`BEGIN…COMMIT` is genuinely tidy. If our data were flat rows — transactions,
inventory, user accounts — SQL would be the right call and this document would argue
the opposite.

But our data is not flat rows. It is a **network**: evidence connected to
indicators, campuses, years, people, plans, implementations, assets, and documents,
where the *connections* — how strongly a project evidences an indicator, which years
a document applies to, who annotated progress and when — carry as much meaning as
the records. The rollover is one example; the same shape appears in our reporting
layer, where a single working-group report walks five levels of these connections in
one query (`queries/compound_queries/get_all_by_working_group_campus.py`). The SQL
rendition of *that* is a substantially harder document than this one.

The annual rollover is the clearest lens because it's where the two models'
maintenance costs diverge measurably: **the graph version has nothing that can rot.
The SQL version is a list of things that must be remembered — every year, by
whoever is here — and its failure mode when memory fails is silent.**
