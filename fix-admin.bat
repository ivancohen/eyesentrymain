@echo off
REM Script to fix admin access for ivan.s.cohen@gmail.com

echo EyeSentry Admin Access Fix Tool
echo ===============================
echo This script will fix admin access for ivan.s.cohen@gmail.com by:
echo 1. Updating the is_admin flag in the profiles table
echo 2. Providing SQL to update app_metadata in auth.users
echo.

REM Set the admin email
set ADMIN_EMAIL=ivan.s.cohen@gmail.com

REM SQL to update is_admin in profiles
set PROFILES_SQL=UPDATE profiles SET is_admin = true WHERE email = '%ADMIN_EMAIL%';

REM SQL to update app_metadata in auth.users
set AUTH_SQL=UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb WHERE email = '%ADMIN_EMAIL%';

REM Check if node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Running Node.js script to update profiles table...
    cd /d "%~dp0" && node src/utils/fix-admin-access.js
    echo.
    echo ✅ Profiles table update complete
) else (
    echo ❌ Node.js not found. Cannot run the profile update script.
    echo Please install Node.js or run the SQL manually:
    echo %PROFILES_SQL%
)

echo.
echo To complete the fix, you need to update app_metadata in auth.users table.
echo This requires admin access to the Supabase database.
echo.
echo Options:
echo 1. Run this SQL in the Supabase dashboard SQL Editor:
echo %AUTH_SQL%
echo.
echo 2. Open the HTML tool for interactive instructions:
echo    file://%~dp0fix-admin-role.html
echo.
echo 3. Log in to Supabase dashboard and update manually:
echo    https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf
echo    Navigate to Authentication → Users, find %ADMIN_EMAIL%,
echo    and manually set the role to "admin" in the metadata.
echo.
echo After completing these steps, log out and log back in to the application.
echo You should now have full admin access.

REM Open the HTML tool automatically
echo.
echo Opening the HTML tool for you...
start "" "%~dp0fix-admin-role.html"

pause
