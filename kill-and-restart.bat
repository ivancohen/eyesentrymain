@echo off
echo ===================================================
echo Killing process on port 3000 and restarting server
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