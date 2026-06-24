# Deploying the ATI WSGI App on Windows Server / IIS (wfastcgi)

Python **3.14** with a project venv at `C:\www\ati\venv314`, served by IIS via
wfastcgi.

> ## The one gotcha that governs everything below
> IIS web.config `<appSettings>` are **NOT** exposed to the Python process as
> environment variables. wfastcgi reads only its own keys (`WSGI_HANDLER`,
> `PYTHONPATH`, `WSGI_LOG`, `WSGI_DEBUG`). Anything the app reads from
> `os.environ` — `FLASK_ENV`, `FLASK_SECRET_KEY`, `AUTH_*`, `DATABASE_URL`,
> `AUTH_DB_PATH` — must come from **machine environment variables**
> (`setx … /M`) or the **`app/.env.<FLASK_ENV>`** file the app loads at boot.
> Putting them in web.config does nothing. (An earlier version of this doc
> claimed otherwise; that was wrong and caused real outages.)

---

## 1. Prerequisites

- **Python 3.14** installed on the server (per-user or all-users).
- A **Neo4j** the app will use. `.env.production` points `DATABASE_URL` at
  `bolt://…@localhost:7687`, so a local Neo4j — **with the APOC plugin
  installed** (several read queries use `apoc.coll.toSet` / `apoc.convert.toJson`;
  a stock Neo4j has no APOC). Confirm with `RETURN apoc.version();`.

---

## 2. Provision IIS + the venv (scripted)

From the deployed `C:\www\ati`, in an elevated PowerShell:

```powershell
.\Setup-AtiIis.ps1 -AppPoolName "AtiApp"
```

This creates `venv314`, installs `requirements.txt`, registers the FastCGI
application, sets the app pool to **No Managed Code**, writes the **site**
`web.config`, grants IIS permissions, and verifies the import. It is idempotent.

The generated `C:\www\ati\web.config` contains only the wfastcgi keys:

```xml
<add key="PYTHONPATH"    value="C:\www\ati" />
<add key="WSGI_HANDLER"  value="wsgi.application" />
<add key="WSGI_LOG"      value="C:\www\ati\wfastcgi.log" />
<add key="WSGI_DEBUG"    value="0" />
```

with `scriptProcessor` = `C:\www\ati\venv314\Scripts\python.exe|C:\www\ati\venv314\Lib\site-packages\wfastcgi.py`.

> There is no `app/web.config` in the repo anymore — the deploy script is the
> single source of truth for the site config. Never copy a web.config out of the
> source tree onto the site root.

---

## 3. Deploy the code

From your dev machine:

```cmd
deploy_to_dprc_server.cmd
```

It rebuilds the frontend, copies `app\` → `\\DPRC-SERVER\ati\app`, copies
`wsgi.py` → the site root, and touches the site web.config to recycle the pool.
The environment variables in step 4 **survive deploys** (the deploy only touches
code + recycles).

---

## 4. App configuration — environment variables (NOT web.config)

On the server, elevated shell:

```cmd
setx FLASK_ENV production /M
setx FLASK_SECRET_KEY "<paste output of: python -c "import secrets; print(secrets.token_hex(32))">" /M
iisreset
```

- `FLASK_ENV=production` turns Flask DEBUG off **and** makes the app load
  **`app\.env.production`**, which holds the rest of the config: `DATABASE_URL`
  (localhost), `NEO4J_DATABASE`, `AUTH_ENFORCED`, `AUTH_PROVIDER`, `AUTH_ADMINS`,
  `AUTH_ALLOWED_USERS`, `AUTH_DB_PATH`, `AUTH_SESSION_HOURS`, `SESSION_COOKIE_SECURE`.
- `FLASK_SECRET_KEY` is **mandatory in production** — the app refuses to boot
  without a real (≥32-char, non-placeholder) value. A guessable signing key lets
  anyone forge an admin session cookie.

`AUTH_ADMINS` matches by **email or employee_id** (comma-separated). An empty
`AUTH_ALLOWED_USERS` means any active account may log in.

Verify after `iisreset`: `GET http://<host>/ati/auth/v1/me` → `{"enforced":true,…}`.

---

## 5. Auth account store (SQLite)

Accounts are keyed by **email**, which is also the **link to a graph `Person`
node**. `AUTH_DB_PATH` (in `.env.production`) points at
`C:\www\ati\data\auth_users.sqlite3`.

One-time directory + permissions — the app opens the DB in WAL mode and must
create `-wal`/`-shm` side files, so it needs **Modify**, not just Read:

```cmd
mkdir C:\www\ati\data
icacls C:\www\ati\data /grant "IIS AppPool\AtiApp:(OI)(CI)M" /T
```

Manage accounts with the interactive tool. Run it in a shell where
`FLASK_ENV=production` so it resolves the **same** `AUTH_DB_PATH` the app uses —
it prints the path it's editing, so confirm that matches `.env.production`:

```cmd
cd C:\www\ati
app\manage_users.cmd
```

- **[1] Add account** — by email; verifies a matching graph `Person` exists
  (looked up by email), then prompts for the password (hidden input).
- **[6] Add SYSTEM account** — a person-less account (e.g. a sysadmin); bypasses
  the Person check.
- The underlying CLI (`venv314\Scripts\python.exe app\auth\manage_users.py`) also
  has `reset` (wipe + recreate the table after a schema change), `list`,
  `passwd`, `activate`, `deactivate`.

> Every normal account must link to a `Person` whose `email` matches — populate
> Person emails in the graph first, or use the SYSTEM-account option for service
> accounts.

---

## 6. Rollout / hardening

- **Stage auth:** set `AUTH_ENFORCED=0` in `.env.production` first → verify
  `POST /ati/auth/v1/login` + `GET /ati/auth/v1/me` with curl → deploy the
  frontend (login screen appears) → flip `AUTH_ENFORCED=1` → recycle.
- **Protect the config files** (they reference secrets / DB creds):
  `icacls C:\www\ati\web.config /inheritance:r /grant "Administrators:F" "IIS AppPool\AtiApp:R"`
  and the same for `app\.env.production`.
- **HTTPS:** until the site has an HTTPS binding the session cookie travels over
  plain HTTP. Add the binding (campus cert), then set `SESSION_COOKIE_SECURE=1`
  in `.env.production`.

---

## 7. Troubleshooting

- **Instant 500, blank `wfastcgi.log`** → IIS can't launch Python at all: the
  `scriptProcessor` isn't the venv, or the web.config XML is malformed. The real
  error is on the browser's 500 page (browse from the server itself for
  `DetailedLocalOnly`) and Event Viewer — not the log. Recovery: re-run
  `Setup-AtiIis.ps1`.
- **A setting "doesn't take" (e.g. `enforced:false` after you set it)** → it was
  placed in web.config `<appSettings>`, which don't propagate. Move it to a
  machine env var (`setx … /M`) or `.env.production`.
- **"I added a user but login still fails"** → the tool edited a different file
  than the app reads. Run it with `FLASK_ENV=production` and confirm the printed
  `auth DB:` path equals `.env.production`'s `AUTH_DB_PATH`.
- **500 on data endpoints** → APOC missing on the target Neo4j
  (`RETURN apoc.version();`), or `DATABASE_URL` / `NEO4J_DATABASE` pointing at an
  empty database. The app now logs the real cause (chained traceback) to
  `wfastcgi.log`.
