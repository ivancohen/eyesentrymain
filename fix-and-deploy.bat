@echo off
echo Fixing TypeScript errors and deploying to Cloudflare...
node fix-and-deploy.js
if %ERRORLEVEL% NEQ 0 (
  echo Fix and deploy process failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo Fix and deploy process completed successfully.