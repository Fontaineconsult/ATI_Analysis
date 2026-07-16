# ATI e2e + axe accessibility suite

Playwright end-to-end tests with [axe-core](https://github.com/dequelabs/axe-core)
accessibility scans (WCAG 2.0/2.1 A+AA) across every page of the app.

This directory is intentionally **outside `app/`** (so the IIS deploy robocopy never
ships it) and **outside the CRA `src/`** (so CRA's Jest never picks the specs up).

## Prerequisites

- Node 18+
- Neo4j reachable per `app/.env.development` (the suite reads the live graph, never writes)
- The server's `AUTH_ENFORCED` kill-switch **off** (dev default) — the auth gate must be transparent
- `.venv314` present at the repo root (the interpreter that can run Flask; see project memory)

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

## Running

```bash
npm test              # whole suite — starts Flask + CRA itself if not already running
npm run test:a11y     # just the axe scans
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report (axe JSON attached per test)
```

Both servers are declared as Playwright `webServer`s with `reuseExistingServer: true`:
if you already have `python run.py` and `npm start` running, the suite reuses them;
otherwise it launches and tears them down itself.

## Layout

| File | Purpose |
|---|---|
| `routes.js` | Route manifest — every statically-addressable page. Add new pages here. |
| `fixtures/axe.js` | Shared `test` fixture with a preconfigured `AxeBuilder` (WCAG A/AA tags). |
| `helpers/app.js` | `gotoAndSettle()` — navigate + wait for data/spinners. |
| `helpers/axe-report.js` | Readable violation formatting + JSON attachments. |
| `tests/smoke.spec.js` | App boots, redirects, shell renders. |
| `tests/a11y-routes.spec.js` | The axe sweep — one test per manifest route. |
| `tests/a11y-overlays.spec.js` | Axe scans of open-state UI (header menus; add modals as they get specs). |

## Conventions

- **Read-only by default.** The app talks to the live shared Neo4j DB. Any future spec
  that mutates data must scope everything it creates to the sentinel academic year
  (`9999-9999`), the same isolation rule as the backend pytest suite.
- **A failing axe test is a real finding**, not a flake: the failure message lists each
  violation with impact, help URL, and offending selectors; full JSON is attached to the
  report. Fix the component (see `claude_files/design-sense.md` §6, which maps our widgets
  to their W3C APG patterns) rather than excluding the rule. Rule exclusions need a
  comment justifying them.
- Keyboard-interaction contracts (roving tabindex, arrow keys, focus return) are **not**
  covered by axe — write explicit interaction specs for those (APG patterns define the
  expected behavior).
