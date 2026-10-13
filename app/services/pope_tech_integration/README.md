# pope_tech_integration

Pulls Pope Tech WAVE scan snapshots and records each as a `Metric` node.

## What it calls

PopeTechIntegrator's `ptq metric-snapshot`, the `POPE_TECH` program in
`app/services/registry.py`. It runs as `python -m pope_tech.query_cli` in that
project's own virtualenv with that project as the working directory, so its
`.env` supplies `POPE_TECH_API_KEY`. This repo never holds the key and never
imports `pope_tech`. The call is read-only: `--write` is never passed.

Each run writes one file per campus per date, in the snapshot contract
`popetech-metric-snapshot/1`, into its run folder under
`app/data/services/pope_tech_integration/<UTC timestamp>/`.

ptq exit codes the service handles: `0` all dates written, `5` some dates
skipped (the rest are still saved and the skip is reported), `2` a bad date and
`4` a write request (both fail the run).

## What it writes

With `save=True`, one `Metric` per snapshot through `add_metric`:

| Property | Value |
|---|---|
| `name` | `Pope Tech WAVE errors (<campus>)`, shared by every date for that campus |
| `composite_key` | `<academic year>_popetech_<campus>_<as of>` |
| `metric_type` | `tabular` |
| `single_value` | errors excluding contrast |
| `value_dict` | the whole snapshot |
| `value_schema` | `popetech-metric-snapshot/1`, which the frontend renders as a WAVE category table |
| `measured_on` | the snapshot's `as_of` date |
| `measured_in_year` | the academic year the caller names |

`link_to={campus: year_identifier}` also links each Metric to a YSE through
`has_metric`. A snapshot with `has_data: false`, a different schema, or a key
that already exists is skipped with its reason, and the others still save.

## Entry point

```python
from app.services.pope_tech_integration import pull_metric_snapshots

result = await pull_metric_snapshots(
    academic_year="2025-2026",
    orgs=["sfsu"],                 # None = every org the token reaches
    as_of=["2026-10-01"],          # None = today
    save=True,                     # default False: fetch and keep files only
    link_to={"sfsu": "<year_identifier>"},
)
```

## Configuration

Resolved through `config_gateway` (environment, `web.config`, `.env.<FLASK_ENV>`).

| Setting | Default |
|---|---|
| `ATI_SERVICE_POPE_TECH_DIR` | none; required. The PopeTechIntegrator folder. |
| `ATI_SERVICE_POPE_TECH_PYTHON` | that folder's `.venv` interpreter |
| `ATI_SERVICES_DATA_DIR` | `app/data/services` |

## Tests

`tests/test_services_pope_tech.py` points `ATI_SERVICE_POPE_TECH_DIR` at a temp
folder holding a fake `pope_tech.query_cli` that writes snapshot files, so the
tests need neither Pope Tech nor the integrator. The save tests write under the
sentinel year `9999-9999` and delete what they wrote.
