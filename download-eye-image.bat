@echo off
echo ===================================================
echo Download Eye Image for Home Page
echo ===================================================
echo.
echo This script will:
echo 1. Download an eye image from Unsplash
echo 2. Save it to src/assets/eye-image.jpg
echo 3. This image will be used in the home page hero section
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Downloading eye image...
echo.

node download-eye-image.js

echo.
if %ERRORLEVEL% EQU 0 (
  echo Eye image downloaded successfully!
) else (
  echo Failed to download eye image with error code %ERRORLEVEL%
  echo Please check the console output for details.
)

echo.
echo Press any key to exit...
pause > nul