# Deploying the ATI Evidence Graph at another university

**Audience:** a systems/web person at a university that wants to run their own instance.
**Status of this document:** top-level. Requirements and the shape of every step are here,
along with every issue we know about. Platform-specific detail (exact IIS runbook, Docker
Compose file, the stub `.cypher` artifact itself) is deliberately not in this edition — see
[§11 What we still owe you](#11-what-we-still-owe-you).

---

## 1. Read this first — what you are actually taking on

This application was built for one consortium (SFSU, CSU East Bay, Sonoma State, sharing one
Neo4j instance). It is **multi-campus but not multi-tenant**: every campus in a deployment shares
one graph, one ontology, and one set of Success Indicators. Handing it to another university
means standing up a **second, independent deployment** — your own Neo4j, your own app instance,
your own campus node.

It has never been deployed by anyone outside the original team. Expect these characteristics:

| | |
|---|---|
| **Works well** | The data model, the CRUD/reporting surface, the maturity-rubric workflow, the config gateway, the auth sidecar. These are mature and exercised daily. |
| **Works, but assumes our shape** | Deployment tooling (Windows/IIS only), the academic-year rollover, the seed scripts. All are usable; several have our campus abbreviations compiled in. |
| **Does not exist** | A first-run installer, a "create a campus" path that works, a from-scratch database seed, any non-Windows deployment recipe, a rebranding switch. §9 covers each of these with a workaround. |

Nothing here is a blocker. But budget for **a day of hands-on setup by someone comfortable with
Neo4j and Python**, not a twenty-minute install.

### The one thing that must be true before you start

You need a **stub database** from us: the ontology and the 2026-2027 Success Indicators, with no
campus data. There is no script in this repository that can build the indicator set from nothing —
it only exists as data in a running graph. §6 describes exactly what the stub contains and how you
load it. Do not attempt to start from an empty Neo4j.

---

## 2. Architecture in one page

```
Browser
   │  https://host/ati/...
   ▼
┌──────────────────────────────────────────────────────────┐
│ Flask app (app/)                                          │
│                                                           │
│  /ati/*                    React 18 SPA (CRA build),      │
│                            served from                    │
│                            app/frontend/src/build/        │
│  /ati/data-api/v1/*        JSON API — behind the auth     │
│                            guard                          │
│  /ati/auth/v1/*            login/logout/me                │
│  /ati/reports/public/*     server-rendered public report   │
│                            pages (no login; kill-switch)  │
└───────────┬───────────────────────────┬──────────────────┘
            │ Bolt (neomodel)           │ file I/O
            ▼                           ▼
   ┌─────────────────┐          ┌──────────────────────┐
   │ Neo4j 5.26.x    │          │ auth_users.sqlite3   │  accounts
   │ + APOC          │          │ data/files/          │  uploaded blobs
   │                 │          │                      │  (content-addressed)
   │ ALL app data    │          └──────────────────────┘
   └─────────────────┘
```

Two facts that shape everything else:

- **Neo4j is the only application datastore.** Indicators, evidence, people, plans, documents —
  all of it. The SQLite file holds login accounts *only*, and never appears in the graph.
- **Configuration enters through one module**, `app/config_gateway.py`, which resolves each key
  from `os.environ` → the IIS `web.config` → a `.env.<FLASK_ENV>` file → a default. This is why
  the same app runs under IIS with no `.env` at all, and under a plain shell with nothing but a
  `.env` file.

---

## 3. Requirements

### 3.1 Common to every platform

| Component | Requirement | Notes |
|---|---|---|
| **Neo4j** | **5.26.x**, Community is fine | This is what we run and what the stub is exported from. |
| **APOC** | **Mandatory** — matching the Neo4j version | Not optional. Core read queries and the year rollover call `apoc.coll.toSet`, `apoc.convert.toJson`, `apoc.text.urlencode`, `apoc.text.join`, `apoc.map.merge`, `apoc.create.relationship`, `apoc.create.vRelationship`, `apoc.export.csv.query`. Without APOC the dashboard returns 500s. Verify with `RETURN apoc.version();`. |
| **Python** | **3.14** (pinned), 3.12 also works | `app/requirements.txt` is pinned to the versions verified on the 3.14 migration (neomodel 6.1.0 / neo4j 6.1.0). |
| **Node.js** | **20 LTS** (18 acceptable) | Build-time only — needed to produce the SPA bundle. Not needed at runtime. |
| **Disk** | Small for the graph; size `data/files/` for your uploads | The graph is tens of MB. Uploaded evidence documents are the variable. |
| **Network** | App → Neo4j on **7687** (Bolt) | Neo4j does not need to be reachable from browsers. Co-locating them is normal. |
| **TLS** | A certificate for the app host | Sessions are cookie-based; without HTTPS they travel in clear. |

The Python dependency set (`app/requirements.txt`) is: Flask 3.1.3, Flask-Cors, waitress,
neomodel 6.1.0, neo4j 6.1.0, python-dotenv, requests, PyYAML, python-dateutil, networkx, pyvis,
openpyxl, plotly, openai, seqlog. `openai` and the Asana connector are **optional features** —
they are imported lazily and are inert without credentials.

### 3.2 Windows Server + IIS — the tested path

This is the only configuration that has ever run in production, and the only one with tooling.

| | |
|---|---|
| OS | Windows Server 2019/2022 |
| Web server | IIS with **CGI/FastCGI** role feature enabled |
| Bridge | `wfastcgi` (installed into the app venv by our setup script) |
| App pool | **No Managed Code**, dedicated identity |
| Layout | Site root `C:\www\ati` — holds `web.config`, `wsgi.py`, `venv314\`, `app\`, `data\` |
| Config source | `web.config` `<appSettings>` — the single source of truth in production |
| Permissions | The app pool identity needs **Modify** on `data\` (SQLite WAL side-files) and Read on `web.config` |
| Upload cap | IIS `requestLimits/maxAllowedContentLength` must be **≥** `FS_MAX_UPLOAD_MB`, or large uploads are rejected before Flask ever sees them |

The existing detailed runbook is `deployment/iis-deploy.md`, and `deployment/Setup-AtiIis.ps1`
provisions the venv, registers FastCGI, writes `web.config`, and sets permissions idempotently.
**Both are written for our host names and paths** — read them as a reference implementation, not
as a turnkey script.

### 3.3 Linux — supported by the code, no tooling exists

Nothing in the application is Windows-specific. `config_gateway.py` falls back to `.env` files and
real environment variables, `waitress` is cross-platform, and file storage uses `pathlib`. What
does not exist is any script, unit file, or documented recipe.

| | |
|---|---|
| OS | Any current distro (we would target Ubuntu 22.04/24.04) |
| WSGI server | `waitress` (already a dependency) or `gunicorn` |
| Entry point | `run.py` exposes a `waitress.serve` on 127.0.0.1:5000; `deployment/wsgi.py` exposes `application` for gunicorn |
| Reverse proxy | nginx or Apache terminating TLS, proxying to the WSGI server |
| Config | `FLASK_ENV=production` **plus** real environment variables — see the caveat below |
| Process supervision | systemd unit (you write it) |

> **Caveat that will bite you.** `FLASK_ENV=production` makes the config gateway *strict*: it
> skips `.env` files entirely and looks only at `os.environ` and a `web.config`. On Linux there is
> no `web.config`, so **every setting must be a real environment variable** (systemd
> `Environment=` / `EnvironmentFile=`). If you instead run with `FLASK_ENV=development` so it reads
> `app/.env.development`, you get Flask debug mode on — which you must not do in production.
> Two ways out, both fine: export the variables properly, or point `ATI_WEB_CONFIG` at a
> hand-written `web.config`-shaped XML file and keep the `<appSettings>` block as your config file.

### 3.4 Docker — nothing exists; here is the shape

There is no Dockerfile, no compose file, and no image. If you go this way you are writing it. The
shape is unremarkable:

| Service | Notes |
|---|---|
| `neo4j` | Official `neo4j:5.26-community` image. Set `NEO4J_PLUGINS='["apoc"]'`. Persist `/data`. |
| `app` | Multi-stage: Node 20 stage runs the SPA build, Python 3.14 stage installs `app/requirements.txt` and copies the built bundle into `app/frontend/src/build/`. Runs waitress or gunicorn. |
| `proxy` | nginx for TLS + `/ati` routing, or skip it if you already have an ingress. |
| Volumes | `data/files` (uploads) and `data/auth_users.sqlite3` (accounts) **must** be persistent volumes. Losing them loses your evidence documents and every login. |

Same strict-config caveat as §3.3 applies: pass configuration as container environment variables.

---

## 4. Get the code

```bash
git clone <repo> ati
cd ati
```

> **Do not accept a zip of a working tree from us.** `app/.env.development`, `app/.env.production`
> and `app/.env.remote` are gitignored precisely because they contain live credentials — our Neo4j
> password, an OpenAI key, an Asana token. A `git clone` is safe; a directory copy is not. If you
> were sent an archive, delete every `app/.env.*` file before doing anything else. (`.env.example`
> does not exist yet — see §9.11.)

---

## 5. Configure

### 5.1 The keys

Every key below is read through `app/config_gateway.py`. On IIS they live in `web.config`
`<appSettings>`; elsewhere they are environment variables (or a dev-only `.env` file).

| Key | Required | Value |
|---|---|---|
| `FLASK_ENV` | ✅ | `production` |
| `FLASK_SECRET_KEY` | ✅ | 64 hex chars: `python -c "import secrets; print(secrets.token_hex(32))"`. **The app refuses to boot in production** if this is missing, shorter than 32 chars, or a known placeholder — a guessable key lets anyone forge an admin session cookie. Must be **identical across all workers**. |
| `DATABASE_URL` | ✅ | `bolt://USER:PASSWORD@HOST:7687` |
| `NEO4J_DATABASE` | ✅ | Your database name — see the Community-edition note below |
| `DEBUG` / `TESTING` | | `False` / `False` |
| `CORS_ORIGINS` | | Comma-separated. **Empty** for a normal same-origin deployment. |
| `AUTH_ENFORCED` | ✅ | `0` while you bring it up, `1` once login works |
| `AUTH_PROVIDER` | | `local` (the only implementation) |
| `AUTH_ADMINS` | ✅ | Comma-separated emails and/or employee IDs granted admin |
| `AUTH_ALLOWED_USERS` | | Optional allowlist; empty = any active account may log in |
| `AUTH_DB_PATH` | ✅ | Absolute path to `auth_users.sqlite3` |
| `AUTH_SESSION_HOURS` | | e.g. `12` |
| `SESSION_COOKIE_SECURE` | ✅ | `1` once you have HTTPS. `0` only during bring-up. |
| `PUBLIC_REPORTS_ENABLED` | | `1`/`0`. Kill-switch for the **unauthenticated** report pages at `/ati/reports/public`. **Default is on.** See §9.9. |
| `FS_PROVIDER` | | `local` (the only backend) |
| `FS_LOCAL_ROOT` | ✅ | Absolute path for uploaded blobs |
| `FS_MAX_UPLOAD_MB` | | e.g. `50`. Keep your web server's body limit ≥ this. |
| `ATI_ROTATING_LOG` | | `1` to also write a bounded rotating log |
| `ATI_WEB_CONFIG` | | Only if your `web.config` is not one level above the `app` package |
| `ASANA_*`, `OPEN_AI_API_KEY` | | Optional integrations. Leave unset; the features raise a clear error only when actually invoked. |

> **Neo4j Community and the database name.** Community Edition serves exactly one user database.
> Ours is named `ati`, which works only because `initial.dbms.default_database=ati` is set in
> `neo4j.conf`. **The simplest thing for you is `NEO4J_DATABASE=neo4j`** and leaving Neo4j's
> default alone. If you prefer a named database, you must set `initial.dbms.default_database` in
> `neo4j.conf` *before first start* — renaming later is not a thing in Community.

### 5.2 … and the frontend's build-time config

`app/frontend/src/.env.production` is committed and contains no secrets:

```
REACT_APP_API_URL=/ati/data-api/v1
REACT_APP_AUTH_API_URL=/ati/auth/v1
REACT_APP_DISABLE_LOGIN=false
```

These are **baked into the bundle at build time**. Leave them relative — hardcoding an absolute
`http://` host breaks the app the moment you put it behind HTTPS. Keep `REACT_APP_DISABLE_LOGIN`
at `false`; `true` makes the SPA skip the login screen entirely and is a dev-only convenience.

If you serve the app at a path other than `/ati`, you must change **three** things together:
`homepage` in `app/frontend/src/package.json`, the two `REACT_APP_*_URL` values, and the
`url_prefix` arguments in `create_app()` (`app/__init__.py`). They are not derived from one
another.

---

## 6. The database

### 6.1 Install the schema constraints

From the repo root, with your config in the environment:

```bash
PYTHONPATH=. python app/database/graph_schema.py
```

This runs `db.install_all_labels()` — roughly 130 constraints and 141 indexes. Run it **before**
loading the stub. `PYTHONPATH=.` is required from a bare shell.

### 6.2 Load the ontology stub

We supply a single idempotent `.cypher` file. Load it with the repository's own runner, which
EXPLAIN-validates every statement before executing any of them:

```bash
python -m app.database.cypher_runner.run_file <stub>.cypher            # validate only
python -m app.database.cypher_runner.run_file <stub>.cypher --execute  # validate, then run
```

**What the stub contains** — the campus-agnostic reference layer, and nothing else:

| Layer | Contents |
|---|---|
| Indicators | **155 SuccessIndicators**, flags intact: 122 are active for 2026-2027; 33 are marked `removed=true` and stay out of the evidence set but remain visible in Settings. 62 carry an `examples_of_evidence` list and 56 an `established_example` — these are the maturity bars the whole review workflow is built around. |
| Structure | 26 Goals, 6 ATIWorkingGroups (Web, Procurement, Instructional Materials, Communication & Training, Governance, Steering), and the AcademicYear **2026-2027**. |
| Maturity rubric | 6 StatusLevels (Not Started → Optimizing) plus their ~65 child procedure/resource/documentation/evidence description and requirement nodes. |
| Classification | 7 W3C AMM Dimensions, 20 Roles. |
| Communities | 20 CommunityOfPractice nodes and their 151 `has_stake_in` edges to indicators — **structure only, no members**. |
| Governance | 16 Principles, 19 Laws, 16 OCR/court Cases, 9 Directives, 8 Memos, 14 Guidelines, 4 ExternalPolicies, plus the ~100 citation Webpage/Document nodes they are sourced from. |
| Ontology prose | 137 UniversalDescriptors — the glossary, tooltips, and Ontology Browser text. |

**What the stub deliberately excludes:** every Campus, CampusPlan, WorkingGroupPlan and
YearSuccessEvidence node; every Person, OrgUnit, Department and College; every implementation
(Process, Project, Procedure, Service, Guidance, Tracking, InternalPolicy); every Note, Message,
Plan, Accomplishment, ProgressUpdate, Query, MeetingMinutes, Metric, Recommendation, Asset,
Interface, Component, Tool, Vendor, and every uploaded file. **No evidence, no people, no
uploaded documents, no campus.**

Two honest notes on the governance layer. First, a good part of it is **CSU-specific** — Executive
Orders 926 and 1111, the AA-series coded memoranda, the CSU systemwide ATI policy. For a non-CSU
campus these are informative background rather than binding authority; delete them if they get in
the way. Second, the federal and state layer (Section 504/508, ADA Titles II and III, the 2024 DOJ
web rule, WCAG 2.0–2.2, EN 301 549, the OCR resolutions) applies to you regardless, and is the
part worth keeping.

### 6.3 Create your campus — the step with no tool

This is the sharpest edge in the whole handover, so it gets its own section. **There is no working
code path that creates a campus.** `add_campus()` in
`app/database/queries/organizational_units/create.py:139` sets only `name` — it never sets
`abbreviation`, which is the property the entire application scopes on (URLs, YSE identifiers,
plan identifiers, every campus-filtered query). It is also unreachable: no endpoint action calls
it, and nothing in the UI exposes it.

So create the campus directly, once:

```cypher
CREATE (c:Campus {
  unique_id:    randomUUID(),
  name:         'Your University Name',
  abbreviation: 'abbr'
});
```

Choose the abbreviation carefully — **it is effectively permanent.** It becomes the trailing
segment of every `YearSuccessEvidence.year_identifier` (`2026-2027-4.5-ins-abbr`), of every
`CampusPlan.plan_identifier` (`2026-2027-abbr`), and of every URL (`/ati/abbr/dashboard`).
Changing it later means rewriting every identifier in the graph. Use a short lowercase token with
no spaces or punctuation.

Then create the year's scaffolding. `app/database/tools/create_new_ay_campus.py` does exactly this
work but has our three campuses compiled in at line 33 (`ALL_CAMPUSES = ["sfsu", "ssu", "csueb"]`)
and its year pair hardcoded in `__main__`. Edit both, then run it — it is idempotent and its
`create_stub_yse_for_missing_campuses` / `create_campus_plans_for_year` steps are precisely what a
fresh campus needs:

```python
ALL_CAMPUSES = ["abbr"]
...
OLD_YEAR = "2026-2027"   # no prior year to duplicate from
NEW_YEAR = "2026-2027"
```

Running it produces, for your campus: the CampusPlan `2026-2027-abbr`, six WorkingGroupPlans
(`2026-2027-abbr-web`, `-pro`, `-ins`, `-com`, `-gov`, `-ste`), and **122 YearSuccessEvidence
stubs** — one per active indicator, each wired to the indicator, the year, your campus, and status
*Not Started*. The duplication step will find nothing to copy, which is correct.

Do not use `app/database/tools/seed_campus_yse_stubs.py`; it is an older single-purpose script
hardcoded to `["ssu", "csueb"]` and academic year `2024-2025`.

### 6.4 Verify the load

```cypher
MATCH (si:SuccessIndicator) RETURN count(si);                              // expect 155
MATCH (y:YearSuccessEvidence) RETURN count(y);                             // expect 122
MATCH (c:Campus) RETURN c.name, c.abbreviation;                            // expect exactly yours
MATCH (p:CampusPlan) RETURN p.plan_identifier;                             // expect 2026-2027-abbr
MATCH (w:WorkingGroupPlan) RETURN count(w);                                // expect 6
MATCH (s:StatusLevel) RETURN s.status_level, s.status_value ORDER BY s.status_value;
RETURN apoc.version();
```

A count of 122 YSE for one campus is the single best signal that the whole chain worked.

---

## 7. Build and run

```bash
# 1. Python deps
python -m venv .venv && .venv/bin/pip install -r app/requirements.txt   # Windows: .venv\Scripts\pip

# 2. Frontend bundle — required; the build directory is gitignored and ships empty
cd app/frontend/src && npm ci && npm run build && cd -

# 3. Serve
python run.py            # waitress on 127.0.0.1:5000
```

Flask serves the SPA from `app/frontend/src/build/`. **If you skip `npm run build`, every page
under `/ati` returns a 500 or a blank document** — there is no bundled fallback and no error
message that says so.

For local development instead: run Flask on :5000 and `npm start` on :3000. `src/setupProxy.js`
forwards `/ati/data-api`, `/ati/auth` and `/ati/reports/public` to Flask, so the session cookie
stays same-origin.

---

## 8. Accounts and first login

Accounts live in the SQLite sidecar, keyed by **email**, and are managed with an interactive CLI:

```
python app/auth/manage_users.py          # or app\manage_users.cmd on Windows
```

Run it in a shell with the **same configuration the app uses** — it prints the auth DB path it is
editing, and that path must equal your `AUTH_DB_PATH`. Editing the wrong SQLite file is the single
most common auth complaint.

> **Ordering trap.** A normal account will not be created unless a graph `Person` node with a
> matching `email` already exists — the account *is* the link between login and person. On a fresh
> stub there are no Person nodes at all. Use **"Add SYSTEM account"** for your first login (it
> bypasses the Person check), get into the app, create your people there, then create normal
> accounts.

Bring auth up in stages: `AUTH_ENFORCED=0` → confirm `GET /ati/auth/v1/me` responds and the
dashboard renders → create the SYSTEM account → `AUTH_ENFORCED=1` → restart → confirm login.

---

## 9. Known issues, caveats, and workarounds

Everything below is a real characteristic of the code as it stands today, not a hypothetical.

### 9.1 There is no campus-creation path
`add_campus()` (`organizational_units/create.py:139`) omits `abbreviation` and is wired to nothing.
**Workaround:** the `CREATE (c:Campus {...})` statement in §6.3. **Consequence:** adding a second
campus later is also a manual Cypher step.

### 9.2 The campus abbreviation is baked into every identifier
`YearSuccessEvidence.year_identifier`, `CampusPlan.plan_identifier` and
`WorkingGroupPlan.plan_identifier` all end in it (`app/database/identifiers.py`), and it is a URL
segment. **Workaround:** none — choose correctly the first time. Renaming means rewriting every
identifier and every reference to it.

### 9.3 Our campus abbreviations are compiled into the tooling
`create_new_ay_campus.py:33`, `seed_campus_yse_stubs.py:17`. **Workaround:** edit before running
(§6.3). **Watch for this** at every future academic-year rollover, not just at install.

### 9.4 The app redirects to a campus that will not exist
`app/frontend/src/src/App.js:507` sends `/ati/` to `/ati/sfsu/dashboard`. On your deployment that
is a dead route. **Workaround:** change the literal to your abbreviation and rebuild. Deep links
like `/ati/abbr/dashboard` work correctly without any change.

### 9.5 The public report pages default to our campus
`app/public_reports/__init__.py:36` sets `_DEFAULT_CAMPUS = 'sfsu'`, used by the short-form report
redirect and by generated edit links. **Workaround:** change the constant, or disable the feature
with `PUBLIC_REPORTS_ENABLED=0`.

### 9.6 The frontend's default academic year is stale
`app/frontend/src/src/context/SettingsContext.js:21` defaults to `'2025-2026'`. Your stub contains
**only 2026-2027**, so a fresh install opens on an empty year and shows a "no evidence for this
campus/year" banner — looking exactly like a failed installation when it is not. **Workaround:**
change the default to `'2026-2027'` and rebuild, or tell users to switch the year selector once.
Do this before anyone else sees the app; it wastes an afternoon otherwise.

### 9.7 APOC is a hard runtime dependency
Not a nice-to-have. Missing APOC surfaces as **500s on the dashboard and report endpoints**, not as
a clear startup error. **Workaround:** install it, and make `RETURN apoc.version();` part of your
post-upgrade checklist — a Neo4j minor upgrade that leaves an old APOC jar behind will take the app
down.

### 9.8 `FLASK_ENV=production` refuses to read `.env` files
Deliberate — production configuration is meant to come from `web.config`. Off Windows this means
every setting must be a real environment variable. **Workaround:** export them properly, or point
`ATI_WEB_CONFIG` at a `web.config`-shaped XML file and use its `<appSettings>` block as your config
file. Do **not** solve it by running with `FLASK_ENV=development`, which enables Flask debug mode.

### 9.9 Public report pages are unauthenticated by default
`/ati/reports/public/*` renders indicator reports with **no login**, and `PUBLIC_REPORTS_ENABLED`
defaults to **on**. Our deployment relies on a campus-IP perimeter for this. If your app host is
internet-facing, that assumption does not carry. **Workaround:** set `PUBLIC_REPORTS_ENABLED=0`
until you have decided what should be public, or restrict the path at the reverse proxy.

### 9.10 The test suite points at the live database by default
`tests/conftest.py` falls back to the same connection the app uses unless **both**
`NEO4J_TEST_DATABASE_URL` and `NEO4J_TEST_DATABASE` are set. Test data is isolated by a sentinel
academic year (`9999-9999`) rather than by a separate database. **Workaround:** set both variables
to a scratch database before running `pytest`. Do not run the suite against production and trust
the sentinel to protect you.

### 9.11 There is no configuration template outside the IIS path
`deployment/web.config.template` documents every key for Windows. There is no `.env.example`.
**Workaround:** §5.1 of this document is the key list; build your own from it.

### 9.12 Working directories exist in the repo that are not part of the app
`graphify-out/`, `tutorial/`, `docs/`, `claude_files/`, `app/graphRag/`, `app/open-ai/`,
`app/asana-connector/`, `migrations/`, `reports/`, a stray `nul` file, and `.claude/` skill
definitions. None are required at runtime. **Workaround:** ignore them, or prune after your first
successful deployment — do not prune before, since it is hard to tell by inspection what
`create_app()` imports.

### 9.13 Optional integrations fail loudly only when used
Asana push/reconcile and the OpenAI features raise a clear error when invoked without credentials,
and are otherwise inert. **Workaround:** leave them unconfigured; do not surface those UI actions
to your users.

### 9.14 Everything is single-graph, not multi-tenant
Adding campuses to *your* deployment is supported and normal (that is what the campus selector is
for). What is not supported is isolating one campus's data from another's — all campuses in a
deployment share one graph and one set of accounts. **Workaround:** if you need isolation, run
separate deployments with separate Neo4j instances.

### 9.15 The indicator set is a snapshot, not a subscription
Your stub freezes the ontology at 2026-2027. When indicators change in later years, nothing
propagates to you automatically. **Workaround:** plan on receiving a refreshed stub, or on merging
indicator changes yourself. Note that `create_new_success_indicators.py` only knows how to add the
*2026-2027 additions* to a graph that already has the base set — there is no build-from-nothing
path, which is why the stub exists.

---

## 10. Rebranding checklist

Cosmetic, but the app will say "SFBRN" everywhere until you do it. All of these need a frontend
rebuild afterwards.

| What | Where |
|---|---|
| Browser/tab title | `app/frontend/src/public/index.html:27` — `<title>SFBRN Evidence Graph</title>` |
| Announced page title | `app/frontend/src/src/hooks/useRouteAnnouncer.js:51` |
| Header logo + alt text | `app/frontend/src/src/App.js:31,146,147` |
| Login screen logo | `app/frontend/src/src/components/Login.js:17,62` |
| Logo assets | `app/frontend/src/src/assets/img/sfbrn-logo*.svg` (four files) |
| Landing copy | `app/frontend/src/src/components/Home.js:8,10` — "SF State ATI Graph Database Application" |
| Package name | `app/frontend/src/package.json:2` |
| Brand palette | `theme.js` remaps Chakra's `teal.*` to our brand blue — the whole app's accent colour is that one alias. Repoint it, do not hunt for literal colours. |
| About-tab diagrams | `assets/img/sfbrn-ati-context-graph.svg` and siblings, referenced from `about_components/OverviewTab.js` |
| "SFBRN" in help text | Several `implementationConfig.js` / `indicatorHelpers.js` descriptions use SFBRN as the example of an external party ("another unit, SFBRN, the CO, a vendor"). Harmless but reads oddly. |

The design language these follow is documented in `claude_files/design-sense.md` — worth reading
before you restyle anything, so a rebrand does not fight the component system.

---

## 11. What we still owe you

Explicitly out of scope for this edition, so nobody assumes it is covered:

1. **The stub `.cypher` artifact itself.** §6.2 specifies its contents exactly; the file has to be
   exported from our graph and shipped separately.
2. **A campus-bootstrap tool.** §6.3 is a workaround around a real gap. A small
   `bootstrap_campus.py --abbrev --name --year` would replace the hand-written Cypher and the
   source edits, and would also fix `add_campus()`.
3. **A step-by-step IIS runbook for your host.** `deployment/iis-deploy.md` plus
   `Setup-AtiIis.ps1` are our version of it and need parameterising for your paths.
4. **A Docker Compose file and Dockerfile.** §3.4 is the shape, not an implementation.
5. **A `.env.example`.** §5.1 is the key list it would contain.
6. **Anything about migrating your existing accessibility data in.** This document gets you a
   working, empty instance. Populating it is a separate conversation — the transcript/document
   ingest pipeline (`app/database/ontology/`, the batch Cypher convention in
   `app/database/batch/auto-assignments/`) is how we do it, and it is worth a walkthrough.

---

## 12. Fastest path to "it works"

For orientation, the whole thing in order:

1. Neo4j 5.26 + APOC up; confirm `RETURN apoc.version();`.
2. Clone the repo. Delete any `app/.env.*` if you did not clone.
3. Python venv + `pip install -r app/requirements.txt`.
4. Set config (§5.1) with `AUTH_ENFORCED=0` and a real `FLASK_SECRET_KEY`.
5. `PYTHONPATH=. python app/database/graph_schema.py` — constraints.
6. Load the stub with `run_file --execute`.
7. `CREATE (c:Campus {...})` with your abbreviation.
8. Edit `create_new_ay_campus.py` (campus list + years), run it → expect 122 YSE.
9. Fix the two defaults that will otherwise look like breakage: `App.js:507` and
   `SettingsContext.js:21`.
10. `npm ci && npm run build`.
11. `python run.py`, open `/ati/<abbr>/dashboard`, confirm 122 indicators at *Not Started*.
12. Create a SYSTEM account, set `AUTH_ENFORCED=1`, restart, log in.

Step 11 rendering a full grid of Not Started indicators is the moment you know it worked.
