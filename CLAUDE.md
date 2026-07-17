# ATI Analysis — Codebase Guide

A Flask + neomodel + Neo4j knowledge graph for tracking the CSU Accessible Technology Initiative across multiple campuses, with a React frontend.

## Stack

- **Backend:** Python 3.12 + Flask + neomodel ORM over Neo4j (Bolt). Live DB at the address in `app/.env.development`.
- **Frontend:** React 18 + Chakra UI + axios + react-router-dom (CRA-based).
- **Tests:** pytest (backend, project root); Jest + React Testing Library (frontend, via CRA).

## Frontend design

When building or restyling any frontend area, follow the canonical visual + interaction
language in **`claude_files/design-sense.md`** (the "design sense"). It codifies the newer
"graph components" language (Assets/Governance/Indicators) as the standard — color/spacing
tokens, the stat-strip + 1:2 master-detail shell, `Card`/`Section` primitives, config-driven
badges, state treatments, accessibility conventions, and a "build a new area" recipe — plus
the legacy patterns to avoid. Read it before adding UI; keep it updated when design decisions
change.

## Run quick reference

```bash
# Flask dev server
python run.py

# Backend tests (project root)
pytest                                       # all
pytest tests/test_campus_plans_api.py -v     # one file
pytest -m "not integration"                  # pure unit tests only

# Frontend tests (from app/frontend/src)
CI=true npm test                              # all, no watch mode
CI=true npm test -- --testPathPattern=services/api  # filter

# Academic-year rollover
python -m app.database.tools.create_new_ay_campus

# Run graph_schema.py to install neomodel constraints
PYTHONPATH=. python app/database/graph_schema.py
```

## Codebase layout

```
app/
  __init__.py             # create_app(); imports are deferred inside the function (do not hoist)
  data_config.py          # Pure vocabularies/choices maps. Single source of truth. No graph imports.
  database/
    graph_schema.py       # All neomodel node + relationship classes
    identifiers.py        # make_yse_identifier, make_campus_plan_identifier, YEAR_PREFIX_LENGTH
    class_factory.py      # String→class registries; re-exports vocabularies from data_config
    queries/<domain>/{create,read,update,delete}.py   # All CRUD
    tools/                # One-off scripts: migrations, seeds, exports
    batch/                # Standalone .cypher files
  endpoints/data_api/
    __init__.py           # Blueprint declaration ONLY (do not eagerly load endpoint modules here)
    <domain>.py           # MethodView per domain; URL rules registered at file bottom
    errors/custom_exceptions.py   # NotFoundError, ValidationError, CrudError, ApiError
  frontend/src/src/
    services/api/{get,post,put,delete}.js  # All HTTP calls
    context/                               # SettingsContext (currentCampus, currentAcademicYear), DataContext
    components/dashboard_components/<area>/ # report_, settings_, implementation_, about_
tests/
  conftest.py             # Fixtures: neo4j_connection, sentinel_academic_year, cleanup_*, flask_client
  test_*.py
deployment/               # IIS deploy tooling + docs (see deployment/README.md)
  iis-deploy.md           # The deployment guide
  Setup-AtiIis.ps1        # Idempotent IIS provisioning; writes the full web.config
  web.config.template     # Placeholder reference for prod web.config appSettings (the config source)
  wsgi.py                 # WSGI entry point (deployed to the site root C:\www\ati)
  deploy_to_dprc_server.cmd  # Build frontend + robocopy app\ + wsgi.py to the host
```

## Patterns to follow

### Vocabularies live in `app/data_config.py`
Add new choice maps (`status_levels`, `working_groups`, `trajectory_choices`, etc.) to `data_config.py` — never to `class_factory.py` or inline in `graph_schema.py`. The `data_config` module has zero project imports, so anything can read from it without triggering load cycles. `class_factory.py` re-exports vocabularies from `data_config` for backward compatibility with older callers.

### Required-relationship invariants enforced by `queries/<domain>/create.py`
neomodel cannot enforce required `RelationshipTo` edges at save time. The codebase pattern is to put the create function in `app/database/queries/<domain>/create.py`. Example: `create_campus_plan` and `create_working_group_plan` live in `queries/committees/create.py`. **Never create a top-level `app/database/factories.py`** — it triggers the data_api circular-import cycle (see Gotchas).

The create function is the **only sanctioned creation path** for nodes with required edges. Calling `Node(...).save()` directly and connecting relationships ad hoc is a bug — the unique-index on `plan_identifier` catches collisions, but there's no backstop for missing required edges.

### Composite identifiers
Nodes with composite identity (`YearSuccessEvidence.year_identifier`, `CampusPlan.plan_identifier`) use `unique_index=True` on a string property whose format is built by helpers in `app/database/identifiers.py`. Cypher that slices these strings should use the `YEAR_PREFIX_LENGTH` constant via a parameter — never hardcode the magic `9`.

### Endpoint organization
Each domain gets one MethodView in `app/endpoints/data_api/<domain>.py`. URL rules registered at the bottom of the file via `data_api_endpoints.add_url_rule(...)`. POST/PUT use action-dispatch:
```python
data = request.get_json()
action = data.get('action')
if action == 'create_campus_plan': ...
```
Map exceptions to HTTP codes: `ValidationError → 400`, `NotFoundError → 404`, `CrudError → 500`.

