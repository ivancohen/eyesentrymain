@echo off
echo ======================================================
echo Fixing QuestionnaireEditFix.tsx
echo ======================================================
echo.
echo This script will fix references to updateQuestionnaire in QuestionnaireEditFix.tsx.
echo.
echo ======================================================

:: Run our fix script
node manual-fix-questionnaireeditfix.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo After fixing QuestionnaireEditFix.tsx, try building again:
echo npm run build
echo.
pause