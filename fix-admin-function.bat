@echo off
REM Script to fix the admin function in the Supabase database

echo EyeSentry Admin Function Fix Tool
echo =================================
echo This script will help you run SQL to ensure the create_admin function exists in your Supabase database.
echo.

set SUPABASE_URL=https://gebojeuaeaqmdfrxptqf.supabase.co

echo Supabase URL: %SUPABASE_URL%
echo.
echo You will need to run this SQL through the Supabase dashboard SQL Editor:
echo.
echo 1. Go to https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf/sql/new
echo 2. Copy and paste the SQL from supabase/fix_admin_function.sql
echo 3. Run the SQL query
echo.

REM Check if the SQL file exists
if exist "supabase\fix_admin_function.sql" (
  echo SQL file found: supabase\fix_admin_function.sql
  echo.
  echo SQL contents:
  echo -------------
  type "supabase\fix_admin_function.sql"
  echo.
) else (
  echo ERROR: SQL file not found at supabase\fix_admin_function.sql
  exit /b 1
)

echo After running the SQL, please restart your application to ensure the changes take effect.

REM Open the SQL file in notepad for easy copying
echo.
echo Opening SQL file in Notepad for easy copying...
start notepad "supabase\fix_admin_function.sql"

REM Optionally open the Supabase dashboard
set /p OpenDashboard=Would you like to open the Supabase dashboard in your browser? (Y/N): 
if /i "%OpenDashboard%"=="Y" (
  start https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf/sql/new
)

echo.
echo Don't forget to restart your application after running the SQL.
pause
