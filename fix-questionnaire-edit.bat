@echo off
echo ======================================================
echo Fixing Questionnaire Edit Issues
echo ======================================================
echo.
echo This script will fix two issues:
echo 1. Risk assessment scores not saving when editing questionnaires
echo 2. Edit form not being populated with original answers
echo.
echo ======================================================

:: Run our fix script
node fix-questionnaire-edit.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo Both issues have been fixed:
echo 1. Risk assessment scores now save correctly when editing questionnaires
echo 2. The edit form is now properly populated with original answers
echo.
echo Please test the fix by editing an existing questionnaire.
echo.
pause