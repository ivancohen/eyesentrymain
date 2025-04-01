@echo off
echo ===================================================
echo Fix Risk Assessment Admin Pre-Population Issue
echo ===================================================
echo.
echo This script will:
echo 1. Fix the RiskAssessmentService.ts file
echo 2. Fix the RiskAssessmentAdmin.tsx component
echo 3. Ensure proper risk level normalization
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Applying fix...
echo.

node fix-risk-assessment-admin.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Fix completed successfully!
  echo.
  echo Next steps:
  echo 1. Restart your development server
  echo 2. Navigate to the risk assessment admin page
  echo 3. Verify that the configuration fields are pre-populated
  echo 4. Verify that the preview section shows the current values
) else (
  echo Fix failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul