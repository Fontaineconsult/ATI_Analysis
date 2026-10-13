# Services in the Settings view: plan

Status: built 2026-10-13 with decisions 1 and 2 as recommended (last-run folder shown,
full paths for admins) and the probe deferred. Robustness was the overriding requirement:
an incomplete or broken configuration is reported on its own entry and never stops the
app, the endpoint or the page.

## Goal

A **Settings → Services** page that answers, for an admin, three questions about
`app/services`: what is registered, can each service run on this server, and if not,
what exactly to set. It reads the registry (`app/services/registry.py`) and the same
path checks `create_app()` runs at boot. It never runs a service and never edits
configuration.

## What exists today

- `registry.SERVICES` and `registry.PROGRAMS` declare every service and the external
  programs it needs.
- `ExternalProgram.status()` resolves `ATI_SERVICE_<KEY>_DIR` / `_PYTHON` through
  `config_gateway` and checks the paths. `services_status()` runs it for every
  service, and `create_app()` stores the result in `app.config['SERVICES']` and logs
  any unavailable service.
- Each run leaves a timestamped folder under `services_data_root()/<service>/`.
- Settings is URL-routed (`dashboard/settings/:section`) with a sidebar of sections in
  `SettingsMasterContainer.js`.
- **Admin is UI-only.** `/ati/auth/v1/me` reports `is_admin`, and no endpoint checks it.
  This page shows server folder paths, so it needs a real server-side check.

## Backend

1. **Describe, not just status.** Extend `ExternalProgram.status()` with `module`,
   `dir_setting`, `python_setting`, and `python_source` (`configured` or
   `default .venv`). Add `registry.describe_services()` returning, per service:
   `name, description, entry, available, programs[...], last_run`. Keep
   `services_status()` as the boot check.
2. **Last run, from the run folders.** `last_run` = the newest run folder's UTC
   timestamp, its file count, and the total number of runs. Read only, no file contents.
   Labelled honestly in the UI as the last run folder: a `ServiceResult` is not
   persisted, so this says a run happened, not that it succeeded.
3. **Fresh on every request.** The endpoint recomputes rather than serving the boot
   snapshot. The checks are path lookups, so this costs milliseconds. Note in the UI
   that `web.config` is read when the app pool starts, so a change there shows after a
   recycle.
4. **Endpoint.** `GET /ati/data-api/v1/services` in a new
   `app/endpoints/data_api/services.py` MethodView, registered in the
   `data_api/__init__.py` import list like every other endpoint module. (CLAUDE.md says
   that file should hold the blueprint only, but every endpoint is registered there
   today; follow the code, and flag the doc.)
5. **Server-side admin check.** Add `require_admin()` to `app/auth/guard.py`: when
   `AUTH_ENFORCED` is on and the session identity is not in `AUTH_ADMINS`, return 403
   `admin_required`. Used by this endpoint only for now. The response carries no
   secrets, only setting names and paths, but paths describe the server.
6. **Tests** (`tests/test_services_api.py`): response shape; 403 for a non-admin with
   auth enforced and 200 for an admin; `last_run` from a temp `ATI_SERVICES_DATA_DIR`;
   an unconfigured program shows its problem text.

## Frontend

7. **API.** `fetchServices()` in `services/api/get.js`.
8. **Config.** `settings_components/servicesConfig.js`: availability badges
   (Available = green, Not configured = red, always with the word, never color alone)
   and the help text for where settings go.
9. **Page.** `settings_components/ServicesSettings.js`, in the design-sense canon:
   - Heading and a one-line blurb.
   - Stat strip: Services, Available, Not configured (red top border when above zero).
   - One `Card` per service: name, description, badge, entry point in mono.
   - `Section` **Programs**: a real table (Program, Module, Folder, Interpreter, Status),
     paths in mono, the problem text in the Status cell when not configured.
   - `Section` **Configure**: the exact setting names for that service, and where they
     go: `app/.env.development` locally,
     `Setup-AtiIis.ps1 -ServiceSettings @{ ATI_SERVICE_<KEY>_DIR = '...' }` on the
     server. Open by default when the service is not configured.
   - **Last run** line: "Last run folder 2026-10-12 19:28 UTC, 3 files, 4 runs", or
     "No runs yet".
   - A **Recheck** button that refetches.
   - Loading, error and empty states. A 403 shows "Only admins can see services".
10. **Navigation.** A new sidebar heading **System** with **Services**
    (`/dashboard/settings/services`).
11. **Tests.** Jest + RTL with the inline axios mock: available and unavailable
    services, problem text, stat counts, Recheck refetches, the 403 message.
12. **Accessibility.** Add `settings: services` to `e2e/routes.js` so the axe sweep
    covers it.

## Out of scope

- Running a service from the page. No runner is chosen yet, and a run can write the graph.
- Editing settings from the page. Configuration lives in `web.config` and `.env`;
  writing server configuration from a web request would be a security hole.
- Run history beyond the last folder. That arrives with the runner and a stored result.
- A probe that actually starts each program (`python -m <module> --help` with a
  timeout). A useful later addition: paths can exist while a venv is broken.

## Decisions

1. Include the last-run folder in the first pass? Recommended: yes, it is cheap and
   it is the only sign today that a service has ever run here.
2. Show admins the full server paths, or only configured/not configured?
   Recommended: full paths, since they are what you need to fix a problem.
3. Add the probe now or later? Recommended: later.

## Order of work

Backend 1 to 6 first, with tests, then frontend 7 to 12. About one session for both.
