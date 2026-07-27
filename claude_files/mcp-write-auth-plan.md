# MCP Write-Auth Plan

**Status:** planned, not started. HIGH PRIORITY — blocks enabling `ATI_MCP_ALLOW_WRITE`
on the hosted endpoint. Until this ships, all `*_write` MCP tools (ontology_write,
notes_write, query_write, meeting_minutes_write, people_write) are dormant on
`https://dprc-server.ad.sfsu.edu/mcp`.

**Companion docs:** `app/database/cypher_runner/mcp/mcp-campus-hosting.md` (hosting
recipe this plan extends), `migrations/phases/` (AWS refactor; ADR-002 campus-scoped
RBAC is the long-term auth home).

## Problem

The hosted `/mcp` endpoint is unauthenticated and reachable from three campus
networks. Read-only exposure was an accepted trade-off; writes are not. The write
gate (`ATI_MCP_ALLOW_WRITE`) is a capability switch, not authorization — flipping it
on the box today would let anyone on the campus networks mutate the graph.

Client constraint that shapes everything: the clients are `mcp-remote` (Claude
Desktop) and Claude Code native HTTP. **Bearer headers work everywhere; OAuth works
(mcp-remote has a real flow); NTLM/Kerberos and client certs effectively do not.**

## Decision (discussed 2026-07-23)

Two phases. Phase 1 is deliberately infrastructure-light and nothing in it is
throwaway — Phase 2 only deepens the verification.

### Phase 1 — two-instance split + shared bearer token at IIS

The security boundary is process-level: the public read-only instance NEVER has
write tools registered, so a feature-code bug can't expose them.

1. **Second service instance** `AtiMcpRw`: same code, same `mcp-venv`,
   `ATI_MCP_ALLOW_WRITE=1`, `ATI_MCP_PORT=8322`, loopback-only.
   - `setup_ati_mcp.cmd`: register the second service/task (NSSM or schtasks,
     mirroring `AtiMcp`); per-instance env (NSSM `AppEnvironmentExtra` or a second
     generated `run_ati_mcp_rw.cmd` that sets the two vars before launch — machine
     env vars can't differ per instance, so port/write MUST be process-local).
   - `cycle_ati_mcp.cmd`: cycle + probe BOTH instances (8321 and 8322).
2. **IIS route** `/mcp-rw` -> `http://127.0.0.1:8322/mcp{R:1}`: rewrite rule with a
   condition requiring `{HTTP_AUTHORIZATION}` to exactly match `Bearer <token>`;
   non-matching requests get 404 (indistinguishable from no-such-route), not 401.
   - Same maintenance caveat as the existing `/mcp` rule: `Setup-AtiIis.ps1`
     regenerates web.config and drops hand-added rules — use `-SkipWebConfig` on
     re-runs, and fold both rules into the script when stable.
3. **Token**: 64 hex chars (`secrets.token_hex(32)`), generated ON the box, stored
   only in the IIS rule + writers' client configs. NEVER in the repo (git history
   already needs a credential purge — do not add more).
4. **Audit log (non-optional)**: with a shared token this is the only forensic
   trail. Wrap write-tool registration (one shared decorator in `_appbootstrap` or a
   new `_audit.py`) to append `timestamp | tool | args-summary` to
   `C:\www\ati\logs\mcp-writes.log` on every call.
5. **Client config (writers only)**:
   - Desktop: `npx -y mcp-remote https://dprc-server.ad.sfsu.edu/mcp-rw --header "Authorization: Bearer <token>"`
   - Claude Code: `claude mcp add --transport http ati-graph-rw <url> --header "Authorization: Bearer <token>"`
   - Everyone else keeps read-only `/mcp` unchanged.
6. **Kill switch**: unset `ATI_MCP_ALLOW_WRITE` for the rw instance + cycle — it
   degrades to a second read-only copy. Token rotation = regenerate, update IIS
   rule + writer configs.

### Phase 2 — per-user tokens from the app's auth store (align with ADR-002)

Keep the IIS gate as the coarse outer wall. The rw instance additionally resolves
the bearer token to a person:

- Writers mint personal MCP tokens from the web app (local auth sqlite at
  `AUTH_DB_PATH` already exists; add a token table + management UI or CLI).
- Write tools resolve token -> Person, enforce campus-scoped write permissions
  (ADR-002), and stamp attribution (`created_by`) into the graph — the annotate
  tools currently attribute nothing.
- Revocation is per-person. Audit log gains identity.
- MCP-spec OAuth (mcp-remote supports it) is the eventual endgame but needs an
  authorization server + SAML bridging — belongs inside the AWS refactor window,
  not before.

## Ruled out

- **Windows auth / mTLS at IIS**: Node-based clients won't do the handshakes.
- **In-process header check as the ONLY gate (single instance)**: granular and
  cheap, but the boundary is a feature-code check inside a process that HAS the
  write tools; kept as a possible Phase-2 layer, not the Phase-1 wall.
- **Enabling writes openly**: rejected 2026-07-23.

## Open questions (decide before implementing)

1. **Should reads stay open?** Current stance: yes. But the graph holds names,
   emails, titles, assignments across three campuses — the same IIS gate could
   cover `/mcp` too, at the cost of every reader needing a token.
2. **Who are the writers?** Just Daniel for now -> Phase 1 suffices until the AWS
   window. Working-group leads annotating transcripts this fall -> attribution
   matters sooner; pull Phase 2's per-user tokens forward.
3. mcp SDK version on the box: if Phase 2 does per-tool identity, verify the
   installed SDK exposes the HTTP request via the tool request context.

## Implementation checklist (Phase 1)

- [ ] `setup_ati_mcp.cmd`: provision `AtiMcpRw` (port 8322, write on, loopback)
- [ ] `cycle_ati_mcp.cmd`: cycle + probe both instances
- [ ] IIS: `/mcp-rw` rewrite rule + Authorization condition (document in
      mcp-campus-hosting.md, Step 3.4)
- [ ] Audit-log wrapper for all write-tool registrations
- [ ] Generate token on box; configure writers' clients
- [ ] Verify: handshake on `/mcp-rw` with token succeeds, without token 404s;
      `/mcp` still read-only (42 tools); write round-trip lands + audit line
- [ ] Update mcp-campus-hosting.md + memory; close the high-priority task
