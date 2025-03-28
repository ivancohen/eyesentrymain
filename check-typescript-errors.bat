@echo off
echo ======================================================
echo Checking TypeScript Errors
echo ======================================================
echo.
echo This script will check for TypeScript errors and attempt to fix them.
echo.
echo ======================================================

:: Run our TypeScript check script
node check-typescript-errors.js

if %ERRORLEVEL% neq 0 (
    echo Error executing TypeScript check script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo TypeScript check script completed
echo ======================================================
echo.
echo After fixing TypeScript errors, try building again:
echo npm run build
echo.
pause