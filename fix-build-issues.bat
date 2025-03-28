@echo off
echo ======================================================
echo Fixing Build Issues
echo ======================================================
echo.
echo This script will diagnose and fix common build issues.
echo.
echo ======================================================

:: Run our build fix script
node fix-build-issues.js

if %ERRORLEVEL% neq 0 (
    echo Error executing build fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build fix script completed successfully
echo ======================================================
echo.
echo You can now try deploying the application again:
echo deploy-to-cloudflare.bat
echo.
pause