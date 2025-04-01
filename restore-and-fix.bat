@echo off
echo ===================================================
echo Restore and Fix QuestionService.ts
echo ===================================================
echo.
echo This script will:
echo 1. Create a backup of the current QuestionService.ts file
echo 2. Create a completely new QuestionService.ts file with minimal reordering implementation
echo 3. Create a script to update dropdown options
echo.
echo This is the most reliable approach that completely rebuilds the file
echo from scratch to avoid any syntax errors.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Restoring and fixing...
echo.

node restore-and-fix.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Restore and fix completed successfully!
  echo.
  echo Next steps:
  echo 1. Restart your development server
  echo 2. Run: node update-dropdown-orders.js
  echo 3. Test the reordering functionality in the UI
) else (
  echo Restore and fix failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul