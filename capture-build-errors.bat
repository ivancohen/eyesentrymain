@echo off
echo ======================================================
echo Capturing Build Errors
echo ======================================================
echo.
echo This script will attempt a build and capture any errors for analysis.
echo.
echo ======================================================

:: Run our error capture script
node capture-build-errors.js

if %ERRORLEVEL% neq 0 (
    echo Error executing error capture script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Error capture script completed
echo ======================================================
echo.
echo After reviewing the errors, run fix-build-issues.bat to fix them.
echo.
pause