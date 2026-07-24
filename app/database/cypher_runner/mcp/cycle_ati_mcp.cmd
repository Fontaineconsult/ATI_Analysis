@echo off
setlocal EnableDelayedExpansion

rem Harden against a broken caller PATH (same rationale as setup_ati_mcp.cmd:
rem on the DPRC box the invoking shell could not resolve System32 tools).
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"
if not defined PATHEXT set "PATHEXT=.COM;.EXE;.BAT;.CMD"
rem ============================================================================
rem cycle_ati_mcp.cmd - restart the ati-graph MCP service and verify it serves.
rem
rem Run ON the server (the DPRC box) after a code deploy: the AtiMcp service is
rem a long-running Python process, so deploy_to_dprc_server.cmd copying new code
rem does NOT make the service pick it up - this script is that missing step.
rem
rem   cycle_ati_mcp.cmd [ati_root] [-deps]
rem
rem   ati_root  deploy root (default: derived from this script's location when
rem             deployed, else C:\www\ati)
rem   -deps     also refresh mcp-venv dependencies from app\requirements.txt
rem             before restarting (only needed when requirements changed)
rem
rem What it does:
rem   1. (optional -deps) pip install -r app\requirements.txt + mcp into mcp-venv
rem   2. Stops AtiMcp - handles BOTH mechanisms setup_ati_mcp.cmd may have used:
rem      NSSM Windows service, or startup Scheduled Task
rem   3. Frees port 8321 precisely if a python child survived the stop
rem      (never taskkill python.exe by name - the Flask wfastcgi workers are
rem      python.exe too)
rem   4. Starts AtiMcp again
rem   5. Probes http://127.0.0.1:8321/mcp with a real MCP initialize handshake
rem
rem NOTE: this file must keep CRLF line endings and ASCII-only text; cmd.exe
rem misparses batch files with bare-LF endings (words split mid-token).
rem ============================================================================

rem -- args ---------------------------------------------------------------------
set "ATI_ROOT="
set "DO_DEPS="
for %%A in (%*) do (
    if /I "%%~A"=="-deps" ( set "DO_DEPS=1" ) else ( set "ATI_ROOT=%%~A" )
)
if "%ATI_ROOT%"=="" (
    if exist "%~dp0server.py" (
        for %%I in ("%~dp0..\..\..\..") do set "ATI_ROOT=%%~fI"
    ) else (
        set "ATI_ROOT=C:\www\ati"
    )
)
set "MCP_PORT=8321"
set "PYEXE=%ATI_ROOT%\mcp-venv\Scripts\python.exe"

echo === ati-graph MCP service cycle ===
echo Root: %ATI_ROOT%   Port: %MCP_PORT%
echo.

if not exist "%PYEXE%" (
    echo ERROR: %PYEXE% not found - run setup_ati_mcp.cmd first.
    exit /b 1
)

rem -- 1. Optional dependency refresh --------------------------------------------
if defined DO_DEPS (
    echo [1/4] Refreshing mcp-venv dependencies ...
    "%PYEXE%" -m pip install --quiet --upgrade pip
    "%PYEXE%" -m pip install --quiet -r "%ATI_ROOT%\app\requirements.txt" mcp
    if errorlevel 1 (
        echo ERROR: pip install failed - NOT restarting on top of a broken venv.
        exit /b 1
    )
) else (
    echo [1/4] Dependency refresh skipped (pass -deps to include it^).
)

rem -- 2. Stop -------------------------------------------------------------------
sc query AtiMcp >nul 2>&1
if not errorlevel 1 ( set "MECHANISM=service" ) else ( set "MECHANISM=task" )
echo [2/4] Stopping AtiMcp (%MECHANISM%^) ...
if "%MECHANISM%"=="service" (
    sc stop AtiMcp >nul 2>&1
) else (
    schtasks /End /TN AtiMcp >nul 2>&1
)
timeout /t 3 /nobreak >nul

rem Free the port precisely if a python child survived the stop.
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort %MCP_PORT% -State Listen -ErrorAction SilentlyContinue; if ($c) { Stop-Process -Id $c[0].OwningProcess -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1 }"

rem -- 3. Start ------------------------------------------------------------------
echo [3/4] Starting AtiMcp ...
if "%MECHANISM%"=="service" (
    sc start AtiMcp >nul
    if errorlevel 1 (
        echo ERROR: sc start AtiMcp failed - check the service:  sc query AtiMcp
        exit /b 1
    )
) else (
    schtasks /Run /TN AtiMcp >nul
    if errorlevel 1 (
        echo ERROR: schtasks /Run AtiMcp failed - is the task registered?
        echo        schtasks /Query /TN AtiMcp   ^(re-run setup_ati_mcp.cmd if not^)
        exit /b 1
    )
)

rem -- 4. Live probe (same handshake as setup_ati_mcp.cmd) ------------------------
echo [4/4] Probing http://127.0.0.1:%MCP_PORT%/mcp (MCP initialize handshake^) ...
> "%TEMP%\ati_mcp_probe.json" echo {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"cycle-probe","version":"0"}}}

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
    echo SUCCESS: AtiMcp cycled - the service is serving the freshly deployed code.
    exit /b 0
) else (
    echo.
    echo ERROR: the service did not answer the handshake after restart.
    echo        Check %ATI_ROOT%\logs\mcp.log and %ATI_ROOT%\logs\mcp.err.log
    exit /b 1
)
