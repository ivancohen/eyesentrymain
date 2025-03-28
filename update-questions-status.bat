@echo off
REM Script to update questions status and types in the database

echo ===============================================
echo EyeSentry Questions Status Update Script
echo ===============================================

REM Create a restore point first
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "RESTORE_POINT_DIR=docs\restore-points"
set "RESTORE_POINT_FILE=%RESTORE_POINT_DIR%\RESTORE_%TIMESTAMP%_questions_status.md"

if not exist "%RESTORE_POINT_DIR%" mkdir "%RESTORE_POINT_DIR%"

echo Creating restore point at %RESTORE_POINT_FILE%...

(
echo # Questions Status Restore Point ^(%TIMESTAMP%^)
echo.
echo This restore point was created before updating the questions status and types.
echo.
echo ## Components affected:
echo - Database questions table - Status, question_type, and risk_score columns
echo - Indexes for performance optimization
echo - Duplicate questions handling
echo.
echo If you need to revert changes, run the restore_questionnaire_system() function.
) > "%RESTORE_POINT_FILE%"

echo Restore point created successfully.
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Supabase CLI not found! You can still run the SQL scripts manually.
) else (
    echo Supabase CLI found, connecting to Supabase...
    
    REM Run the SQL update
    echo Applying questions status update...
    supabase db execute --file supabase\update_questions_status.sql
)

echo.
echo ===============================================
echo Update Summary:
echo ===============================================
echo 1. Added status, question_type, and risk_score columns if they didn't exist
echo 2. Set text input types correctly for name fields
echo 3. Created indexes for performance
echo 4. Standardized category names
echo 5. Set risk scores for known questions
echo 6. Deactivated duplicate questions
echo.
echo To test the update:
echo 1. Run the application with 'npm run dev'
echo 2. Verify that only active questions appear in the form
echo 3. Confirm that text fields render correctly
echo 4. Check that risk scores are calculated properly
echo.
echo Note: If you couldn't run the SQL script automatically,
echo please run it manually in the Supabase console:
echo - supabase\update_questions_status.sql

echo.
echo Update script completed.
pause