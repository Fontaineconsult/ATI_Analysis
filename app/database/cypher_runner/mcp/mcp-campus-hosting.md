# ati-graph MCP server — campus hosting setup guide

Run the MCP server once on the campus box; Claude Desktop on any campus
machine (SFSU, Sonoma, East Bay) connects to `https://dprc-server.ad.sfsu.edu/mcp`.
No project checkout on client machines, **no new firewall ports** (443 only),
no public internet exposure.

Architecture (decided 2026-07): the MCP service binds **loopback only**
(127.0.0.1:8321) and IIS reverse-proxies `/mcp` to it over 443 — the endpoint
inherits the exact network perimeter the web app already has, which is what
makes it reachable from the partner campuses without any port-opening request.
Connections always originate from the client machine (a local bridge process),
never from Anthropic's cloud.

## Prerequisites — who needs what

| Where | Needs | Why |
|---|---|---|
| Campus box (server) | Python 3.12+ on PATH; the deployed app tree at `C:\www\ati` | Runs the MCP service. **Node.js is NOT needed here.** |
| Each client machine | Node.js LTS + Claude Desktop (or Claude Code) | Node runs the `mcp-remote` bridge that connects out to the campus URL |

## Step 1 — deploy the app as usual (server)

`deploy_to_dprc_server.cmd` already robocopies `app\` (which contains
`app\database\cypher_runner\mcp\`, including this doc and the setup script) to
the host. Nothing MCP-specific to do.

## Step 2 — run the setup script (server, elevated prompt)

```cmd
cd C:\www\ati\app\database\cypher_runner\mcp
setup_ati_mcp.cmd
```

The script auto-derives the deploy root from its own location when it sits in
the deployed `mcp` folder (next to `server.py`); pass the root as the first
argument to override. It is idempotent (safe to re-run) and does, in order:

1. Creates `C:\www\ati\mcp-venv` and installs `app\requirements.txt` + the `mcp`
   SDK. (The wfastcgi venv is left untouched — the MCP server needs
   `neomodel >= 6`, the same requirement behind the dev-machine venv split.)
2. Sets machine env vars: `ATI_MCP_TRANSPORT=streamable-http`,
   `ATI_MCP_HOST=127.0.0.1` (loopback only), `ATI_MCP_PORT=8321`.
   `ATI_MCP_ALLOW_WRITE` is deliberately NOT set — see Security below.
   Warns if `DATABASE_URL` (the same machine var the web app uses) is missing:
   `setx /M DATABASE_URL "bolt://user:pass@dbhost:7687"`.
3. Validates: `--self-test` (tool registration) and `--check-db` (Neo4j).
4. Registers the service — NSSM service if `nssm.exe` is on PATH, otherwise a
   SYSTEM startup Scheduled Task named `AtiMcp` running the generated
   `C:\www\ati\run_ati_mcp.cmd` — and starts it. Logs: `C:\www\ati\logs\mcp.log`.
5. Probes `http://127.0.0.1:8321/mcp` with a real MCP `initialize` handshake
   and reports SUCCESS only when the server answers.

Manual probe any time (on the box). Body goes via a temp file — PowerShell
strips the JSON's double quotes from inline `-d` arguments to curl.exe:

```powershell
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' |
  Out-File -Encoding ascii "$env:TEMP\probe.json"
curl.exe -s -X POST http://127.0.0.1:8321/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "@$env:TEMP\probe.json"
# expect: event: message / data: {...,"serverInfo":{"name":"ati-graph",...}}
```

Env-var note: do NOT use `FASTMCP_HOST`/`FASTMCP_PORT` — the installed SDK's
FastMCP ignores its own env vars; `ATI_MCP_HOST`/`ATI_MCP_PORT` are passed
through explicitly by our server code.

## Step 3 — IIS: route /mcp to the service (server)

All commands in an **elevated PowerShell** on the box.

### 3.1 Install the two IIS modules (one-time)

URL Rewrite must be installed **before** ARR (ARR depends on it):

```powershell
$dl = $env:TEMP
Invoke-WebRequest 'https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi' -OutFile "$dl\rewrite.msi"
Invoke-WebRequest 'https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi' -OutFile "$dl\arr.msi"
Start-Process msiexec -ArgumentList '/i',"$dl\rewrite.msi",'/qn','/norestart' -Wait
Start-Process msiexec -ArgumentList '/i',"$dl\arr.msi",'/qn','/norestart' -Wait
iisreset
```

Verify both loaded:

```powershell
Get-WebGlobalModule | Where-Object Name -match 'Rewrite|ApplicationRequestRouting'
# expect: RewriteModule and ApplicationRequestRoutingModule
```

### 3.2 Enable proxying and kill response buffering (server-wide, one-time)

```powershell
Import-Module WebAdministration
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
  -Filter 'system.webServer/proxy' -Name enabled -Value $true
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
  -Filter 'system.webServer/proxy' -Name responseBufferLimit -Value 0
```

