@echo off
echo ===================================================
echo Build, Update GitHub, and Deploy to Cloudflare
echo ===================================================
echo.
echo This script will:
echo 1. Create a restore point
echo 2. Set up transparent logo
echo 3. Update all logo references to use transparent logo
echo 4. Update specialist assessment form logo
echo 5. Update your GitHub repository
echo 6. Deploy to your Cloudflare instance
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Starting build, update, and deployment process...
echo.

node build-update-deploy.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Process completed successfully!
) else (
  echo Process failed with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul