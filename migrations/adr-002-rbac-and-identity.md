# ADR-002 — Campus-scoped RBAC and the identity model

- **Status:** Accepted (two policy cells open — see Open policy questions)
- **Date:** 2026-07-14
- **Deciders:** Daniel Fontaine

## Context

The security audit (full detail in
[phases/security-review.md](phases/security-review.md)) found that server-side authorization
**does not exist**: the only gate is `require_login` (authenticated-or-not) on the data-api
blueprint; `is_admin` is computed from the `AUTH_ADMINS` env but never enforced by any
endpoint; attribution (`created_by` / `uploaded_by`) is client-supplied and spoofable; there is
no audit trail, no rate limiting, and no session revocation. Meanwhile the platform is headed
to **23 campuses and low-thousands of users** with distinct permission needs. The auth store is
a SQLite sidecar with no role or campus columns and no link to graph `Person` nodes; a stray
permission bit (`Person.can_approve_yse`) lives as an unaudited graph property.

Locked constraints: local accounts now, SAML university SSO later (provider seam preserved);
single shared graph (campus is data, not a tenant boundary).

## Decision

### 1. Five fixed roles, campus-scoped assignments, relational store

Roles: `system_admin`, `campus_admin`, `wg_lead`, `contributor`, `viewer`. Roles are a **CHECK
constraint, not a table** — the permission matrix lives in code where it is reviewable and
testable; a roles table invites a premature role-editing UI. Assignments are rows in Postgres:

```sql
role_assignments (
    user_id       → users.id,
    role          CHECK (role IN ('system_admin','campus_admin','wg_lead','contributor','viewer')),
    campus        text,      -- campus abbrev ('sfsu'); NULL = all campuses
    working_group text,      -- 'web' | 'pro' | 'ins' | 'ste'; meaningful for wg_lead
    granted_by, granted_at,
    UNIQUE (user_id, role, campus, working_group),
    CHECK (campus IS NOT NULL OR role = 'system_admin')
)
```

The full `users` / `role_assignments` / `audit_log` DDL lands with the Postgres auth store in
Phase 1 (schema complete on day one — **no ALTERs later**) and is reproduced in
[phases/security-review.md](phases/security-review.md).

### 2. Default scope policy: reads systemwide, writes campus-scoped

Every authenticated role can read every campus's data; **only mutations are campus-scoped**.
Rationale: the ATI is one systemwide initiative with shared indicators; the app's observed
behavior is already cross-campus-read (campus filters are optional in every Cypher read); and
this halves the enforcement problem — scope derivation runs only on POST/PUT/DELETE, where the
payload carries an identifier. *This is a policy default pending confirmation — Phase 1
blocking question.*

### 3. Enforcement: central registry + blueprint `before_request`, deny-by-default

A per-endpoint decorator cannot work cleanly because the codebase's action-dispatch pattern
hides the operation in the JSON body (`data.get('action')`). Instead:

- One **permission registry** module maps `(endpoint, method, action-or-None) → Requirement`.
- A blueprint-level `before_request` authenticates, loads the principal + role assignments,
  peeks the `action` from the (cached) JSON body, looks up the registry, and allows/denies.
- **Deny-by-default including on registry miss** — an unregistered endpoint fails closed,
  loudly. A CI test walks `app.url_map` and asserts every data-api rule × method has a registry
  entry, so "did we forget an endpoint?" is a red build, not an audit question.
- **`RBAC_MODE = off | shadow | enforce`** — a separate knob from `AUTH_ENFORCED`. Shadow mode
  computes and logs every decision without blocking; it runs on staging for ~2 weeks before
  enforcement flips (Phase 2 → Phase 4). This is what makes RBAC independently buildable and
  testable.
- Common case requires **zero edits inside the ~26 MethodView modules**; the registry is one
  reviewable file.

### 4. Campus-scope derivation (priority order)

1. **Composite identifiers** in body/path — `2025-2026-5.2-pro-sfsu` carries the campus. A new
   kind-aware `campus_from_identifier(identifier, kind)` parser joins the `make_*` builders in
   `app/database/identifiers.py`. Kind-aware because campus position differs: last segment of
   YSE and campus-plan identifiers, second-to-last of working-group-plan identifiers
   (`2025-2026-sfsu-web`); asset identifiers may end in `systemwide`. Parsed abbrevs are
   validated against the known campus list — never trust a suffix blindly.
