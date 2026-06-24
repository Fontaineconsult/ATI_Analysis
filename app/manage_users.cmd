@echo off
setlocal

rem ===========================================================================
rem  ATI - Local Account Manager (interactive)
rem  Wraps app\auth\manage_users.py. Deployed at C:\www\ati\app\manage_users.cmd.
rem  Accounts are keyed by EMAIL and must link to a graph Person (option [1]),
rem  except system accounts created via option [6]. Passwords are entered through
rem  the Python prompt (hidden), never typed into this window.
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

rem This manages the DEPLOYED account store, so default to production -- that
rem makes manage_users.py resolve the SAME AUTH_DB_PATH (and graph) the app uses.
rem Set FLASK_ENV yourself before launching to override (e.g. development).
if not defined FLASK_ENV set "FLASK_ENV=production"

:menu
cls
echo ============================================
echo     ATI - Local Account Manager
echo ============================================
echo.
echo     [1]  Add account (must match a graph Person)
echo     [2]  List accounts
echo     [3]  Reset a password
echo     [4]  Deactivate an account (blocks login)
echo     [5]  Activate an account
echo     [6]  Add a SYSTEM account (no linked person)
echo     [7]  Exit
echo.
set "CHOICE="
set /p "CHOICE=Choose [1-7]: "

if "%CHOICE%"=="1" goto add
if "%CHOICE%"=="2" goto list
if "%CHOICE%"=="3" goto passwd
if "%CHOICE%"=="4" goto deactivate
if "%CHOICE%"=="5" goto activate
if "%CHOICE%"=="6" goto addsys
if "%CHOICE%"=="7" goto end
goto menu

:add
echo.
echo --- Add a new account (linked to a Person by email) ---
call :collect
if not defined U goto after
echo.
echo   Verifying a Person exists for that email, then password (hidden)...
"%PY%" "%SCRIPT%" add "%U%" --name "%N%" %EMPARG%
goto after

:addsys
echo.
echo --- Add a SYSTEM account (bypasses the Person check) ---
call :collect
if not defined U goto after
echo.
echo   Now enter the password at the prompt below (typing stays hidden).
"%PY%" "%SCRIPT%" add "%U%" --name "%N%" %EMPARG% --allow-no-person
goto after

:collect
rem Collect email / name / employee-id into U, N, EMPARG. Returns U empty if cancelled.
set "U="
set "N="
set "EMPARG="
set /p "U=  Email        : "
if not defined U goto :eof
set /p "N=  Display name : "
if not defined N ( set "U=" & goto :eof )
set "E="
set /p "E=  Employee ID  : (optional - press Enter to skip) "
if defined E set "EMPARG=--employee-id "%E%""
goto :eof

:list
echo.
"%PY%" "%SCRIPT%" list
goto after

:passwd
echo.
echo --- Reset a password ---
set "U="
set /p "U=  Email : "
if not defined U goto after
"%PY%" "%SCRIPT%" passwd "%U%"
goto after

:deactivate
echo.
echo --- Deactivate (block login) ---
set "U="
set /p "U=  Email : "
if not defined U goto after
"%PY%" "%SCRIPT%" deactivate "%U%"
goto after

:activate
echo.
echo --- Activate ---
set "U="
set /p "U=  Email : "
if not defined U goto after
"%PY%" "%SCRIPT%" activate "%U%"
goto after

:after
echo.
pause
goto menu

:end
endlocal
