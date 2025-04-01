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
echo 1. Dropdown Options Display Order:
echo    - Removed reordering functionality
echo    - Modified to display options in creation order
echo    - Prevented caching of dropdown options
echo.
echo 2. Question Creation:
echo    - Fixed foreign key constraint issues
echo    - Made patient_id and doctor_id columns nullable
echo.
echo 3. Risk Assessment Scoring:
echo    - Fixed race/ethnicity scoring (Black: 2 points, Hispanic: 1 point)
echo    - Added database triggers for new questions
echo    - Ensured all admin-created questions are included in scoring
echo.
echo The application should now work correctly with:
echo - Dropdown options displayed in creation order
echo - Question creation working without errors
echo - Risk assessment scores properly calculated for all questions
echo.