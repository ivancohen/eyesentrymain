@echo off
echo ===================================================
echo Rebuilding application with all changes
echo ===================================================
echo.

echo Step 1: Building the application...
echo ---------------------------------------------------
call npm run build

echo.
echo Step 2: Restarting the server...
echo ---------------------------------------------------
call restart-server-final.bat

echo.
echo ===================================================
echo APPLICATION REBUILT AND RESTARTED
echo ===================================================
echo The application has been rebuilt with all changes.
echo This should include our fixes in the bundled JavaScript.
echo.
echo If you still encounter issues, you may need to:
echo 1. Clear your browser cache
echo 2. Restart your browser
echo 3. Consider modifying the database schema to make created_by nullable
echo.