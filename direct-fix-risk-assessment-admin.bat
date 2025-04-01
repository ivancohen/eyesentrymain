@echo off
echo ===================================================
echo Direct Fix for Risk Assessment Admin Display Issues
echo ===================================================
echo.
echo This script will:
echo 1. Create a backup of the current RiskAssessmentAdmin.tsx file
echo 2. Replace it with a completely new implementation
echo 3. Ensure proper display of risk levels and recommendations
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Applying direct fix...
echo.

node direct-fix-risk-assessment-admin.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Direct fix completed successfully!
  echo.
  echo Next steps:
  echo 1. Restart your development server
  echo 2. Navigate to the risk assessment admin page
  echo 3. Verify that the configuration fields are displayed
  echo 4. Verify that the preview section shows the current values
) else (
  echo Direct fix failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul