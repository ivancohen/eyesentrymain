@echo off
echo ======================================================
echo Synchronizing Dropdown Options for Questionnaires
echo ======================================================
echo.
echo This script will synchronize the dropdown options from
echo the admin section to the patient questionnaire form.
echo.
echo ======================================================

:: Run our sync script
node apply-sync-dropdown-options.js

if %ERRORLEVEL% neq 0 (
    echo Error executing sync script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Sync script completed successfully
echo ======================================================
echo.
echo The dropdown options have been synchronized.
echo The patient questionnaire should now display all options and scores correctly.
echo.
pause