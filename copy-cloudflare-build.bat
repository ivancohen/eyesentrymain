@echo off
echo Copying Cloudflare build files to local dist directory...
node copy-cloudflare-build.js
echo.
echo If successful, you can now serve the application from the dist directory.
pause