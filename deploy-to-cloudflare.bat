@echo off
echo Running Cloudflare Pages Deployment...

IF "%1"=="" (
  echo No arguments provided. Running standard deployment.
  node deploy-to-cloudflare.js
) ELSE (
  echo Running deployment with arguments: %*
  node deploy-to-cloudflare.js %*
)

if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo Deployment completed. See above for details.