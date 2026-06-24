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

echo.
echo About to deploy to \\DPRC-SERVER\ati
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul

:: Step 1: Copy the full app folder (excluding node_modules). wsgi.py is not in
:: app\ anymore — it lives in this deployment\ folder and is copied in Step 2.
robocopy "%~dp0..\app" "\\DPRC-SERVER\ati\app" /E /Z /R:2 /W:5 /XD node_modules
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
