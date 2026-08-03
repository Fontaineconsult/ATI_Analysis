@echo off
setlocal EnableDelayedExpansion

rem Harden against a broken caller PATH: on the DPRC box the invoking shell
rem could not resolve System32 tools ('whoami' is not recognized), which made
rem reg/fltmc/net silently fail and masquerade as a missing-elevation error.
rem Prepending System32 here makes every system tool below resolve regardless.
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"
if not defined PATHEXT set "PATHEXT=.COM;.EXE;.BAT;.CMD"
rem ============================================================================
rem setup_ati_mcp.cmd - provision and launch the ati-graph MCP service on the
rem campus box. Run AS ADMINISTRATOR on the host (after a normal app deploy has
rem placed the code at %ATI_ROOT%). IIS routing of /mcp to 127.0.0.1:%MCP_PORT%
rem is done separately (see mcp-campus-hosting.md, Step 3).
rem
rem   setup_ati_mcp.cmd [ati_root]
rem
rem The root defaults to four levels above this script when it lives in the
rem deployed mcp folder (next to server.py), i.e. C:\www\ati when the script is
rem at C:\www\ati\app\database\cypher_runner\mcp\. Otherwise C:\www\ati.
rem
rem What it does (idempotent - safe to re-run):
rem   1. Creates %ATI_ROOT%\mcp-venv and installs app\requirements.txt + mcp SDK
rem   2. Sets machine env vars: ATI_MCP_TRANSPORT/HOST/PORT (loopback-only)
rem   3. Runs --self-test and --check-db validation
rem   4. Writes %ATI_ROOT%\run_ati_mcp.cmd and registers it as a startup
rem      Scheduled Task "AtiMcp" (uses NSSM instead when nssm.exe is on PATH)
rem   5. Probes the live endpoint with a real MCP initialize handshake
rem
rem After a code deploy, restart the service with cycle_ati_mcp.cmd (same folder).
rem
rem Server needs only Python. Node.js is a CLIENT requirement (mcp-remote
rem bridge in Claude Desktop) - do not install it here for this.
rem
rem NOTE: this file must keep CRLF line endings and ASCII-only text; cmd.exe
rem misparses batch files with bare-LF endings (words split mid-token).
rem ============================================================================

set "ATI_ROOT=%~1"
if "%ATI_ROOT%"=="" (
    if exist "%~dp0server.py" (
        for %%I in ("%~dp0..\..\..\..") do set "ATI_ROOT=%%~fI"
    ) else (
        set "ATI_ROOT=C:\www\ati"
    )
)
set "MCP_PORT=8321"
set "VENV=%ATI_ROOT%\mcp-venv"
set "PYEXE=%VENV%\Scripts\python.exe"

echo === ati-graph MCP service setup (rev 2026-07-23d^) ===
echo Root: %ATI_ROOT%   Port: %MCP_PORT% (loopback only)
echo.

rem -- 0. Admin check (setx /M and schtasks SYSTEM need elevation) -------------
rem Capability probe: try writing a throwaway key to HKLM. This tests exactly
rem what we need (machine-level writes) and has no service/driver dependency:
rem "net session" false-fails when LanmanServer is stopped, and "fltmc" can be
rem blocked by driver-access policy even in an elevated shell.
reg add "HKLM\SOFTWARE\AtiMcpSetupProbe" /f >nul 2>&1
if errorlevel 1 (
    echo ERROR: cannot write to HKLM - this prompt does not have effective
    echo        Administrator rights. Diagnostics follow:
    echo.
    echo --- whoami /user ---
    whoami /user
    echo.
    echo --- token integrity (elevated = High or System Mandatory Level^) ---
    whoami /groups | findstr /C:"Mandatory Label"
    echo.
    echo --- raw error from the HKLM write probe ---
    reg add "HKLM\SOFTWARE\AtiMcpSetupProbe" /f
    echo.
    echo If integrity shows High/System yet the probe still fails, HKLM writes
    echo are restricted by policy on this box - fix the policy, or run the
    echo setx /M + schtasks/nssm steps by hand (see mcp-campus-hosting.md^).
    exit /b 1
)
reg delete "HKLM\SOFTWARE\AtiMcpSetupProbe" /f >nul 2>&1

if not exist "%ATI_ROOT%\app\database\cypher_runner\mcp\server.py" (
    echo ERROR: MCP code not found under %ATI_ROOT%\app - run the app deploy first,
    echo        or pass the deploy root:  setup_ati_mcp.cmd C:\path\to\ati
    exit /b 1
)