## Patterns to avoid

- **Don't** add `from app.X` imports at top of `app/__init__.py` — keep them inside `create_app()`. Hoisting them creates a load cycle when `graph_schema.py` is run as `__main__`.
- **Don't** add eager endpoint imports to `app/endpoints/data_api/__init__.py`. Endpoint modules import from queries modules; queries modules import `custom_exceptions` from inside `data_api`. Eager loading turns this into a recursion trap when anything outside Flask boot imports a queries module.
- **Don't** create `app/database/factories.py`. Put create functions in `queries/<domain>/create.py`.
- **Don't** add module-level `set_connection()` calls in queries modules. The connection is configured by the entry point (Flask `create_app()` or a script that calls `set_connection()` explicitly).
- **Don't** use blanket `MATCH (n) DETACH DELETE n` in tests while we share the live DB. All test cleanup must filter by the sentinel year (`9999-9999`) prefix.
- **Don't** write hardcoded year prefix lengths in Cypher (`substring(year_identifier, 9)`). Use `$year_prefix_length` as a parameter, sourced from `YEAR_PREFIX_LENGTH` in `app/database/identifiers.py`.

## Testing protocol

### Layered build order
| Layer | Tool | Needs DB? |
|---|---|---|
| 1. Identifier helpers | pytest | No |
| 2. Schema constraints | pytest + DB | Yes |
| 3. Create functions (`queries/<domain>/create.py`) | pytest + DB | Yes |
| 4. Read queries | pytest + DB | Yes |
| 5. API endpoints | pytest + Flask test client + DB | Yes |
| 6. FE service layer | Jest + mocked axios | No |
| 7. React components | Jest + RTL + mocked service | No |

### Backend — connection model
By default tests run against the **live Neo4j database** (the same one `set_connection()` resolves to). When `NEO4J_TEST_DATABASE_URL` and `NEO4J_TEST_DATABASE` are both set, tests redirect there. Switching to a dedicated test graph in the future is one env-var change.

### Backend — test-data isolation (CRITICAL while sharing live DB)
All test-created data is scoped to academic year `9999-9999` (`TEST_ACADEMIC_YEAR_NAME` in `tests/conftest.py`). The sentinel `AcademicYear` node is created on first run and reused forever. Cleanup fixtures (`cleanup_plan_family`, `cleanup_yse_family`) filter by identifier prefix — they cannot match production data even if a test misuses real campus/year combinations. Real `Campus` / `SuccessIndicator` / `ATIWorkingGroup` / `Person` nodes are reused (shared reference data) but never modified.

### Backend — conftest warm-up (test-only)
`tests/conftest.py` calls `_warmup_data_api()` at import time, which runs `create_app()` once before pytest imports any test files. This forces a clean Flask boot of the data_api package so subsequent module-level imports of queries modules don't trigger the latent circular load. **This is a test-only accommodation; do not remove it without a replacement.**

### Frontend — axios mocking
axios v1 ships as ESM and CRA's Jest doesn't transform `node_modules`. A bare `jest.mock('axios')` SyntaxErrors. Use the inline factory pattern:
```js
jest.mock('axios', () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn() },
}));
import axios from 'axios';
```

### Pytest markers
Declared in `pytest.ini`:
- `unit` — pure unit tests, no external dependencies
- `integration` — requires a configured Neo4j connection
- `api` — exercises Flask endpoints via the test client

Run only API tests: `pytest -m api`. Run only unit tests: `pytest -m "not integration"`.

## Known gotchas

### Running `graph_schema.py` as a script
Use `PYTHONPATH=. python app/database/graph_schema.py` from the project root. Without `PYTHONPATH=.`, Python can't resolve `from app.data_config import ...`. PyCharm sets PYTHONPATH automatically; bare shells do not.

### `pytest` from a bare shell
Same root cause. `pytest.ini` declares `pythonpath = .` to handle this when running `pytest` from PowerShell/bash. PyCharm test configs work without it because the IDE adds content roots.

### PyCharm running unittest by default
First-time pytest setup: Settings → Tools → Python Integrated Tools → Default test runner = pytest. Then delete any pre-existing run configurations that show `_jb_unittest_runner.py` in the launch line — they were created before the runner switch.

### Neo4j driver deprecation warnings
neomodel doesn't always close its session explicitly, which the neo4j driver complains about. Cosmetic, library-level, not anything we wrote. Suppressed via `pytest.ini` `filterwarnings` if it gets noisy.

## Memory

Established preferences from prior sessions live in `.claude/projects/<project>/memory/MEMORY.md`. Read those at the start of each session for user-confirmed conventions that don't fit this guide.

## Skills

`/semester-migration` — rolls the app to a new academic year (creates new AcademicYear node, duplicates YSE across campuses, creates CampusPlan + WorkingGroupPlan stubs, resets admin review flags, updates frontend year defaults). Triggered by requests like "migrate to 2025-2026", "academic year rollover".

`/accessibility-scan` — runs the axe sweep in `e2e/` over every page, aggregates violations into a per-component worklist, fixes them at the token/component level (fix cookbook included), and re-verifies to green. Triggered by "run an accessibility scan", "fix the axe/WAVE errors", or after UI changes.
