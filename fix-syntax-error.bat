@echo off
echo ===================================================
echo Fix Syntax Error in QuestionService.ts
echo ===================================================
echo.
echo This script will fix the syntax error in the QuestionService.ts file
echo that was causing the "Expected '}', got '<eof>'" error.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Fixing syntax error...
echo.

node fix-reordering-syntax.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Syntax fix completed successfully!
  echo.
  echo Next steps:
  echo 1. Restart your development server
  echo 2. Run: node verify-reordering.js
  echo 3. Test the reordering functionality in the UI
) else (
  echo Syntax fix failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul