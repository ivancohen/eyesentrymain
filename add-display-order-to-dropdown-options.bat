@echo off
echo ===================================================
echo Adding display_order to dropdown_options table
echo ===================================================
echo.

echo Creating a restore point first...
node -e "const { createClient } = require('@supabase/supabase-js'); require('dotenv').config(); const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY); supabase.rpc('create_questionnaire_restore_point').then(({ data, error }) => { if (error) { console.error('Error creating restore point:', error); } else { console.log('Restore point created successfully!'); } process.exit(0); });"

echo.
echo Running SQL script to add display_order column...
node execute-sql-fix.js

echo.
echo Done! The dropdown_options table now has a display_order column.
echo You can now use drag and drop to reorder dropdown options.
echo.
echo If you need to revert these changes, run:
echo node -e "const { createClient } = require('@supabase/supabase-js'); require('dotenv').config(); const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY); supabase.rpc('restore_questionnaire_system').then(({ data, error }) => { if (error) { console.error('Error restoring:', error); } else { console.log('System restored successfully!'); } process.exit(0); });"
echo.
pause