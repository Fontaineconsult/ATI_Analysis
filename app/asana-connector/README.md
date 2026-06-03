# Asana Connector

Pushes the ATI **plans** graph into Asana: one Asana **project**, a **section**
per working group, and a **task** per `Plan` node. Each task's notes embed
`[graph Plan.unique_id: <uid>]` so every task traces back to its source node.

## Why a REST client instead of the `asana` package

The official [`asana`](https://pypi.org/project/asana/) Python package (v5.x)
works, but adopting it means adding a dependency to `app/requirements.txt` and
pulling a large auto-generated SDK for a 3-endpoint need. This connector instead
uses **`requests`** and **`python-dotenv`**, both already in
`app/requirements.txt` — so it adds **zero new dependencies**. If you later
prefer the official SDK, swap the internals of `asana_client.py`; nothing else
needs to change.

## Files

| File | Role |
|---|---|
| `asana_config.py` | Loads `ASANA_*` env vars (via the app's `.env`). No graph/Flask imports. |
| `asana_client.py` | Thin Asana REST client over `requests` (auth, 429 back-off, pagination, errors). |
| `graph_export.py` | `fetch_plans()` — READ-ONLY Cypher → plan dicts. Assumes the connection is already set. |
| `payload.py` | `build_sections(plans)` — buckets plans into Asana sections/tasks. |
| `connector.py` | **Public entry point** — `sync_plans_to_asana(...)`. |
| `push_to_asana.py` | CLI wrapper (`--dry-run`, `--from-json`, `--project-name`). |
| `export_plans.py` | CLI: graph → `plans_export.json` snapshot + summary. |
| `build_payload.py` | CLI: `plans_export.json` → `asana_payload.json`. |

## Configuration

The connector reads these from the environment (it loads `app/.env.<FLASK_ENV>`,
i.e. `app/.env.development`, the same gitignored file the app already uses):

```
ASANA_ACCESS_TOKEN=0/your-personal-access-token   # https://app.asana.com/0/my-apps
ASANA_WORKSPACE_GID=1112223334445                 # target workspace / organization
ASANA_TEAM_GID=5556667778889                       # required only if the workspace is an Organization
# ASANA_BASE_URL=https://app.asana.com/api/1.0     # optional override
```

> These edits live **outside** this folder (`app/.env.development`), so add them
> yourself. A `--dry-run` needs none of them.

To find the gids: `GET https://app.asana.com/api/1.0/workspaces` and
`.../teams` with your token, or read them off the Asana web URLs.

## CLI usage

```bash
# Preview only — no credentials, no network, no DB write:
python app/asana-connector/push_to_asana.py --dry-run

# Live push, reading plans straight from the graph:
python app/asana-connector/push_to_asana.py --project-name "ATI Plans 2025-2026"

# Live push from a previously saved payload (no DB needed):
python app/asana-connector/push_to_asana.py --from-json asana_payload.json

# Refresh the offline snapshots:
python app/asana-connector/export_plans.py     # graph  -> plans_export.json
python app/asana-connector/build_payload.py     # plans_export.json -> asana_payload.json
```

By default each run creates a **new** project (safe; no in-place mutation).
Pass `--reuse-existing-project` to push into an existing same-named project,
reusing same-named sections.

## Wiring into the Flask app

`sync_plans_to_asana()` is the surface to call. It assumes the neomodel
connection is already configured — which it is inside any Flask request, since
`create_app()` sets it. Because this folder is named `asana-connector` (a hyphen,
so not a normal importable package), load it by path. A ready-to-paste endpoint —
drop into a new MethodView under `app/endpoints/data_api/` and register it like
the other domains:

```python
import importlib.util, os
from flask import current_app, jsonify, request
from flask.views import MethodView

def _load_connector():
    path = os.path.join(current_app.root_path, "asana-connector", "connector.py")
    spec = importlib.util.spec_from_file_location("ati_asana_connector", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

class AsanaSyncView(MethodView):
    def post(self):
        data = request.get_json(silent=True) or {}
        connector = _load_connector()
        summary = connector.sync_plans_to_asana(
            project_name=data.get("project_name"),
            dry_run=bool(data.get("dry_run", False)),
            reuse_existing_project=bool(data.get("reuse_existing_project", False)),
        )
        return jsonify(summary)

# at the file bottom, alongside the other add_url_rule(...) calls:
# data_api_endpoints.add_url_rule(
#     "/asana/sync-plans", view_func=AsanaSyncView.as_view("asana_sync_plans"))
```

`current_app.root_path` is the `app/` directory, so the path resolves to
`app/asana-connector/connector.py`. The connector inserts its own folder onto
`sys.path` on import, so its sibling modules resolve automatically.

### Programmatic use (scripts / tools)

```python
import sys; sys.path.insert(0, "app/asana-connector")
from connector import sync_plans_to_asana
summary = sync_plans_to_asana(dry_run=True)   # connection must already be set for a live run
```

## Behaviour notes

- **Read-only on Neo4j.** The only writes are to Asana.
- **Fails fast.** A live run calls `GET /users/me` first; a bad token errors
  before anything is created.
- **Rate limits.** 429s are retried honouring `Retry-After`. A full ~57-task
  import is ~2 API calls per task (create + place in section); well within
  Asana's per-minute budget with the built-in back-off.
- **Idempotency.** Default = new project per run. The graph `unique_id` in each
  task's notes is the join key if you later add reconciliation; promoting it to a
  dedicated Asana custom field is the recommended next step for true two-way sync.

## Sources

- Asana REST reference: https://developers.asana.com/reference/rest-api-reference
- Official Python SDK (alternative): https://github.com/Asana/python-asana
