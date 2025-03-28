@echo off
echo ===================================================
echo Fixing Patients Table Access
echo ===================================================
echo.

echo Running SQL script to fix patients table access...
node execute-sql-fix.js supabase/fix_patients_table_access.sql

echo.
echo Done! The patients table now has proper access policies.
echo.