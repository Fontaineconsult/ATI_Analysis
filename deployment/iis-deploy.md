# Deploying the ATI WSGI App on Windows Server / IIS (wfastcgi)

Python **3.14** with a project venv at `C:\www\ati\venv314`, served by IIS via
wfastcgi.

> ## How configuration is loaded (read this first)
> Production configuration lives **entirely in the site `web.config` `<appSettings>`** —
> it is the single source of truth. The app reads it through **`app/config_gateway.py`**.
>
> In this deployment, wfastcgi **does** inject `<appSettings>` into the worker's
> `os.environ` (confirmed June 2026: keys added only to web.config were read by code that
> only looks at `os.environ`). An earlier version of this doc claimed the opposite — that
> was wrong for this setup. Even so, the gateway does **not** rely on the injection alone:
> it **also parses `web.config` directly** from the site root, so config resolves whether
> or not wfastcgi injects it — and so host scripts run *outside* wfastcgi get the same
> config. Belt and suspenders.
>
> Consequences:
> - **No `.env.production` on the host. No `setx` machine variables.** Put every value in
>   `web.config`.
> - `FLASK_ENV=production` makes the gateway **skip all `.env` files**, so nothing competes
>   with web.config.
> - Resolution order is `os.environ` → `web.config` → (dev only) `.env` → default, so a
>   machine env var still *overrides* web.config if you ever need a one-off, but the
>   canonical home is web.config.
> - The gateway finds the file at `<SiteRoot>\web.config` (one level above the `app`
>   package). If your layout differs, set `ATI_WEB_CONFIG` to its full path.
>
> The full key set is documented in **`web.config.template`** (placeholders, committed
> to the repo).

---

## 1. Prerequisites

- **Python 3.14** installed on the server (per-user or all-users).
- A **Neo4j** the app will use. `DATABASE_URL` typically points at
  `bolt://…@localhost:7687`, so a local Neo4j — **with the APOC plugin installed**
  (several read queries use `apoc.coll.toSet` / `apoc.convert.toJson`; a stock Neo4j has no
  APOC). Confirm with `RETURN apoc.version();`.

---

## 2. Provision IIS + the venv (scripted)

`Setup-AtiIis.ps1` and `web.config.template` live in the repo's `deployment/` folder — copy
them onto the server (or run from a checkout). From the deployed `C:\www\ati`, in an elevated
PowerShell. Pass the two secrets the first time; on later runs they are **preserved** from the
existing web.config if you omit them:

```powershell
.\Setup-AtiIis.ps1 -AppPoolName "AtiApp" `
    -FlaskSecretKey "<python -c \"import secrets; print(secrets.token_hex(32))\">" `
    -DatabaseUrl "bolt://neo4j:<password>@localhost:7687" `
    -AuthAdmins "913678186" -SessionCookieSecure 0 -WsgiDebug 0
```

This creates `venv314`, installs `requirements.txt`, registers the FastCGI application, sets
the app pool to **No Managed Code**, **writes the full `web.config`** (wfastcgi keys **plus
the app's entire runtime config**), grants IIS permissions, and verifies the import. It is
idempotent and backs up the previous `web.config` before each write.

`Setup-AtiIis.ps1` never generates or stores secrets in source: `-FlaskSecretKey` /
`-DatabaseUrl` are operator-supplied, validated (the secret must be ≥32 chars and not a
placeholder — the same check the app enforces at boot), and preserved across re-runs.

> There is no live `web.config` in the repo — only `web.config.template` (placeholders,
> for reference). The deployed file at `C:\www\ati\web.config` holds the real values and is
> not in source control. To edit config by hand, change `C:\www\ati\web.config` and recycle
> the pool.

---

## 3. Deploy the code

From your dev machine, run from the repo's `deployment/` folder:

```cmd
deployment\deploy_to_dprc_server.cmd
```

It rebuilds the frontend, copies `app\` → `\\DPRC-SERVER\ati\app`, copies `wsgi.py` (which
lives in `deployment\`) → the site root, and touches the site web.config to recycle the pool. **`web.config` survives
deploys** (the deploy only touches code + recycles), so your config is untouched.

---

## 4. App configuration — the `web.config` appSettings

Everything the app reads lives in `<appSettings>` of `C:\www\ati\web.config`. Keys (see
`web.config.template` for the annotated, copy-pasteable block):

| Key | Notes |
|---|---|
| `FLASK_ENV` | `production` — turns DEBUG off and makes the gateway web.config-only. |
| `FLASK_SECRET_KEY` | **Mandatory.** 64 hex. The app refuses to boot without a real (≥32-char, non-placeholder) value — a guessable key lets anyone forge an admin cookie. |
| `DEBUG` / `TESTING` | `False` / `False`. (Defaults are already False in code; set explicitly for clarity.) |
| `DATABASE_URL` | `bolt://USER:PASSWORD@HOST:7687`. |
| `NEO4J_DATABASE` | e.g. `neo4j`. |
| `CORS_ORIGINS` | Comma-separated; usually empty for same-origin IIS. |
| `AUTH_ENFORCED` | `1` = login required; `0` = guard is a no-op (staged rollout). |
| `AUTH_PROVIDER` | `local`. |
| `AUTH_ADMINS` | Comma-separated **emails and/or employee_ids**; matching either grants admin. |
| `AUTH_ALLOWED_USERS` | Optional allowlist; empty = any active account may log in. |
| `AUTH_DB_PATH` | `C:\www\ati\data\auth_users.sqlite3`. |
| `AUTH_SESSION_HOURS` | e.g. `12`. |
| `SESSION_COOKIE_SECURE` | `1` only once the site has an HTTPS binding. |
| `ATI_ROTATING_LOG` | Optional; `1` to also write a bounded rotating `app-<pid>.log`. |

