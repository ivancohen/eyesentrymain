@echo off
echo ===================================================
echo Update All Logo References
echo ===================================================
echo.
echo This script will:
echo 1. Find all files in the codebase that reference logos
echo 2. Update all logo references to use the transparent logo at src/assets/logo.png
echo 3. Ensure consistency across the entire application
echo.
echo Please ensure that the transparent logo file is correctly placed at:
echo src/assets/logo.png
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Updating all logo references...
echo.

node update-all-logos.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Logo references updated successfully!
) else (
  echo Failed to update logo references with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul