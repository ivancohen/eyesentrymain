@echo off
REM EyeSentry Questionnaire System Fix Script for Windows
REM This script applies all necessary fixes to the questionnaire system

echo ===============================================
echo EyeSentry Questionnaire System Fix Script
echo ===============================================

REM Create a restore point
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "RESTORE_POINT_DIR=docs\restore-points"
set "RESTORE_POINT_FILE=%RESTORE_POINT_DIR%\RESTORE_%TIMESTAMP%_questionnaire_system.md"

if not exist "%RESTORE_POINT_DIR%" mkdir "%RESTORE_POINT_DIR%"

echo Creating restore point at %RESTORE_POINT_FILE%...

(
echo # Questionnaire System Restore Point ^(%TIMESTAMP%^)
echo.
echo This restore point was created before applying the questionnaire system fixes.
echo.
echo ## Components affected:
echo - PatientQuestionnaireService.ts - Risk score calculation and API fixes
echo - QuestionnaireForm.tsx - Special question handling and category filtering
echo - Database schemas - RPC functions and risk assessment advice table
echo.
echo If you need to revert changes, refer to this restore point.
) > "%RESTORE_POINT_FILE%"

echo Restore point created successfully.
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Supabase CLI not found! You can still run the SQL scripts manually.
) else (
    echo Supabase CLI found, connecting to Supabase...
    
    REM Run the SQL fixes
    echo Applying RPC function fix...
    supabase db execute --file supabase\fix_questionnaire_rpc.sql
    
    echo Applying risk assessment advice table fix...
    supabase db execute --file supabase\fix_risk_assessment_advice.sql
    
    echo Updating test question tooltip...
    supabase db execute --file supabase\update_test_question_tooltip.sql
    
    echo Adding risk score to questions table...
    supabase db execute --file supabase\add_risk_score_to_questions.sql
)

echo.
echo ===============================================
echo Fix Summary:
echo ===============================================
echo 1. Fixed PatientQuestionnaireService.ts to correctly handle test questions
echo 2. Improved error handling for risk assessment advice
echo 3. Created SQL fixes for database issues
echo 4. Updated test question to include it in risk calculations
echo.
echo To test the fix:
echo 1. Run the application with 'npm run dev'
echo 2. Fill out the questionnaire form and answer 'yes' to the test question
echo 3. Verify the test question appears in the risk factors
echo 4. Confirm the risk score includes the test question's point
echo.
echo Note: If you couldn't run the SQL scripts automatically,
echo please run them manually in the Supabase console:
echo - supabase\fix_questionnaire_rpc.sql
echo - supabase\fix_risk_assessment_advice.sql
echo - supabase\update_test_question_tooltip.sql

echo.
echo Fix script completed.
pause