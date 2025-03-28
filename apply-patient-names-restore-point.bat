@echo off
echo ===================================================
echo Applying Patient Names Restore Point
echo ===================================================
echo.

echo Applying restore point creation script...
node apply-patient-names-restore-point.js

echo.
echo Done! Restore point created.
echo To restore, run: SELECT restore_patient_names_system(); in Supabase SQL editor.
echo.