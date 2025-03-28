@echo off
echo Running Direct Build script...

node direct-build.js

if %ERRORLEVEL% NEQ 0 (
  echo Direct Build failed with error code %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo Direct Build completed. See above for details.