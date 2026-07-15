# Security review — threat model, findings, and the control plan

Defensive security review of ATI Analysis ahead of the AWS migration, based on a full audit of
`app/auth/`, the endpoint surface, the file store, and the MCP server. Decision-level design
lives in [ADR-002](../adr-002-rbac-and-identity.md); this doc holds the complete findings,
the threat model, the authoritative RBAC artifacts (DDL + matrix), and the traceability table
that maps **every finding to a phase and control — or to an explicitly accepted deferral**.

## 1. Threat model

**What this system protects:** evidence of legal compliance (ADA/§508/Title II) for 23
campuses — institutional records whose *integrity and attribution* matter more than their
confidentiality (most content is organizationally public); plus PII-lite Person data (names,
emails, employee IDs, position-description notes) and credentials.

| Actor | Capability today | What changes |
|---|---|---|
| **A1. Anonymous internet** | Today the app is on a campus network; on AWS it's (likely) publicly reachable. Login is unthrottled; `AUTH_ENFORCED` off = the entire API open | WAF + rate rules, enforced-auth default, lockout (P3/P4); exposure policy question Q2.1 |
| **A2. Any authenticated user** | Can mutate **any** campus's data, forge any attribution, delete any file, reach the Settings/ontology editors | The core gap. RBAC (P1–P4) |
| **A3. Compromised/malicious account** | Same as A2 plus persistence: no audit trail, sessions unrevocable | audit_log + session_epoch + lockout (P1/P4) |
| **A4. Agent/MCP path** | Direct Bolt writes, env-gated, no identity, no audit | Scoped credential, writes off, restricted to maintainer; full fix deferred to track G (accepted) |
| **A5. Supply/history** | Live creds + DB dumps in git history | Rotate + purge (P0) |

Non-goals this window: nation-state resistance, formal compliance certification (FERPA posture
worth a later review), DDoS beyond WAF/ALB defaults.

## 2. Findings register

Verified findings with locations. Severity: ▲ high / ● medium / ○ low.

| # | Finding | Evidence |
|---|---|---|
| F1 ▲ | **No server-side authorization.** Sole gate is `require_login` (`app/auth/guard.py:12-30`) on the data-api blueprint (`app/__init__.py:104-106`). `is_admin` (config-derived, `app/auth/authz.py:23-24`) is used only in the `/me` payload (`routes.py:46`); no endpoint checks it; no 403 exists in `app/`. No per-campus/per-role scoping anywhere. | audit |
| F2 ▲ | **`AUTH_ENFORCED` defaults False** (`app/web_config.py:41`) — unset env ⇒ the entire data-api is anonymous. | audit |
| F3 ▲ | **Attribution client-supplied & spoofable.** `created_by` from request body (`documents.py:146,172,197,208,333,361,397`; `evidence_campus.py:161-167`); `queries/documentation/create.py:180-193` **creates Person nodes from client payloads**. "Notating as" is a frontend choice never bound to the session. | audit |
| F4 ▲ | **No audit logging** of any mutation, anywhere. | audit |
| F5 ▲ | **Login brute-forceable:** no rate limiting in the app (grep clean), no account lockout (`store.py`), unauthenticated `/login`. | audit |
| F6 ▲ | **Stored-XSS via uploads:** no MIME/extension validation (`files.py:35`, `fs/backends/local.py:63`); `GET /files/<key>` serves stored content-type **inline** (`files.py:66-73`) — uploaded HTML/SVG renders same-origin. | audit |
| F7 ● | **Any authenticated user can GET or DELETE any file by key** (`files.py:76-85`); keys are content hashes (unguessable) but circulate in payloads. | audit |
| F8 ● | **No session revocation:** client-side signed cookies; deactivating an account leaves live sessions valid until expiry (12 h). | audit |
| F9 ● | **`SESSION_COOKIE_SECURE` defaults False** (`web_config.py:28`); prod template ships `0` (`web.config.template:74`). | audit |
| F10 ● | **MCP bypasses app auth entirely:** direct Bolt via `GraphExecutor`; writes gated only by `ATI_MCP_ALLOW_WRITE` env (`mcp/config.py:29,47`); no per-user identity on writes. | audit |
| F11 ● | **Secrets in git history** (Neo4j password, OpenAI key, Asana PAT) + DB dumps; repo must stay private until purged. | memory + audit |
| F12 ● | **Frontend gating advisory only:** `AuthGate` is login-vs-not; `Dashboard.js:63` renders Settings (ontology/status-level editors) for any user; `REACT_APP_DISABLE_LOGIN` build-time bypass exists. | audit |
| F13 ○ | **No CSRF tokens** — partially mitigated by `SameSite=Lax` + JSON content-type requirement. | audit |
| F14 ○ | **No password policy** beyond non-empty (`store.py:88-89`); no self-service reset (CLI only). | audit |
| F15 ○ | Permission bit in the graph: `Person.can_approve_yse` — unaudited, outside any store that models users. | schema read |
| F16 ○ | `AUTH_ALLOWED_USERS` empty ⇒ any active account logs in (`authz.py:27-31`) — fine, but undocumented as the default posture. | audit |

