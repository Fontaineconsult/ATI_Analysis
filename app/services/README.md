# Services

A service is work that calls something outside this app, keeps a local copy of
what came back, and records the result in the graph. Each service is one
package in this folder.

Most services wrap an **external program**: another Python project with its own
folder, its own virtualenv and its own secrets. The app never imports it. The
service runs it as a subprocess, `<python> -m <module> <args>`, with the
program's folder as the working directory so the program loads its own `.env`.

How a service gets run (a scheduled task, a queue worker, an endpoint, a direct
call to Claude) is not decided yet and depends on the final deployment. Until
then, every service exposes an `async` entry point that a future runner awaits.

## Layout

```
app/services/
  README.md                 this file
  registry.py               PROGRAMS and SERVICES, and services_status()
  external.py               ExternalProgram: locate, check and run an outside program
  _support.py               shared: run folders, async subprocess calls, ServiceResult
  <service_name>/
    README.md               what it calls, what it writes, how to configure it
    __init__.py             exports the entry point
    config.py               constants (contract names, exit codes, timeouts)
    fetch.py                the external call; no graph code
    store.py                the database calls; no external calls
    service.py              the async entry point that joins fetch and store
```

Package names use underscores so they import (`pope_tech_integration`).

## Where an external program lives

Configuration, resolved through `app/config_gateway.py` like every other
setting: the environment, then `web.config`, then `.env.<FLASK_ENV>`.

| Setting | Meaning |
|---|---|
| `ATI_SERVICE_<KEY>_DIR` | The program's folder. Required. |
| `ATI_SERVICE_<KEY>_PYTHON` | Its interpreter. Optional; defaults to `<folder>/.venv`. |
| `ATI_SERVICES_DATA_DIR` | Root for run folders. Optional; defaults to `app/data/services`. |

Nothing is guessed. An unset setting, a missing folder or a missing interpreter
makes the program "not configured", and a run refuses to start with that reason.

## The app's view of its services

`create_app()` calls `registry.services_status()` once at boot and stores the
answer in `app.config['SERVICES']`:

```python
{"pope_tech_integration": {
    "available": True,
    "description": "...",
    "entry": "app.services.pope_tech_integration.service:pull_metric_snapshots",
    "programs": [{"program": "POPE_TECH", "configured": True,
                  "dir": "...", "python": "...", "problem": None}]}}
```

The check looks at paths only and runs nothing. An unavailable service is
logged as a warning and does not stop the app.

Admins see the same information, checked fresh, at **Settings > Services**
(`GET /ati/data-api/v1/services`, admin-only on the server): each program's
folder and interpreter, the exact problem when one is missing, the settings to
set, and the newest run folder.

**An incomplete configuration never crashes anything.** Every check here reports
a problem on its own entry instead of raising: an unset or unreadable setting,
a missing or unusable path, an unknown program, a malformed registry entry, an
unreadable run folder. The boot check is guarded as a whole, the endpoint
answers 200 whatever state the services are in, and the page contains a card
that fails to render to that card. Keep it that way when adding to this folder.

## Adding a service that wraps another Python program

1. **Declare the program** in `registry.PROGRAMS`:
   `ExternalProgram(key="MY_TOOL", label="...", module="my_tool.cli")`.
2. **Write the package** `app/services/my_tool_<verb>/` with the layout above.
   `fetch.py` calls `get_program("MY_TOOL").run([...args])`.
3. **Declare the service** in `registry.SERVICES`, with its entry point
   (`"module:function"`) and `programs=("MY_TOOL",)`.
4. **Configure it**: `ATI_SERVICE_MY_TOOL_DIR` in `app/.env.development` locally
   and in the deployed `web.config` (placeholders in
   `deployment/web.config.template`).
5. **Test it** in `tests/test_services_<service>.py`, with a fake module in a
   temp folder pointed to by the same setting.
   `tests/test_services_registry.py` already checks that every declared
   service names known programs and an importable entry point.

## Rules

1. **Async entry point.** `async def <verb>_<thing>(...) -> ServiceResult`.
   Blocking work runs off the event loop: external programs through
   `ExternalProgram.run`, and graph writes through `asyncio.to_thread`.
2. **Fetch and store stay apart.** `fetch.py` never imports the queries layer,
   and `store.py` never calls out. A fetch-only run can then be tested without
   a database, and a store can be tested without the outside program.
3. **Graph writes use the queries layer.** `store.py` calls the sanctioned
   create functions in `app/database/queries/<domain>/create.py`, never raw
   Cypher, so every write gets the same checks as the app's own. `store.py`
   imports `app.endpoints.data_api` first to avoid the circular import.
4. **Saving is opt-in.** The entry point takes `save=False` by default, so a
   run only writes to the graph when its caller asks.
5. **External calls are read-only** unless the service exists to change
   something, and then that is stated in its README.
6. **Local support files** go in a per-run folder from
   `_support.new_run_dir(service_name)`. A run that wrote the graph can be
   traced back to the files it read.
7. **One bad item does not stop the run.** Record it with
   `ServiceResult.skip(item, reason)` and continue; use `fail()` only when the
   run as a whole could not proceed.
8. **Secrets stay with the program that owns them.** This repo stores where a
   program lives, never its credentials.

## Services

| Service | Program | Writes |
|---|---|---|
| [`pope_tech_integration`](pope_tech_integration/README.md) | `POPE_TECH`: PopeTechIntegrator `ptq metric-snapshot` (read-only) | One `Metric` per campus per date |
