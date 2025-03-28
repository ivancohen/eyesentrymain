@echo off
echo ======================================================
echo Executing comprehensive questionnaire system fix script
echo ======================================================

:: Make sure Node modules are installed
if not exist node_modules (
    echo Installing dependencies first...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error installing dependencies
        exit /b %ERRORLEVEL%
    )
)

:: Run our fix script
echo Running comprehensive fix script...
node run-comprehensive-questionnaire-fix.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo You may now test the system functionality:
echo 1. Submitting new questionnaires - patient names should be saved
echo 2. Risk assessment scores should be calculated correctly
echo 3. Editing existing questionnaires should work as expected
echo.
pause