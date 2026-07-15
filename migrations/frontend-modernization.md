# Workstream J — Frontend modernization / rewrite

> **Status 2026-07-14: DEFERRED — runs after the 6-week core window** (see
> [phases/README.md](phases/README.md)). Two new requirements this track inherits from the
> in-window work:
> 1. **Role-aware UI.** Campus-scoped RBAC (ADR-002) enforces server-side from week 5; the
>    frontend must grow route-level role gating (today `Dashboard.js:63` renders Settings for
>    any user and all admin checks are advisory component-level), graceful 403 handling, and
>    role-driven affordances (hide write controls the user's role can't use). CSRF tokens also
>    land here with the axios/Orval rework (accepted deferral F13 in
>    [phases/security-review.md](phases/security-review.md)).
> 2. **CloudFront restoration.** The core window serves the SPA same-origin from the Flask
>    container (deviation #1 — CRA bakes `REACT_APP_API_URL` at build time). This track's
>    runtime `config.json` fix is what makes S3+CloudFront hosting clean; restore it here.

Deep-dive for Workstream J in `aws-scale-refactor-plan.md`. Goal: bring the frontend to current
best practices — typed, contract-driven, well-tested — **incrementally**, keeping the Chakra +
`claude_files/design-sense.md` visual language intact.

## Principles
1. **Contract-first.** The backend OpenAPI spec (Workstream I) is the source of truth; the frontend
   never hand-writes API types or fetchers again.
2. **Strangler-fig, not big-bang.** Stand up the new shell alongside the old app; migrate one area
   at a time behind the same routes. The app stays shippable throughout.
3. **Server state ≠ UI state.** TanStack Query owns everything fetched; React Context owns only
   session/UI state.
4. **Preserve the look.** Re-tool plumbing, keep Chakra + design-sense. Visual redesign is a
   separate, opt-in effort.

## Target stack
| Concern | Today | Target |
|---|---|---|
| Build/dev server | CRA 5 (`react-scripts`, deprecated) | **Vite** |
| Language | JavaScript | **TypeScript** (incremental, `allowJs`) |
| API client | hand-written `services/api/{get,post,put,delete}.js` | **Orval-generated** typed client |
| Server-state/cache | hand-rolled in `DataContext` (manual dedupe) | **TanStack Query** (React Query v5) |
| Dev proxy | `setupProxy.js` | Vite `server.proxy` |
| API base URL | build-time `REACT_APP_API_URL` (baked) | **runtime** config (`/config.json`) |
| Component tests | ~4 axios-mock tests | **RTL + Orval MSW mocks** |
| E2E | none | **Playwright** in CI |
| Design system | Chakra UI + design-sense.md | **unchanged** |
| State (UI/session) | SettingsContext, AuthContext, UserContext | **unchanged** (kept) |

## The contract → client pipeline
```
Flask + Pydantic (Workstream I)  ──►  /ati/openapi.json (committed snapshot)
                                              │
                                          orval (orval.config.ts)
                                              ▼
   src/api/generated/*         → typed client bound to the shared axios instance
   src/api/generated/*.hooks   → useXxxQuery / useXxxMutation (TanStack Query)
   src/api/generated/*.msw     → MSW handlers for tests
```
- Orval's **custom instance/mutator** = the existing `setupAxios.js` axios (already has
  `withCredentials` + the 401→login interceptor). Point its `baseURL` at the runtime config value.
- `npm run gen:api` regenerates from the spec; CI fails if generated output is stale (drift guard,
  pairs with Workstream I's spec-diff check).

## Runtime API base URL (kills the build-time bake)
Today `REACT_APP_API_URL` is compiled into the bundle, so retargeting from `dprc-server` to an AWS
host needs a rebuild. Replace with a tiny `public/config.json` (`{ "apiBaseUrl": "..." }`) fetched
at boot and injected into the axios instance. CloudFront serves per-environment `config.json`; the
same immutable bundle runs in every environment.

## Incremental migration plan
1. **Shell:** new Vite + TS project (or in-place migration of `app/frontend/src`), TypeScript
   config with `allowJs: true` so existing `.js` keeps working. Port `theme.js`, providers, router.
2. **Pipeline:** add `orval.config.ts` + `npm run gen:api`; generate the client against the first
   OpenAPI spec Workstream I produces. Wire Orval's instance to `setupAxios.js`.
3. **Provider swap:** add `QueryClientProvider`; keep existing Context providers. Introduce
   `config.json` runtime base URL.
4. **Area-by-area migration** (each behind its current route, one PR each):
   `report_` → `settings_` → `graph_components` → `campus_plan_` → the rest. For each area: convert
   files to `.tsx`, replace `services/api/*` calls with generated hooks, delete the corresponding
   `DataContext` cache code.
5. **Delete fragile code** as areas land: hand-rolled report/campus-plan caches + in-flight dedupe
   in `context/DataContext.js`, and the `services/api/{get,post,put,delete}.js` fetchers.
6. **Tests:** RTL suites per migrated area using Orval MSW mocks; grow the Playwright E2E flow.
7. **Cutover:** when all areas are TS + hooks, remove `allowJs`, delete CRA config, ship the Vite
   build to S3/CloudFront (Workstream A).

## State-management model (after)
- **TanStack Query:** all server data (reports, evidence trees, indicators, people, ontology).
  Native caching, dedupe, stale-while-revalidate, and StrictMode-double-effect handling — replaces
  the hand-rolled `DataContext` machinery.
- **SettingsContext:** `currentCampus` / `currentAcademicYear` / `currentWorkingGroup` (URL-driven
  UI state). The year default becomes a single source fed by Workstream F (centralized academic
  year), ending the 4-way duplication.
- **AuthContext / AuthGate / UserContext:** unchanged — session identity + "notating as" attribution.

## Testing pyramid
- **Unit/component (Jest/Vitest + RTL):** render components against **Orval MSW mocks** — no live
  backend, fully deterministic. This is the bulk.
- **Contract:** the generated types *are* the contract test; `tsc --noEmit` fails on drift.
- **E2E (Playwright, CI):** login → dashboard → open indicator report → upload a file (S3) → see an
  MCP agent annotation appear. Runs against a seeded ephemeral stack.

## Open questions / spikes
- **Test runner:** stay on Jest, or move to **Vitest** (native to Vite, faster)? Lean Vitest once
  off CRA.
- **In-place vs fresh Vite project** for `app/frontend/src` — decide during the shell step.
- **Orval mode:** confirm `react-query` client + `msw` mock generation; choose split-vs-single file
  output.
- Depends on **Workstream I** emitting a usable OpenAPI spec before area migration can start.
