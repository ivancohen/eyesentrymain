@echo off
echo Fixing TypeScript errors and building application...
node fix-and-build.js
if %ERRORLEVEL% NEQ 0 (
  echo Build process failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo Build process completed successfully.