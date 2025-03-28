@echo off
REM EyeSentry Questionnaire System Restore Script for Windows
REM This script restores the files that were modified during the questionnaire system fix

echo ===============================================
echo EyeSentry Questionnaire System Restore Script
echo ===============================================

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Git not found! You'll need to restore files manually.
    goto :manual_restore
) else (
    echo Git found, attempting to restore files...
    
    REM Try to restore files using git
    git checkout -- src/services/PatientQuestionnaireService.ts
    git checkout -- src/components/questionnaires/QuestionnaireForm.tsx
    git checkout -- src/components/questionnaires/QuestionnaireEdit.tsx
    
    echo Files restored from git.
    goto :database_restore
)

:manual_restore
echo.
echo Please manually restore the following files from your backup:
echo - src/services/PatientQuestionnaireService.ts
echo - src/components/questionnaires/QuestionnaireForm.tsx
echo - src/components/questionnaires/QuestionnaireEdit.tsx

:database_restore
echo.
echo ===============================================
echo Database Restore
echo ===============================================
echo Attempting to restore database...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Supabase CLI not found! You'll need to restore the database manually.
    echo Please run the following SQL in the Supabase SQL editor:
    echo SELECT restore_questionnaire_system();
) else (
    echo Supabase CLI found, connecting to Supabase...
    
    REM Run the restore function
    supabase sql "SELECT restore_questionnaire_system();"
    
    echo Database restore attempted.
)

echo.
echo ===============================================
echo Restore Summary:
echo ===============================================
echo 1. Attempted to restore modified files
echo 2. Attempted to restore database to previous state
echo.
echo To verify the restore:
echo 1. Run the application with 'npm run dev'
echo 2. Check that the questionnaire form works as expected
echo.
echo Note: If you still encounter issues, you may need to:
echo - Restart the development server
echo - Clear your browser cache
echo - Check the browser console for errors

echo.
echo Restore script completed.
pause