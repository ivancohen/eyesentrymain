@echo off
echo ======================================================
echo Applying fix for column ambiguity in update function
echo ======================================================

:: Run our fix script
node apply-column-ambiguity-fix.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo The update questionnaire functionality should now work properly.
echo All three issues should now be fixed:
echo 1. Patient names are saved correctly
echo 2. Risk assessment scores are calculated
echo 3. Editing questionnaires works without column ambiguity errors
echo.
pause