@echo off
echo ======================================================
echo Applying fix for risk score calculation
echo ======================================================

:: Run our fix script
node apply-risk-score-fix.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo The risk score calculation should now work properly.
echo All three issues should now be fixed:
echo 1. Patient names are saved correctly
echo 2. Risk assessment scores are calculated correctly
echo 3. Editing questionnaires works without errors
echo.
pause