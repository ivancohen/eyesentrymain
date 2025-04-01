@echo off
echo ===================================================
echo Restarting server with all fixes applied
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
echo ALL FIXES APPLIED:
echo ===================================================
echo 1. Removed reordering functionality
echo 2. Updated dropdown options to display in creation order
echo 3. Prevented caching of dropdown options
echo 4. Fixed createQuestion method to handle foreign key constraints
echo 5. Added missing fetchDropdownOptions method
echo 6. Added missing dropdown option methods
echo 7. Fixed duplicate comments and other issues
echo.
echo The system should now work correctly with:
echo - Dropdown options displayed in creation order
echo - Question creation working without foreign key errors
echo.