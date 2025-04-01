@echo off
echo ===================================================
echo Fix Steroid Questions Conditional Logic
echo ===================================================
echo.
echo This script will:
echo 1. Create backups of the original files
echo 2. Modify the handleAnswerChange function in QuestionnaireContainer.tsx
echo 3. Improve the conditional logic in QuestionnaireForm.tsx
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Applying fix...
echo.

node fix-steroid-questions.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Fix completed successfully!
  echo.
  echo Next steps:
  echo 1. Restart your development server
  echo 2. Test the steroid questions to verify the fix
) else (
  echo Fix failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul