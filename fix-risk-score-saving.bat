@echo off
echo ================================================================================
echo FIXING RISK ASSESSMENT SCORE SAVING PERMISSIONS
echo ================================================================================
echo.
echo This script will execute the SQL fix to repair the risk assessment advice table
echo permissions and update the database with proper Row Level Security policies.
echo.
echo The SQL fix is located at: fix-risk-score-saving.sql
echo.
echo Press Ctrl+C to abort, or
pause

echo.
echo Executing SQL fix...
node execute-sql-fix.js fix-risk-score-saving.sql

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ❌ Error executing SQL fix. Please check the output above.
  echo.
  pause
  exit /b 1
)

echo.
echo ================================================================================
echo RISK ASSESSMENT SCORE SAVING FIXED SUCCESSFULLY
echo ================================================================================
echo.
echo The following changes have been made:
echo 1. Fixed Row Level Security policies for risk_assessment_advice table
echo 2. Added policies to allow authenticated users to insert and update records
echo 3. Inserted default risk assessment advice data
echo.
echo You can now test the risk assessment functionality locally by running:
echo   npm run dev
echo.
echo After verifying the fix works, you can deploy to Cloudflare using:
echo   node deploy-to-cloudflare.js --skip-build
echo.
pause