@echo off
setlocal

cd /d "%~dp0..\app\frontend\src"
call npm run build
if errorlevel 1 (
    echo.
    echo Frontend build FAILED. Aborting deployment.
    exit /b 1
)

cd /d "%~dp0"

:: Publish the review matrix tester into app\public_reports\static\review-matrix, so the
:: robocopy below ships the current page. Its sources stay in app\database\ontology\impact-matrix.
call node "%~dp0..\app\database\ontology\impact-matrix\publish-tester.js"
if errorlevel 1 (
    echo.
    echo Review matrix tester publish FAILED. Aborting deployment.
    exit /b 1
)

echo.
echo About to deploy to \\DPRC-SERVER\ati
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul

:: Step 1: Copy the full app folder. Exclude node_modules and the local .env.* files —
:: production config is the host's web.config, never a shipped .env (see deployment\iis-deploy.md).
:: wsgi.py is not in app\ anymore — it lives in this deployment\ folder and is copied in Step 2.
:: Also excluded, because they are this machine's runtime state, not code:
::   data           local uploads and service run folders (app\data\services). The
::                  server's default run-file root is the same path, so shipping it would
::                  show this machine's runs on the server Settings page.
::   auth_users.*   the local login store (password hashes).
::   *.log          local logs.
robocopy "%~dp0..\app" "\\DPRC-SERVER\ati\app" /E /Z /R:2 /W:5 /XD node_modules "%~dp0..\app\data" /XF .env.production .env.development .env.remote auth_users.sqlite3* app.log app-*.log
set rc=%errorlevel%
if %rc% geq 8 (
    echo.
    echo App folder deploy FAILED ^(robocopy exit code %rc%^). Aborting.
    exit /b %rc%
)

:: Step 2: Copy wsgi.py (it lives here in deployment\) to the destination site root
robocopy "%~dp0." "\\DPRC-SERVER\ati" wsgi.py /Z /R:2 /W:5
set rc=%errorlevel%
if %rc% geq 8 (
    echo.
    echo wsgi.py deploy FAILED ^(robocopy exit code %rc%^).
    exit /b %rc%
)

echo.
echo Recycling IIS app pool by touching web.config...
powershell -NoProfile -Command "$f = '\\DPRC-SERVER\ati\web.config'; if (Test-Path $f) { (Get-Item $f).LastWriteTime = Get-Date; Write-Host 'web.config touched — IIS will recycle the app pool.' } else { Write-Host 'web.config not found at' $f '— skipping recycle (check manually).'; exit 1 }"
if errorlevel 1 (
    echo.
    echo WARNING: recycle step skipped. Deploy succeeded but app pool may need a manual restart.
)

echo.
echo Deploy complete.
endlocal
