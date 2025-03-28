@echo off
echo ================================================================================
echo SYNC ADMIN RECOMMENDATIONS FIX
echo ================================================================================

echo.
echo This script provides guidance for fixing risk assessment recommendations 
echo by syncing admin-entered content to hardcoded database entries.
echo.
echo This is a direct and reliable solution that doesn't modify any TypeScript code,
echo focusing only on ensuring recommendations flow from admin to doctor view.
echo.

node sync-recommendations-fix.js

if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Failed to run script. Please check if Node.js is installed correctly.
  exit /b 1
)

echo.
echo ================================================================================
echo NEXT STEPS - AFTER EXECUTING SQL IN SUPABASE:
echo ================================================================================
echo.
echo 1. Start the application with: npm run dev
echo 2. Enter distinctive recommendations in the admin panel for each risk level
echo 3. View a patient questionnaire to verify recommendations appear correctly
echo.
echo The database trigger will ensure all future changes to recommendations
echo are automatically synced between admin panel and doctor view.
echo.

set /p "response=Would you like to start the application now? (y/n): "
if /i "%response%"=="y" (
  echo Starting application...
  call npm run dev
) else (
  echo You can start the application later with: npm run dev
)