`responseBufferLimit=0` is **mandatory**: streamable-http responses stream
(SSE-style) and ARR buffers by default, which makes clients hang silently on
`initialize` while the loopback probe works fine.

Optional, for long-lived quiet streams: raise ARR's 2-minute proxy timeout —
`Set-WebConfigurationProperty ... -Filter 'system.webServer/proxy' -Name
timeout -Value ([TimeSpan]::FromMinutes(10))`. Usually unnecessary
(`mcp-remote` reconnects), so skip unless streams visibly drop.

### 3.3 Add the rewrite rule to the site's web.config

Edit `C:\www\ati\web.config` and insert the `<rewrite>` block inside
`<system.webServer>` (alongside `<handlers>`):

```xml
<system.webServer>
  <rewrite>
    <rules>
      <rule name="ati-mcp-proxy" stopProcessing="true">
        <match url="^mcp(/.*)?$" />
        <action type="Rewrite" url="http://127.0.0.1:8321/mcp{R:1}" />
      </rule>
    </rules>
  </rewrite>
  <handlers>
    ... existing AtiHandler ...
```

Saving web.config recycles the app pool automatically — that's expected.
The rewrite module runs before the wildcard `AtiHandler` FastCGI mapping, so
`/mcp` never reaches Flask; everything else is untouched.

**Maintenance caveat:** `Setup-AtiIis.ps1` regenerates this web.config and
will drop the rule. It makes a timestamped `web.config.bak-*` first, and
supports `-SkipWebConfig` to leave the file alone — use that flag on re-runs,
or re-paste the rule from the backup. (Fold the rule into the script when this
setup stabilizes.)

### 3.4 Verify through IIS

Same probe as Step 2 but through the front door. Send the JSON via a temp
file: PowerShell strips embedded double quotes when passing inline `-d`
arguments to curl.exe, and the server then answers `-32700 Parse error`
(which, silver lining, still proves the proxy round-trip works).

```powershell
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' |
  Out-File -Encoding ascii "$env:TEMP\probe.json"
curl.exe -s -X POST https://dprc-server.ad.sfsu.edu/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "@$env:TEMP\probe.json"
# expect: event: message / data: {...,"serverInfo":{"name":"ati-graph",...}}
```

Then repeat from any campus workstation.

Troubleshooting:
- **404 / React page** → rule not active: check it's inside `<system.webServer>`
  in `C:\www\ati\web.config` and RewriteModule is loaded (3.1).
- **502.3 Bad Gateway** → the loopback service isn't answering: re-run the
  Step 2 probe against `http://127.0.0.1:8321/mcp`; check
  `C:\www\ati\logs\mcp.log` and `schtasks /Query /TN AtiMcp` (or `nssm status
  AtiMcp`).
- **Hangs on initialize (probe works on loopback)** → buffering:
  re-check `responseBufferLimit` is `0` (3.2), then `iisreset`.
- **Works locally, fails from other campuses** → perimeter/firewall between
  campuses on 443; confirm the web app itself loads from that campus first.

## Step 4 — client machines: Claude Desktop

1. Install **Node.js LTS** (this is the only client prerequisite beyond Claude
   Desktop itself — it runs the `mcp-remote` bridge).
2. Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ati-graph": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://dprc-server.ad.sfsu.edu/mcp"]
    }
  }
}
```

3. Restart Claude Desktop — the ati-graph tools appear under the 🔌 menu.

Claude Code on any campus machine, same endpoint:

```
claude mcp add ati-graph -- npx -y mcp-remote https://dprc-server.ad.sfsu.edu/mcp
```

HTTPS on the host's real certificate means no `--allow-http` flag anywhere.

## Security posture

- **Read-only.** `ATI_MCP_ALLOW_WRITE` stays unset: the endpoint has no
  authentication and is reachable from three campuses' networks — every laptop
  on those networks could otherwise write to the graph. Writes require real
  auth first.
- The service itself is invisible to all networks (loopback bind); IIS on 443
  is the only door, and it's the same door the web app already guards.
- `ATI_MCP_CATEGORIES` can narrow the exposed tool categories if desired.

## Fallback — direct port (only if the IIS route is unavailable)

Set `ATI_MCP_HOST=0.0.0.0`, open 8321 to the campus CIDRs
(`New-NetFirewallRule ... -LocalPort 8321 -RemoteAddress <campus-CIDRs>`), and
point clients at `http://dprc-server.ad.sfsu.edu:8321/mcp` with `--allow-http`
added to the mcp-remote args. Plain HTTP and a port-opening request — prefer
the proxy.

## What this does NOT enable

claude.ai (web/mobile) custom connectors and cloud-hosted agents connect from
Anthropic's infrastructure, not from your machine — they cannot reach a
campus-internal endpoint even on 443, because the perimeter blocks them.
Exposing this publicly would require real authentication (OAuth) first; treat
that as a separate project, not a config flip.