2. **Explicit `campus` field** in the request body (uploads, direct creates).
3. **Graph-derived, in the query layer** for campus-anchorless nodes (Note/Document/Message/
   implementations, `DELETE /files/<key>`): the sanctioned `queries/<domain>` mutation resolves
   the owning campus via the YSE edge (one Cypher hop) and calls `authz.assert_scope(campus)`
   before mutating. This extends the codebase's existing invariant idiom ("the create function
   is the only sanctioned path") with a scope assertion. Middleware is the coarse gate; the
   query layer is defense in depth.

### 5. Sessions carry identity, never roles

The session cookie carries only `user_id + session_epoch`. Role assignments are loaded
per-request from Postgres (~30 s in-process TTL cache). Consequences:

- **SAML-ready:** where assignments come from (CLI grant now, IdP-group sync later) is
  invisible to enforcement. The seam is the `auth_source` column on `users` plus a future
  `idp_group_map(idp_group → role, campus)` table — documented now, created later.
- **Session revocation without Redis:** bump `users.session_epoch` and every outstanding cookie
  for that user dies at next request. (Closes the "deactivation doesn't kill live sessions"
  audit finding.)

### 6. Auth-user ↔ graph-Person: explicit `person_uid` column

No runtime email matching — graph Person emails aren't guaranteed present or current, and
`Person.name`'s global unique index is already collision-prone. Email match is used **once** as
a backfill heuristic producing a human-reviewed mapping report; after that `users.person_uid`
is authoritative. All attribution writes use the **session's** person_uid — this closes the
spoofable-attribution hole (`documents.py:146`, `documentation/create.py:180-193`). New users
get their Person link at provisioning time.

### 7. `Person.can_approve_yse` is superseded

Approval capability = `wg_lead` / `campus_admin` in the matrix. The graph flag migrates into
role assignments during Phase 4 seeding and stops being read — a permission bit in an unaudited
graph property is precisely what the RBAC store replaces. *Who currently holds the flag and
what role they map to is a Phase 1 checkpoint question.*

## Permission matrix (summary — authoritative copy in security-review.md)

| Capability | viewer | contributor | wg_lead | campus_admin | system_admin |
|---|---|---|---|---|---|
| Read evidence/reports/plans (all campuses) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/update evidence, notes, metrics (own campus) | — | ✓ | ✓ | ✓ | ✓ |
| Upload files / link documents (own campus) | — | ✓ | ✓ | ✓ | ✓ |
| Delete a file | — | own uploads | own WG's | any in campus | any |
| Edit WG plan, minutes, queries | — | — | own WG | all WGs in campus | ✓ |
| Approve/curate evidence | — | — | own WG's indicators | campus-wide | ✓ |
| Edit campus plan, manage YSE assignments | — | — | own WG | ✓ | ✓ |
| Manage Person/org data (campus) | — | — | — | ✓ | ✓ |
| Reference data (indicators, laws, vocabularies) | read | read | read | read | write |
| User/role admin, audit-log read | — | — | — | — | ✓ |

## Open policy questions (answered in Phase 1, logged in phases/README.md)

1. Confirm **reads systemwide** — or must any role's reads be campus-restricted? (If reads are
   scoped too, every Cypher read needs a mandatory campus filter and the plan must be resized.)
2. `can_approve_yse` migration mapping — who holds it today, which role do they get?
3. May a **contributor delete their own uploads** (matrix default: yes)?

## Consequences

- Provisioning stays CLI (`manage_users.py` grows grant/revoke/list-roles); role-admin UI is
  deferred to track F.
- The MCP server remains an acknowledged RBAC bypass (direct Bolt, env-gated writes, restricted
  to the maintainer) until track G adds per-token identity — documented in security-review.md.
- Frontend role-gating (route-level) becomes a requirement absorbed by deferred track J; until
  then UI checks remain advisory and the server is the enforcement point.
