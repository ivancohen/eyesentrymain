@echo off
echo Deploying to Cloudflare Pages...
node deploy-cloudflare.js
if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo Deployment completed successfully.