rem -- 1. Python venv + dependencies -------------------------------------------
if exist "%PYEXE%" (
    echo [1/5] venv already exists - reusing.
    goto :install_deps
)

rem Resolve a Python to build the venv with. Order: 2nd argument, python on
rem PATH, then known install locations (incl. the DPRC box install). Each
rem candidate is validated by actually running it, which also rejects the
rem Windows Store "python.exe" alias stub.
set "PYTHON_EXE="
call :try_python "%~2"
call :try_python python
call :try_python "%SystemRoot%\py.exe"
call :try_python "C:\Users\p913678186\AppData\Local\Programs\Python\Python314\python.exe"
call :try_python "C:\Program Files\Python314\python.exe"
call :try_python "C:\Program Files\Python312\python.exe"
call :try_python "%LocalAppData%\Programs\Python\Python314\python.exe"
call :try_python "%LocalAppData%\Programs\Python\Python312\python.exe"
if not defined PYTHON_EXE (
    echo ERROR: no working Python found. Raw output of each candidate follows:
    echo.
    call :diag_python "%~2"
    call :diag_python python
    call :diag_python "%SystemRoot%\py.exe"
    call :diag_python "C:\Users\p913678186\AppData\Local\Programs\Python\Python314\python.exe"
    call :diag_python "C:\Program Files\Python314\python.exe"
    echo Python installs that exist on this machine:
    for /d %%D in ("C:\Users\*") do if exist "%%D\AppData\Local\Programs\Python" (
        for /d %%P in ("%%D\AppData\Local\Programs\Python\*") do echo   %%P
    )
    for /d %%P in ("C:\Program Files\Python*") do echo   %%P
    for /d %%P in ("C:\Python*") do echo   %%P
    echo.
    echo Re-run with:  setup_ati_mcp.cmd "%ATI_ROOT%" C:\path\to\python.exe
    exit /b 1
)
echo [1/5] Creating venv at %VENV% ...
echo       using: %PYTHON_EXE%
"%PYTHON_EXE%" -m venv "%VENV%"
if errorlevel 1 (
    echo ERROR: could not create venv.
    exit /b 1
)

:install_deps
echo       Installing dependencies (app\requirements.txt + mcp SDK^) ...
"%PYEXE%" -m pip install --quiet --upgrade pip
rem mcp is pinned ^<2: SDK 2.0.0 (released late Jul 2026) removed mcp.server.fastmcp,
rem which server.py imports. Migrating to the 2.x API is a tracked future task.
"%PYEXE%" -m pip install --quiet -r "%ATI_ROOT%\app\requirements.txt" "mcp<2"
if errorlevel 1 (
    echo ERROR: pip install failed. See output above.
    exit /b 1
)

rem -- 2. Machine environment variables ----------------------------------------
echo [2/5] Setting machine env vars (ATI_MCP_TRANSPORT/HOST/PORT^) ...
setx /M ATI_MCP_TRANSPORT streamable-http >nul
setx /M ATI_MCP_HOST 127.0.0.1 >nul
setx /M ATI_MCP_PORT %MCP_PORT% >nul
rem ATI_MCP_ALLOW_WRITE is deliberately NOT set: read-only is the shared default.

rem DATABASE_URL must already exist (same machine var the web app uses).
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v DATABASE_URL >nul 2>&1
if errorlevel 1 (
    if "%DATABASE_URL%"=="" (
        echo WARNING: DATABASE_URL machine variable not found. The service will
        echo          fail to reach Neo4j until you run:
        echo            setx /M DATABASE_URL "bolt://user:pass@dbhost:7687"
    )
)

rem Make the vars live for THIS session so validation below works pre-reboot.
set "ATI_MCP_TRANSPORT=streamable-http"
set "ATI_MCP_HOST=127.0.0.1"
set "ATI_MCP_PORT=%MCP_PORT%"

rem -- 3. Validation ------------------------------------------------------------
echo [3/5] Self-test (tool registration, no DB^) ...
pushd "%ATI_ROOT%"
"%PYEXE%" -m app.database.cypher_runner.mcp --self-test >nul
if errorlevel 1 (
    popd
    echo ERROR: self-test failed - the server cannot even build. Aborting.
    exit /b 1
)
echo       DB connectivity check ...
"%PYEXE%" -m app.database.cypher_runner.mcp --check-db >nul
if errorlevel 1 (
    echo WARNING: --check-db failed (bad/missing DATABASE_URL?^). Continuing -
    echo          the service will start but tools will error until it is fixed.
)
popd

