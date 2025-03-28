@echo off
echo ===================================================
echo Adding display_order to dropdown_options table
echo ===================================================
echo.

echo Creating a restore point first...
npx supabase sql "SELECT create_questionnaire_restore_point();"

echo.
echo Running SQL script to add display_order column...
npx supabase sql -f supabase/add_display_order_to_dropdown_options.sql

echo.
echo Done! The dropdown_options table now has a display_order column.
echo You can now use drag and drop to reorder dropdown options.
echo.
echo If you need to revert these changes, run:
echo npx supabase sql "SELECT restore_questionnaire_system();"
echo.