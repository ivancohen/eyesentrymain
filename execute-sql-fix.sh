#!/bin/bash
echo "==================================================="
echo "Adding display_order to dropdown_options table"
echo "==================================================="
echo ""

echo "First, creating the execute_sql function..."
npx supabase db push --db-url $VITE_SUPABASE_URL --password $SUPABASE_DB_PASSWORD create-execute-sql-function.sql

echo ""
echo "Now executing the SQL fix..."
node execute-sql-fix.js

echo ""
echo "Done! The dropdown_options table now has a display_order column."
echo "You can now use drag and drop to reorder dropdown options."
echo ""