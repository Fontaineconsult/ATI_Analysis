@echo off
setlocal

rem ===========================================================================
rem  ATI - Local Account Manager (interactive)
rem  Wraps app\auth\manage_users.py. Deployed at C:\www\ati\app\manage_users.cmd.
rem  Double-click it, or run it from a shell. Passwords are entered through the
rem  Python prompt (hidden), never typed into this window.
rem ===========================================================================

set "HERE=%~dp0"
set "SCRIPT=%HERE%auth\manage_users.py"

rem Locate the app's Python: server uses <site-root>\venv314, dev uses .venv314,
rem otherwise fall back to whatever 'python' is on PATH.
set "PY=%HERE%..\venv314\Scripts\python.exe"
if not exist "%PY%" set "PY=%HERE%..\.venv314\Scripts\python.exe"
if not exist "%PY%" set "PY=python"

if not exist "%SCRIPT%" (
    echo ERROR: could not find "%SCRIPT%".
    echo This file must sit in the deployed app folder, next to the 'auth' folder.
    echo.
    pause
    exit /b 1
)

:menu
cls
echo ============================================
echo     ATI - Local Account Manager
echo ============================================
echo.
echo     [1]  Add a new account
echo     [2]  List accounts
echo     [3]  Reset a password
echo     [4]  Deactivate an account (blocks login)
echo     [5]  Activate an account
echo     [6]  Exit
echo.
set "CHOICE="
set /p "CHOICE=Choose [1-6]: "

if "%CHOICE%"=="1" goto add
if "%CHOICE%"=="2" goto list
if "%CHOICE%"=="3" goto passwd
if "%CHOICE%"=="4" goto deactivate
if "%CHOICE%"=="5" goto activate
if "%CHOICE%"=="6" goto end
goto menu

:add
echo.
echo --- Add a new account ---
set "U="
set /p "U=  Username     : "
if not defined U goto after
set "N="
set /p "N=  Display name : "
if not defined N goto after
set "E="
set /p "E=  Employee ID  : (optional - press Enter to skip) "
echo.
echo   Now enter the password at the prompt below (typing stays hidden).
if defined E goto add_with_emp
"%PY%" "%SCRIPT%" add "%U%" --name "%N%"
goto after
:add_with_emp
"%PY%" "%SCRIPT%" add "%U%" --name "%N%" --employee-id "%E%"
goto after

:list
echo.
"%PY%" "%SCRIPT%" list
goto after

:passwd
echo.
echo --- Reset a password ---
set "U="
set /p "U=  Username : "
if not defined U goto after
"%PY%" "%SCRIPT%" passwd "%U%"
goto after

:deactivate
echo.
echo --- Deactivate (block login) ---
set "U="
set /p "U=  Username : "
if not defined U goto after
"%PY%" "%SCRIPT%" deactivate "%U%"
goto after

:activate
echo.
echo --- Activate ---
set "U="
set /p "U=  Username : "
if not defined U goto after
"%PY%" "%SCRIPT%" activate "%U%"
goto after

:after
echo.
pause
goto menu

:end
endlocal
