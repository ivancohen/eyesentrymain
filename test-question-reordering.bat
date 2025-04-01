@echo off
echo ===================================================
echo Testing Question Reordering Functionality
echo ===================================================
echo.

echo Running test script...
node test-question-reordering.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Test completed successfully!
) else (
  echo Test failed with error code: %ERRORLEVEL%
  echo Please check the logs for details.
)
echo.
pause