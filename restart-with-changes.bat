@echo off
echo ===================================================
echo Restarting server with all changes applied
echo ===================================================
echo.

echo Finding process using port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process with PID: %%a
    taskkill /F /PID %%a
    echo Killed process with PID: %%a
)

echo.
echo Waiting for port to be released...
timeout /t 2 /nobreak > nul

echo.
echo Starting the server...
start cmd /k "node serve-local.js"

echo.
echo Server restarted in a new terminal window.
echo.
echo ===================================================
echo CHANGES APPLIED:
echo ===================================================
echo 1. Removed reordering functionality
echo 2. Updated dropdown options to display in creation order
echo 3. Prevented caching of dropdown options
echo.
echo Dropdown options will now always be displayed in the
echo order they were created, which is the order they were
echo entered in the admin section.
echo.
echo The reordering feature has been completely disabled.
echo.