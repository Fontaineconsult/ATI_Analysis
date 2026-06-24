# Deployment

Everything needed to provision and deploy the ATI app to the Windows Server / IIS host
(`C:\www\ati`), where it runs under wfastcgi (FastCGI). The application code lives in
`../app`; this folder holds only the deployment tooling, config, and docs.

## Contents

| File | What it is |
|---|---|
| **`iis-deploy.md`** | The deployment guide — **read this first.** Provisioning, configuration, auth store, rollout, troubleshooting. |
| `Setup-AtiIis.ps1` | Idempotent IIS provisioning (run on the server, elevated): builds `venv314` + wfastcgi, registers the FastCGI app and app pool, and **writes the full `web.config`**. |
| `web.config.template` | Placeholder reference for the production `web.config` `<appSettings>` — the single source of truth the app reads via `app/config_gateway.py`. The live file (`C:\www\ati\web.config`) holds real secrets and is **not** in source control. |
| `wsgi.py` | The WSGI entry point. Deployed to the **site root** (`C:\www\ati\wsgi.py`); exposes `application` (`WSGI_HANDLER=wsgi.application`). |
| `deploy_to_dprc_server.cmd` | Code deploy from a dev machine: builds the frontend, robocopies `app\` + `wsgi.py` to the host, recycles the pool. |

## Quick reference

- **Provision** (once, or on infra change): copy this folder to the server, then from
  `C:\www\ati` run `Setup-AtiIis.ps1 -FlaskSecretKey … -DatabaseUrl …` — see `iis-deploy.md`.
- **Deploy code**: from the repo root, run `deployment\deploy_to_dprc_server.cmd`.
- **Configuration**: lives entirely in `C:\www\ati\web.config` `<appSettings>`; the app reads it
  through `app/config_gateway.py`, which **parses web.config directly** (it does not rely on
  wfastcgi exposing appSettings as env vars). No `.env` file is read in production.

## Deliberately NOT here

- `app/manage_users.cmd` — the account-manager wrapper stays in `app/` because it resolves its
  sibling `auth/` folder in the deployed package.
- `app/requirements.txt` — the app's dependency manifest; deployed with `app/` and installed by
  `Setup-AtiIis.ps1`.
- `run.py`, `run_waitress.bat`, `app/application.py` — local run helpers, not the IIS path.
