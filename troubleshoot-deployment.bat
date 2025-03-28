@echo off
echo ======================================================
echo Cloudflare Deployment Troubleshooting
echo ======================================================
echo.
echo This script will diagnose and attempt to fix common deployment issues.
echo.
echo ======================================================

:: Run our troubleshooting script
node troubleshoot-deployment.js

if %ERRORLEVEL% neq 0 (
    echo Error executing troubleshooting script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Troubleshooting script completed
echo ======================================================
echo.
echo If you're still experiencing issues, please:
echo 1. Check the Cloudflare status page: https://www.cloudflarestatus.com/
echo 2. Contact Cloudflare support through your dashboard
echo 3. Try deploying manually through the Cloudflare dashboard
echo.
pause