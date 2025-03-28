@echo off
echo Running questionnaire and doctor approval fix...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js to run this script.
    exit /b 1
)

REM Run the fix script
node fix-questionnaire-doctor-approval.js

echo Script execution completed.
echo Please follow the instructions displayed above to complete the fix.
pause