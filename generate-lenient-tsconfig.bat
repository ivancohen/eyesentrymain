@echo off
echo ======================================================
echo Generating Lenient TypeScript Configuration
echo ======================================================
echo.
echo This script will generate a more lenient TypeScript configuration
echo that ignores type errors during build.
echo.
echo ======================================================

:: Run our configuration generation script
node generate-lenient-tsconfig.js

if %ERRORLEVEL% neq 0 (
    echo Error executing configuration generation script
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Configuration generation script completed
echo ======================================================
echo.
echo You can now try building with:
echo npm run build
echo.
pause