# ATI Analysis

**A knowledge-graph platform for tracking and managing digital accessibility across a large university system.**

ATI Analysis turns the sprawling, multi-year, multi-campus work of keeping a university's technology accessible into a navigable **ontology** — a connected map of the laws that create the duty, the goals and indicators that measure it, the people and committees who carry it out, the plans and projects that move it forward, and the documentary evidence that proves it happened. It is built on a [Neo4j](https://neo4j.com/) graph database with a Flask API and a React dashboard, and it is designed for the people who actually have to answer the question every accessibility office dreads: *"Show me the evidence."*

---

## Why this exists

Large public universities run on **Information and Communication Technology (ICT)** — learning-management systems, library databases, course materials, procured software, public websites, internal administrative tools. Under the **Americans with Disabilities Act (Title II)**, **Section 508** and **Section 504** of the Rehabilitation Act, and standards like **WCAG**, every one of those surfaces carries a legal duty to be accessible to people with disabilities.

The **Accessible Technology Initiative (ATI)** is the California State University system's program for meeting that duty. It organizes the work into three priority areas — **Web**, **Instructional Materials**, and **Procurement** — and measures progress against a structured set of **goals** and **success indicators**, reported **per campus, per academic year**, against a six-level capability **maturity model** (Not Started → Initiated → Defined → Established → Managed → Optimizing).

That model is hard to manage in spreadsheets. The real questions an accessibility office faces are *relationship* questions:

- *What evidence supports this success indicator for this campus, this year?*
- *Which institutional systems are owned and maintained by someone, but have no work actively keeping them accessible* — the signal that responsibility has quietly elevated to the institution as a whole?
- *Which user-facing interfaces are not covered by any remediation effort at all?*
- *Trace from this federal law down to the actual documents that demonstrate we comply with it.*
- *Did this indicator improve, stall, or regress compared to last year?*

Those are multi-hop traversals across a web of entities. They are painful in rows and columns and natural in a graph. **ATI Analysis models accessibility governance as the connected thing it actually is.**

---

## The ontology

