@echo off
echo Deploying to Cloudflare Pages with fallback...
node deploy-with-fallback.js
if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)
echo Deployment completed successfully.