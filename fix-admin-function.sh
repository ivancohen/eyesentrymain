#!/bin/bash
# Script to fix the admin function in the Supabase database

echo "EyeSentry Admin Function Fix Tool"
echo "================================="
echo "This script will run SQL to ensure the create_admin function exists in your Supabase database."
echo ""

# Get Supabase URL and key from user or environment
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://gebojeuaeaqmdfrxptqf.supabase.co"
fi

echo "Supabase URL: $SUPABASE_URL"
echo ""
echo "You will need to run this SQL through the Supabase dashboard SQL Editor:"
echo ""
echo "1. Go to https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf/sql/new"
echo "2. Copy and paste the SQL from supabase/fix_admin_function.sql"
echo "3. Run the SQL query"
echo ""
echo "Alternatively, if you have psql installed, you can run it directly with the Supabase connection string."
echo ""

# Check if the SQL file exists
if [ -f "supabase/fix_admin_function.sql" ]; then
  echo "SQL file found: supabase/fix_admin_function.sql"
  echo ""
  echo "SQL contents:"
  echo "-------------"
  cat "supabase/fix_admin_function.sql"
  echo ""
else
  echo "ERROR: SQL file not found at supabase/fix_admin_function.sql"
  exit 1
fi

echo "After running the SQL, please restart your application to ensure the changes take effect."