Solid foundations worth keeping (not everything is broken): werkzeug password hashing, CORS
explicit allowlist with credentials, `_finalize_secret` failing closed in prod
(`app/__init__.py:9-31`), content-addressed file keys with a strict `^[0-9a-f]{64}$` regex
blocking traversal (`fs/controller.py:23,79-82`), the auth provider seam for SAML.

## 3. Findings → controls traceability

| Finding | Control | Phase | Verified by |
|---|---|---|---|
| F1 | Registry + `before_request`, deny-by-default; shadow→enforce; query-layer `assert_scope` | P1 schema, P2 shadow, P4 enforce | permission-matrix suite; url_map coverage CI test |
| F2 | `AUTH_ENFORCED` default → true (dev opts out explicitly) | P1 | config test |
| F3 | Attribution from session `person_uid`; payload-Person-creation deleted | P1 | endpoint tests: body `created_by` ignored |
| F4 | `audit_log` table; every decision + mutation row (shadow mode is its first writer) | P1 schema, P2 writes | matrix suite asserts denial rows |
| F5 | WAF rate-based rule on login (edge) + lockout `10 fail/15 min` (app) | P3 + P4 | lockout test; WAF rule in HCL |
| F6 | Upload extension+MIME allowlist; presigned-URL downloads (bytes off app origin); `Content-Disposition: attachment` off-allowlist | P4 | `.html` upload rejected; download via presigned URL |
| F7 | Delete requires matrix's delete scope (uploader/WG/campus_admin) via query-layer check | P4 | matrix suite |
| F8 | `session_epoch` bump-to-revoke | P1 schema, P4 wired | revocation test |
| F9 | `SESSION_COOKIE_SECURE` → true outside dev | P1 | config test |
| F10 | Scoped Aura credential; writes default-off; maintainer-only; **full fix (token auth + per-identity audit) = track G — accepted deferral** | P2 (mitigation) | documented in phase-2 exit |
| F11 | Rotate all three secrets; `git-filter-repo` purge; gitleaks CI gate | P0 | gitleaks clean over `--all` |
| F12 | Server enforcement makes UI gating non-security (F1); route-level role gating = **track J — accepted deferral**; `REACT_APP_DISABLE_LOGIN` removed from prod build path | P4 partial | build check |
| F13 | **Accepted deferral to track J** (token plumbing belongs in the Orval/axios rework); mitigations: SameSite=Lax, JSON-only bodies, Secure cookies | — | recorded here |
| F14 | Min-12 password policy + reset flow (SES or admin temp-password) | P4 | reset e2e test |
| F15 | Flag migrated into role assignments; no longer read | P4 (mapping approved P1 Q1.2) | grep: no readers |
| F16 | Posture documented: role assignment is the access model; `AUTH_ALLOWED_USERS` retired once RBAC enforces (a user with no roles can log in and read — by design under reads-systemwide) | P4 | doc + matrix suite |

**Accepted deferrals summary (sign-offs live in the phases/README Decision Log):** F10-full
(MCP token auth → track G), F12-full (role-aware routing → track J), F13 (CSRF tokens →
track J). Each has an in-window mitigation listed above.

## 4. RBAC — authoritative artifacts

Rationale and alternatives in [ADR-002](../adr-002-rbac-and-identity.md). These are the
build-to artifacts.

### 4.1 DDL (lands complete in Phase 1 — no later ALTERs)