Plus the wfastcgi keys `PYTHONPATH`, `WSGI_HANDLER`, `WSGI_LOG`, `WSGI_DEBUG`.

After any edit, recycle: `iisreset` (or restart the app pool). Verify:
`GET http://<host>/ati/auth/v1/me` → `{"enforced":true,…}`.

**Host scripts** (e.g. the user-management tool, schema/label installs) run *outside*
wfastcgi but still read the same config: run them from `C:\www\ati` with
`FLASK_ENV=production` and the gateway parses `C:\www\ati\web.config` for them too.

---

## 5. Auth account store (SQLite)

Accounts are keyed by **email**, which is also the **link to a graph `Person` node**.
`AUTH_DB_PATH` (in `web.config`) points at `C:\www\ati\data\auth_users.sqlite3`.

One-time directory + permissions — the app opens the DB in WAL mode and must create
`-wal`/`-shm` side files, so it needs **Modify**, not just Read:

```cmd
mkdir C:\www\ati\data
icacls C:\www\ati\data /grant "IIS AppPool\AtiApp:(OI)(CI)M" /T
```

Manage accounts with the interactive tool. Run it from `C:\www\ati` in a shell where
`FLASK_ENV=production`, so the gateway resolves the **same** `AUTH_DB_PATH` the app uses —
it prints the path it's editing, so confirm that matches web.config:

```cmd
cd C:\www\ati
set FLASK_ENV=production
app\manage_users.cmd
```

- **[1] Add account** — by email; verifies a matching graph `Person` exists (looked up by
  email), then prompts for the password (hidden input).
- **[6] Add SYSTEM account** — a person-less account (e.g. a sysadmin); bypasses the Person
  check.
- The underlying CLI (`venv314\Scripts\python.exe app\auth\manage_users.py`) also has
  `reset`, `list`, `passwd`, `activate`, `deactivate`.

> Every normal account must link to a `Person` whose `email` matches — populate Person
> emails in the graph first, or use the SYSTEM-account option for service accounts.

---

## 6. Rollout / hardening

- **Stage auth:** set `AUTH_ENFORCED=0` in web.config first → verify
  `POST /ati/auth/v1/login` + `GET /ati/auth/v1/me` with curl → deploy the frontend (login
  screen appears) → set `AUTH_ENFORCED=1` → recycle.
- **Protect web.config** (it holds the secret key + DB creds):
  `icacls C:\www\ati\web.config /inheritance:r /grant "Administrators:F" "IIS AppPool\AtiApp:R"`
- **HTTPS:** until the site has an HTTPS binding the session cookie travels over plain HTTP.
  Add the binding (campus cert), then set `SESSION_COOKIE_SECURE=1` in web.config and recycle.

---

## 7. Troubleshooting

- **Instant 500, blank `wfastcgi.log`** → IIS can't launch Python at all: the
  `scriptProcessor` isn't the venv, or the web.config XML is malformed. The real error is on
  the browser's 500 page (browse from the server itself) and Event Viewer — not the log.
  Recovery: re-run `Setup-AtiIis.ps1`.
- **A setting "doesn't take" (e.g. `enforced:false` after you set it)** → confirm you edited
  `C:\www\ati\web.config` (the *site root*, next to `wsgi.py`) and **recycled the pool**; the
  gateway re-reads the file on boot. A leftover machine env var of the same name *overrides*
  web.config — check `Get-ChildItem Env:` and remove stragglers (`setx` from older deploys).
- **"I added a user but login still fails"** → the tool edited a different sqlite file than
  the app reads. Run it from `C:\www\ati` with `FLASK_ENV=production` and confirm the printed
  `auth DB:` path equals web.config's `AUTH_DB_PATH`.
- **500 on data endpoints** → APOC missing on the target Neo4j (`RETURN apoc.version();`), or
  `DATABASE_URL` / `NEO4J_DATABASE` pointing at an empty database. The app logs the real
  cause (chained traceback) to `wfastcgi.log`.