The heart of the system is `app/database/graph_schema.py` — a formal **ontology** of accessibility governance expressed as [neomodel](https://neomodel.readthedocs.io/) node and relationship classes. Every node type is precisely defined (the class docstrings *are* the ontology definitions), and the schema is organized into the conceptual categories an accessibility program actually thinks in:

| Category | Node types | What it captures |
|---|---|---|
| **Governance** | `Law`, `Case`, `Directive`, `ExternalPolicy`, `InternalPolicy`, `Memo`, `Guideline` | The legal and policy framework that *creates the duty* — statutes, court rulings, regulatory directives, institutional policy, WCAG-style guidelines. Governance **informs** Goals. |
| **Indicators** | `Goal`, `SuccessIndicator` | The measurable objectives and the specific benchmarks used to evaluate them. Goals are **supported by** Success Indicators; indicators **direct** the implementation work. |
| **Implementation** | `Plan`, `CampusPlan`, `WorkingGroupPlan`, `Process`, `Project`, `Procedure`, `Service`, `Guidance`, `Tracking`, `Accomplishment`, `ProgressUpdate` | The actual work: ongoing processes, time-bound projects, repeatable procedures, on-demand services, the prioritized campus plans, and completed accomplishments. |
| **Evidence** | `YearSuccessEvidence`, `AcademicYear`, `StatusLevel` (+ its description/requirement sub-nodes) | The audit backbone. A `YearSuccessEvidence` (YSE) node is the year-and-campus-scoped assessment of one success indicator, pinned to a maturity `StatusLevel`. |
| **Committees** | `ATIWorkingGroup` | The Web / Instructional Materials / Procurement working groups responsible for goals and accountable for work. |
| **Individuals & Org Units** | `Person`, `Department`, `College`, `OrgUnit`, `Campus`, `Vendor` | The people and institutional units that staff committees, steward technology, and own remediation work. |
| **Documentation** | `Document`, `Webpage`, `Note`, `Message`, `Metric` | The verifiable records — files, links, annotations, communications, and quantitative metrics — that constitute proof. |
| **ICT Assets** | `Asset`, `Interface`, `Component`, `Tool`, `TAAP` | The technology itself, modeled rigorously against the legal architecture (see below). |

The ontology is also **self-describing**. A `UniversalDescriptor` subsystem stores human-readable definitions for node types, fields, and every controlled-vocabulary value, seeded from the schema docstrings and `app/data_config.py` and surfaced in the app's Settings → Ontology Descriptions screen. The graph can explain its own vocabulary to the people using it.

### The evidence model — working backward from the YSE

The single most important traversal pattern is **evidence gathering**. `YearSuccessEvidence` sits at the center: implementation nodes (`Process`, `Project`, `Procedure`, `Service`, `Guidance`, `Tracking`, `InternalPolicy`, `TAAP`) point *into* a YSE via an `is_evidence_for` edge, and each of those implementations carries its own supporting `Document`/`Webpage`/`Note`/`Message`/`Metric` edges.

To assemble the proof for an indicator in a given year, the system **walks backward** from the YSE node, out through every implementation that evidences it, and out again to that implementation's documentary records. Supporting-document edges even carry `included_in_years` / `excluded_from_years` properties (`DocumentedByRel`), so the same artifact can count as evidence in some years and not others without duplicating nodes. This backward-traversal model is exactly the kind of question a graph answers in one query and a relational schema answers with a tangle of joins.

### Composite identity and required-relationship invariants

Several nodes have **composite identity** — their uniqueness comes from a structured string key, not a surrogate ID:

- `YearSuccessEvidence.year_identifier` → `2025-2026-5.2-pro-sfsu` (year · indicator · campus)
- `CampusPlan.plan_identifier` → `2025-2026-sfsu`
- `WorkingGroupPlan.plan_identifier` → `2025-2026-sfsu-web`
- `Asset.asset_identifier` → `canvas-sfsu` vs `canvas-systemwide` (scope is part of identity)
- `Interface.interface_identifier` → a four-coordinate signature `backing--locus--function--title`

All of these formats are built by helper functions in `app/database/identifiers.py` so the format stays consistent across migrations, factory functions, and ad-hoc Cypher. Because neomodel cannot enforce *required* relationships at save time, nodes with mandatory edges (a `CampusPlan` must have a campus and a year) are created only through sanctioned factory functions in `app/database/queries/<domain>/create.py` — never by calling `.save()` directly.

---

## The ICT accessibility model

The newest and most distinctive part of the ontology is how it models the technology itself. Rather than a flat "list of systems," it separates concerns along the lines that accessibility law and the WCAG standard actually draw:

- **`Asset`** — a logged unit of ICT *whose accessibility must be maintained*. It records **what** the thing is and **who stewards it** under §508 (who procures / develops / maintains / uses it — each a `Person` *or* an `OrgUnit`). Identity is scope-aware, so the system-wide Canvas and a campus's Canvas are distinct assets.
- **`Interface`** — a salient *point of interaction* with ICT, defined by functional role rather than substrate (a standalone PDF and a Canvas course view are the same kind of thing because they play the same role). This is **where the accessibility duty lands and what remediation targets** — WCAG's actual unit of conformance.
- **`Component`** — a piece of an interface at the grain where a **WCAG success criterion or a VPAT line item attaches** (a video player, a data table, a form field). Defined by the standard, not the institution.
- **`Tool`** — an instrument *used to do remediation* (Pope Tech, Equidox, an OCR engine), as distinct from an asset the institution must *keep* accessible.
- **`TAAP`** (Temporary Alternate Access Plan) — the institution's required, time-bound, annually-reviewed response when full conformance isn't achievable, anchored in **Title II §35.205**. A TAAP is itself evidence.

This separation makes two legally meaningful **diagnostic signals** directly queryable:

- **The elevation signal** — an asset that is *stewarded* (someone procures/maintains/uses it) but has *no remediating implementation* and no covering TAAP. Under the Title II responsibility heuristic, that's the modeled signal that accountability has elevated to the institution as a whole.
- **Uncovered interfaces** — interfaces reached by neither a specific remediation nor any institution-level sweep. The declared-vs-enacted gap (did the ATI *name* this surface, or did it *emerge* from where remediation actually clustered?) is tracked as a diagnostic, not something to be papered over.

Stewardship (who owns the thing) and remediation accountability (who is keeping it accessible) are deliberately kept as separate edges, because the gap between them is precisely what an accessibility office needs to see.

---

## Why Neo4j

A graph database is not an implementation detail here — it is a match for the problem domain:

- **Accountability is a traversal.** "From this law, which goals, which indicators, which evidence, which documents?" is a path through the graph, not a report assembled from foreign keys.
- **The evidence model is inherently backward-linked.** Gathering proof means walking from a YSE out through every implementation that evidences it and on to their documents — a variable-depth traversal that Cypher expresses directly.
- **The diagnostic signals are pattern queries.** "Assets with a stewardship edge but no remediation edge" and "interfaces with no covering implementation" are negative-pattern matches that are trivial in Cypher and awkward in SQL.
- **The schema is genuinely a graph.** Many-to-many, multi-typed, optional relationships everywhere (an interface backed by several assets; a plan furthering several indicators; a person leading several groups across campuses). Forcing this into relational tables would mean a join table for nearly every relationship.

The backend uses the **neomodel** OO mapper over the Neo4j **Bolt** driver, with `unique_index` constraints enforcing identity and Cypher used directly for the heavy compound traversals.

---

## Multi-campus, multi-year by design

Two dimensions run through the entire model:

- **Campus** — every YSE, asset, and plan is scoped to a `Campus`, and the React frontend carries the current campus in the URL (`/:campus/...`). Shared reference data (campuses, indicators, working groups, people) is reused across campuses; campus-specific evidence is isolated.
- **Academic year** — evidence, plans, metrics, and accomplishments are all year-scoped, enabling **year-over-year trend analysis** (improving / static / declining per indicator). A dedicated **semester-migration** workflow rolls the whole system to a new academic year: it creates the new `AcademicYear`, duplicates YSE across all campuses with relationships intact, stubs `CampusPlan`/`WorkingGroupPlan` scaffolding, resets admin-review flags, and updates the frontend year defaults.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React 18 + Chakra UI  (app/frontend/src/src)                     │
│  ATI Explorer · Dashboard (reports, campus plans, settings)       │
│  Context: SettingsContext (campus/year) · DataContext · User      │
│  services/api/{get,post,put,delete}.js  ── axios ──┐              │
└────────────────────────────────────────────────────┼────────────┘
                                                       │ HTTP
                                            /ati/data-api/v1
┌──────────────────────────────────────────────────────▼───────────┐
│  Flask API  (app/endpoints/data_api)                               │
│  One MethodView per domain; POST/PUT use action-dispatch.          │
│  ValidationError→400  NotFoundError→404  CrudError→500             │
└──────────────────────────────────────────────────────┬───────────┘
                                                         │
┌──────────────────────────────────────────────────────▼───────────┐
│  Query layer  (app/database/queries/<domain>/{create,read,         │
│                update,delete}.py + compound_queries/)              │
│  Sanctioned create functions enforce required-edge invariants.     │
└──────────────────────────────────────────────────────┬───────────┘
                                                         │
┌──────────────────────────────────────────────────────▼───────────┐
│  Ontology  (app/database/graph_schema.py)  ── neomodel ──          │
│  Vocabularies: app/data_config.py · Identifiers: identifiers.py    │
└──────────────────────────────────────────────────────┬───────────┘
                                                         │ Bolt
                                                  ┌──────▼──────┐
                                                  │   Neo4j     │
                                                  └─────────────┘
```

**Key layering rules** (enforced to avoid circular imports — see `CLAUDE.md`):

- `app/data_config.py` holds all pure vocabularies/choice maps and has **zero project imports** — it's the single source of truth, and the frontend fetches these vocabularies live via `GET /settings`.
- Project-internal imports in `app/__init__.py` are deferred inside `create_app()`.
- CRUD lives in `queries/<domain>/`; endpoints are one `MethodView` per domain, registered at the bottom of each file.

### Backend layers, from the inside out

1. **`graph_schema.py`** — the ontology (node + relationship classes).
2. **`data_config.py`** — controlled vocabularies (`status_levels`, `functions`, `asset_classes`, `trajectory_choices`, …); `identifiers.py` — composite-key builders; `class_factory.py` — string→class registries.
3. **`queries/<domain>/`** — all reads, creates, updates, deletes; `queries/compound_queries/` — the big multi-hop traversals (e.g. the full working-group evidence tree, YSEs-by-campus-for-year).
4. **`endpoints/data_api/<domain>.py`** — the REST surface, mounted at `/ati/data-api/v1`.
5. **`database/tools/`** — operational scripts: academic-year rollover (`create_new_ay_campus.py`), descriptor seeding (`seed_descriptors.py`), one-off schema migrations, report exports.

### Frontend

A Create React App (React 18 + Chakra UI + axios + react-router-dom) served by Flask in production from `app/frontend/src/build`. Two top-level areas:

- **ATI Explorer** — browse the graph: evidence trees by working group/goal, implementations, people, governance, and the full **Assets / Interfaces / Components / Tools / TAAPs / Vendors** ICT inventory.
- **Dashboard** — operational work: annual **reports** (with year-over-year copy), **campus plans** (prioritized indicators, group leads, executive sponsors, progress updates with trajectory), and **settings** (committee members, indicators, status levels, ontology descriptions).

Global state lives in React contexts — `SettingsContext` (current campus, academic year, working group, and the vocabularies fetched from the backend), `DataContext` (evidence/indicators/trends/implementations), `UserContext`, and `StatusLevelContext`. All HTTP goes through a thin `services/api/{get,post,put,delete}.js` layer.

---

## Tech stack

| Layer | Technology |
|---|---|
| Graph database | Neo4j 5.x (Bolt) |
| ORM / OGM | neomodel 5.3 |
| API | Flask 3 + Flask-CORS, served via Waitress |
| Language | Python 3.12 |
| Frontend | React 18, Chakra UI, axios, react-router-dom 6 |
| Backend tests | pytest |
| Frontend tests | Jest + React Testing Library |

---

## Getting started

### Prerequisites

- Python 3.12, Node 18+, and a running Neo4j 5.x instance.
- A `app/.env.development` file providing the database connection:
  ```
  DATABASE_URL=bolt://neo4j:<password>@<host>:7687
  NEO4J_DATABASE=ati
  ```
  (A `docs/neo4j.dump` is included to seed a database with existing graph data.)

### Backend

```bash
pip install -r app/requirements.txt

# Install neomodel unique-index / label constraints (run once against the DB)
PYTHONPATH=. python app/database/graph_schema.py

# Run the dev server (Waitress on http://127.0.0.1:5000)
python run.py
```

The app is served under `/ati`, with the JSON API under `/ati/data-api/v1`.

### Frontend

```bash
cd app/frontend/src
npm install
npm start          # dev server
npm run build      # production build (Flask serves app/frontend/src/build)
```

### Academic-year rollover

```bash
python -m app.database.tools.create_new_ay_campus
```

---

## Testing

Backend tests run with **pytest** from the project root. By default they run against the live Neo4j database, but **all test-created data is scoped to a sentinel academic year (`9999-9999`)** and cleanup fixtures filter by identifier prefix, so tests can never touch production data. Setting `NEO4J_TEST_DATABASE_URL` + `NEO4J_TEST_DATABASE` redirects to a dedicated test graph.

```bash
pytest                                    # all backend tests
pytest tests/test_campus_plans_api.py -v  # one file
pytest -m "not integration"               # pure unit tests (no DB)
pytest -m api                             # Flask endpoint tests
```

Markers (`unit`, `integration`, `api`) are declared in `pytest.ini`. Frontend tests:

```bash
cd app/frontend/src
CI=true npm test
```

---

## Project layout

```
app/
  __init__.py             # create_app(); project imports deferred inside
  data_config.py          # Pure vocabularies / choice maps — single source of truth
  database/
    graph_schema.py       # The ontology: all neomodel node + relationship classes
    identifiers.py        # Composite-identifier builders (year/campus/asset/interface keys)
    class_factory.py      # String→class registries
    queries/<domain>/     # All CRUD: {create,read,update,delete}.py
    queries/compound_queries/  # Multi-hop reporting traversals
    tools/                # AY rollover, descriptor seeding, migrations, report exports
    batch/                # Standalone .cypher files
  endpoints/data_api/
    <domain>.py           # One MethodView per domain (assets, campus_plans, evidence, …)
    errors/               # NotFoundError, ValidationError, CrudError, ApiError
  frontend/src/src/       # React app (note the doubled src/)
    context/  services/api/  hooks/  components/
tests/                    # pytest suite (conftest scopes test data to 9999-9999)
docs/                     # Knowledge-graph poster, DB dumps, report worksheets
CLAUDE.md                 # In-repo developer guide and conventions
```

---

## In short

ATI Analysis is a purpose-built **accessibility-governance knowledge graph**: it encodes the laws, goals, indicators, people, work, technology, and proof of a university's accessibility program as a single connected ontology in Neo4j, and gives accessibility coordinators a campus- and year-aware interface to navigate it, report on it, plan against it, and — when an auditor asks — produce the evidence.