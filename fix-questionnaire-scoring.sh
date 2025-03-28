#!/bin/bash
echo "==================================================="
echo "Fixing Questionnaire Scoring System"
echo "==================================================="
echo

echo "Creating a restore point first..."
node execute-sql-fix.js supabase/create_questionnaire_restore_point.sql

echo
echo "Running SQL script to add metadata support and update functions..."
node execute-sql-fix.js supabase/add_metadata_and_update_functions.sql

echo
echo "Done! The questionnaire system now supports dynamic scoring."
echo
echo "If you need to revert these changes, run:"
echo "node execute-sql-fix.js supabase/restore_questionnaire_system.sql"
echo