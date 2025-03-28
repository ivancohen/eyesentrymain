@echo off
echo ======================================================
echo Fixing verify-questions.js
echo ======================================================
echo.
echo This script will fix TypeScript errors in verify-questions.js
echo by creating a TypeScript version and a simplified JavaScript version.
echo.
echo ======================================================

:: Run our fix script
node fix-verify-questions.js

if %ERRORLEVEL% neq 0 (
    echo Error executing fix script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Fix script completed successfully
echo ======================================================
echo.
echo You can now try building again:
echo npm run build
echo.
pause