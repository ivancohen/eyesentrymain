@echo off
echo ===================================================
echo Update Logos
echo ===================================================
echo.
echo This script will:
echo 1. Update logo path in Navbar.tsx
echo 2. Add logo to SpecialistQuestionnaire.tsx
echo 3. Check other logo references
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Updating logos...
echo.

node update-logos.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Logo update completed successfully!
) else (
  echo Logo update failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul