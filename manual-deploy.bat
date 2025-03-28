@echo off
echo Running Manual Deployment Preparation...
node manual-deploy.js
if %ERRORLEVEL% NEQ 0 (
  echo Manual deployment preparation failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo Manual deployment preparation completed.