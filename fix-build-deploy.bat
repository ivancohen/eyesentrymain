@echo off
echo Fixing, building, and deploying EyeSentry application...
node fix-build-deploy.js
if %ERRORLEVEL% NEQ 0 (
  echo Deployment process failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo Fix, build, and deployment process completed successfully.