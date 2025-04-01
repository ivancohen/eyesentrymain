@echo off
echo ===================================================
echo Save Transparent Logo
echo ===================================================
echo.
echo This script will:
echo 1. Create the src/assets directory if it doesn't exist
echo 2. Create a placeholder for the logo file
echo.
echo You will need to manually save the transparent logo to:
echo src/assets/logo.png
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Setting up logo...
echo.

node save-transparent-logo.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Logo setup completed successfully!
) else (
  echo Logo setup failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul