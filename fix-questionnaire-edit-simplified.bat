@echo off
echo ======================================================
echo Fixing Questionnaire Edit Component (Simplified)
echo ======================================================
echo.
echo This script will fix the issue with edit forms not being populated 
echo with original answers by replacing the QuestionnaireEdit component.
echo.
echo NOTE: This simplified version does NOT fix the risk score saving issue,
echo       as that requires database credentials.
echo.
echo ======================================================

:: Run our simplified fix script
node fix-questionnaire-edit-simplified.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo The edit form component has been fixed and should now properly
echo populate with original answers when editing a questionnaire.
echo.
echo To fix the risk score saving issue, you will need to:
echo 1. Set up your Supabase credentials in a .env file
echo 2. Run the SQL script manually from fix-risk-score-saving.sql
echo.
pause