```sql
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id                bigserial PRIMARY KEY,
    email             citext UNIQUE NOT NULL,
    password_hash     text,                       -- NULL once SAML-sourced
    display_name      text,
    employee_id       text,
    active            boolean NOT NULL DEFAULT true,
    auth_source       text NOT NULL DEFAULT 'local',   -- 'local' | 'saml'  (the SSO seam)
    person_uid        text,                       -- graph Person.unique_id; backfilled once, then authoritative
    session_epoch     integer NOT NULL DEFAULT 1, -- bump to revoke all sessions
    failed_logins     integer NOT NULL DEFAULT 0,
    locked_until      timestamptz,
    reset_token_hash  text,
    reset_expires     timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE role_assignments (
    id            bigserial PRIMARY KEY,
    user_id       bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role          text NOT NULL CHECK (role IN
                    ('system_admin','campus_admin','wg_lead','contributor','viewer')),
    campus        text,            -- campus abbreviation ('sfsu'); NULL = all campuses
    working_group text,            -- 'web'|'pro'|'ins'|'ste'; meaningful for wg_lead
    granted_by    bigint REFERENCES users(id),
    granted_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role, campus, working_group),
    CHECK (campus IS NOT NULL OR role = 'system_admin')
);
CREATE INDEX ON role_assignments (user_id);

CREATE TABLE audit_log (
    id           bigserial PRIMARY KEY,
    at           timestamptz NOT NULL DEFAULT now(),
    user_id      bigint,             -- deliberately NO FK: the log outlives users
    email        text,               -- denormalized at time of action
    method       text,
    path         text,
    action       text,               -- action-dispatch string, e.g. 'create_campus_plan'
    decision     text NOT NULL,      -- 'allow' | 'deny' | 'shadow_deny'
    campus_scope text,
    target       text,               -- composite identifier / storage key
    ip           inet,
    user_agent   text,
    detail       jsonb
);
CREATE INDEX ON audit_log (at);
CREATE INDEX ON audit_log (user_id, at);

-- Documented now, created with SAML (post-window):
-- CREATE TABLE idp_group_map (idp_group text, role text, campus text, working_group text);
```

### 4.2 Permission matrix (authoritative)

Default policy: **reads systemwide, writes campus-scoped** (pending Q1.1 confirmation).
"Own campus/WG" = a matching `role_assignments` row.

| Capability | viewer | contributor | wg_lead | campus_admin | system_admin |
|---|---|---|---|---|---|
| Read evidence/reports/plans (all campuses) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/update evidence, notes, metrics (own campus) | — | ✓ | ✓ | ✓ | ✓ |
| Upload files / link documents (own campus) | — | ✓ | ✓ | ✓ | ✓ |
| Delete a file | — | own uploads¹ | own WG's | any in campus | any |
| Edit WG plan, minutes, queries | — | — | own WG | all WGs in campus | ✓ |
| Approve / curate evidence (supersedes `can_approve_yse`) | — | — | own WG's indicators | campus-wide | ✓ |
| Edit campus plan, manage YSE assignments | — | — | own WG¹ | ✓ | ✓ |
| Manage Person / org data (campus) | — | — | — | ✓ | ✓ |
| Reference data (indicators, laws, status levels, vocabularies, ontology descriptors) | read | read | read | read | write |
| User/role admin; audit-log read | — | — | — | — | ✓ |

¹ Contested cells — adjudicated from shadow-log evidence in Phase 4 (Q4.1).

### 4.3 Enforcement (summary; mechanics in ADR-002 §3–4)

Registry keyed `(endpoint, method, action-or-None)` → requirement; blueprint `before_request`;
**deny-by-default including registry miss**; CI walks `app.url_map` for coverage;
`RBAC_MODE=off|shadow|enforce` (independent of `AUTH_ENFORCED` — never conflate: staging runs
enforced-auth from day one, RBAC_MODE graduates shadow→enforce). Scope derivation: kind-aware
`campus_from_identifier` → explicit body field → graph-derived `assert_scope` in the sanctioned
query layer for campus-anchorless targets.

## 5. Session & transport posture (end state)

- Cookie: `HttpOnly` ✓ (already), `Secure` ✓ (P1), `SameSite=Lax` ✓, 12 h lifetime (Q1.4),
  payload = `user_id + session_epoch` only — roles load per-request (30 s cache).
- TLS everywhere: ACM at the ALB; Aura is `neo4j+s://`; RDS `sslmode=require`.
- Secrets: only in Secrets Manager, injected as ECS env; `config_gateway` unchanged; gitleaks
  guards the repo.
- Headers (P4, with WAF): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, minimal
  CSP on the SPA shell (report content is same-origin; presigned S3 downloads are off-origin
  by design).

## 6. MCP / agent-path posture (in-window)

The ati-graph MCP server is a **direct-Bolt side door**: it does not traverse Flask, so nothing
in this window's RBAC applies to it. In-window stance (mitigation, not fix): its own
least-privilege Aura credential; `ATI_MCP_ALLOW_WRITE` off by default; stdio transport only,
on the maintainer's machine only; every write feature already early-returns when the flag is
off (verified). The real fix — token auth, per-token scopes, per-identity audit rows — is
track G's first work item and MUST precede hosting the MCP as a service. Until then: **hosting
the MCP = reopening F1.**

## 7. Residual-risk statement (post-window, honest)

After Phase 5: A2/A3 are contained (RBAC + audit + revocation); A1 is contained to WAF/lockout
robustness; A5 closed. Remaining accepted risks: CSRF-token absence (mitigated), MCP side door
(maintainer-only), no MFA on local accounts (SAML brings campus MFA later — worth stating to
stakeholders), FERPA/records-retention posture unreviewed (schedule with CSU counsel
post-cutover), and the frontend still *displays* (not enforces) permissions until track J.
