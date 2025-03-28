#!/bin/bash
echo "==================================================="
echo "Running Comprehensive Patient Names Fix"
echo "==================================================="
echo

echo "Executing fix script..."
node run-patient-names-fix.js

echo
echo "Done! Check output for errors. If errors occurred, run the SQL manually."
echo "SQL file: supabase/fix_patient_names_comprehensive.sql"
echo