rem -- 4. Runner + service registration -----------------------------------------
echo [4/5] Registering the service ...
if not exist "%ATI_ROOT%\logs" mkdir "%ATI_ROOT%\logs"

> "%ATI_ROOT%\run_ati_mcp.cmd" (
    echo @echo off
    echo rem Generated by setup_ati_mcp.cmd - launches the ati-graph MCP service.
    echo cd /d "%ATI_ROOT%"
    echo "%PYEXE%" -m app.database.cypher_runner.mcp ^>^> "%ATI_ROOT%\logs\mcp.log" 2^>^&1
)

where nssm >nul 2>&1
if not errorlevel 1 (
    echo       NSSM found - installing as Windows service "AtiMcp".
    nssm stop AtiMcp >nul 2>&1
    nssm remove AtiMcp confirm >nul 2>&1
    nssm install AtiMcp "%PYEXE%" "-m app.database.cypher_runner.mcp"
    nssm set AtiMcp AppDirectory "%ATI_ROOT%" >nul
    nssm set AtiMcp AppStdout "%ATI_ROOT%\logs\mcp.log" >nul
    nssm set AtiMcp AppStderr "%ATI_ROOT%\logs\mcp.err.log" >nul
    nssm start AtiMcp
) else (
    echo       NSSM not found - registering startup Scheduled Task "AtiMcp".
    schtasks /End /TN AtiMcp >nul 2>&1
    schtasks /Create /F /TN AtiMcp /SC ONSTART /RU SYSTEM ^
        /TR "\"%ATI_ROOT%\run_ati_mcp.cmd\"" >nul
    if errorlevel 1 (
        echo ERROR: could not create the scheduled task.
        exit /b 1
    )
    schtasks /Run /TN AtiMcp >nul
)

rem -- 5. Live probe -------------------------------------------------------------
echo [5/5] Probing http://127.0.0.1:%MCP_PORT%/mcp (MCP initialize handshake^) ...
> "%TEMP%\ati_mcp_probe.json" echo {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"setup-probe","version":"0"}}}

set "PROBE_OK="
for /L %%i in (1,1,15) do (
    if not defined PROBE_OK (
        curl.exe -s -m 5 -X POST "http://127.0.0.1:%MCP_PORT%/mcp" ^
            -H "Content-Type: application/json" ^
            -H "Accept: application/json, text/event-stream" ^
            -d @"%TEMP%\ati_mcp_probe.json" 2>nul | findstr /C:"serverInfo" >nul
        if not errorlevel 1 ( set "PROBE_OK=1" ) else ( timeout /t 2 /nobreak >nul )
    )
)
del "%TEMP%\ati_mcp_probe.json" >nul 2>&1

if defined PROBE_OK (
    echo.
    echo SUCCESS: ati-graph MCP service is up on 127.0.0.1:%MCP_PORT% (loopback^).
    echo.
    echo Next steps:
    echo   1. IIS: proxy /mcp to http://127.0.0.1:%MCP_PORT%/mcp with ARR + URL Rewrite
    echo      and set proxy responseBufferLimit=0 (mcp-campus-hosting.md, Step 3^).
    echo   2. Clients: install Node.js LTS, then in claude_desktop_config.json:
    echo        "ati-graph": { "command": "npx",
    echo          "args": ["-y","mcp-remote","https://dprc-server.ad.sfsu.edu/mcp"] }
    exit /b 0
) else (
    echo.
    echo ERROR: the service did not answer the handshake. Check %ATI_ROOT%\logs\mcp.log
    exit /b 1
)

rem ---------------------------------------------------------------------------
:try_python
rem Sets PYTHON_EXE to %1 if not already set and %1 actually runs as a Python.
if defined PYTHON_EXE goto :eof
if "%~1"=="" goto :eof
"%~1" -V >nul 2>&1
if not errorlevel 1 set "PYTHON_EXE=%~1"
goto :eof

:diag_python
rem Runs %1 -V with output VISIBLE so the real failure (not found, access
rem denied, wrong path) is exposed instead of being swallowed by redirects.
if "%~1"=="" goto :eof
echo --- trying: %~1
"%~1" -V
echo     exit code was !ERRORLEVEL!
echo.
goto :eof
