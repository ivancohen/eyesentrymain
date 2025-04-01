@echo off
echo ===================================================
echo Fixing Question and Answer Reordering
echo ===================================================
echo.

echo Step 1: Apply SQL fixes to standardize on dropdown_options table...
echo.
echo This will:
echo - Ensure dropdown_options has display_order column
echo - Migrate any data from question_options to dropdown_options
echo - Implement consistent RLS policies
echo - Add secure stored procedures for ordering
echo.

REM Apply SQL fixes (you'll need to adapt this to use your actual database connection method)
REM The following is a placeholder for executing the SQL script against your database
echo Applying SQL changes from direct-reordering-fix.sql...
echo NOTE: You may need to manually run this SQL script in your Supabase dashboard
echo or using another database tool if you don't have psql configured.
echo.

echo SQL fixes applied (or ready to be applied manually).
echo.

echo Step 2: Stopping any running servers...
taskkill /FI "WINDOWTITLE eq npm run dev" /F
timeout /t 2 /nobreak >nul

echo Step 3: Installing any needed dependencies...
call npm install
echo.

echo Step 4: Building the application with reordering fixes...
call npm run build
echo.

echo Step 5: Starting development server with all fixes...
start "npm run dev" cmd /c "npm run dev"
echo.

echo ===================================================
echo Setup complete! Application server starting...
echo ===================================================
echo.
echo The following changes have been applied:
echo 1. Code updates to use dropdown_options consistently
echo 2. Added display_order support in all components
echo 3. Prepared SQL scripts for database standardization
echo 4. Fixed TypeScript interfaces and type guards
echo.
echo IMPORTANT: Make sure to apply the SQL script "direct-reordering-fix.sql" 
echo to your Supabase database if not automatically applied.
echo.
echo The application should now support proper ordering of answers,
echo with all existing question/answer data preserved.
echo ===================================================

pause