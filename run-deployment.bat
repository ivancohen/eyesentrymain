@echo off
echo Running EyeSentry Deployment Process...

IF "%1"=="" (
  echo No approach specified. Using default (direct-build)
  node run-deployment.js
) ELSE (
  echo Using approach: %1
  node run-deployment.js %*
)

if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo Deployment process completed. See above for details and next steps.