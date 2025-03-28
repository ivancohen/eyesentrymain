@echo off
echo Fixing TypeScript errors...
node fix-typescript-errors.js
if %ERRORLEVEL% NEQ 0 (
  echo TypeScript fix failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo TypeScript errors fixed successfully.