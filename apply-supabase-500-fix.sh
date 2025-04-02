#!/bin/bash

echo "==================================================="
echo "Applying Supabase 500 Error Fix (Complete Solution)"
echo "==================================================="
echo

echo "Step 1: Installing required dependencies..."
npm install chalk dotenv

echo
echo "Step 2: Applying the fix..."
node fix-supabase-500-errors.js

echo
echo "Step 3: Applying AuthContext loading fix..."
node fix-authcontext-loading.js

echo
echo "Step 4: Fixing module import errors..."
node fix-module-import-error.js

echo
echo "Step 5: Fixing duplicate imports..."
node fix-duplicate-imports.js

echo
echo "Step 6: Running tests..."
node test-supabase-fix.js

echo
echo "==================================================="
echo "Fix application complete!"
echo
echo "Next steps:"
echo "1. Review SUPABASE_500_ERROR_FIX.md for details"
echo "2. Build the application with: npm run build"
echo "3. Start the development server: npm run dev"
echo "4. Test the application by logging in and checking admin pages"
echo "==================================================="
echo

read -p "Press Enter to continue..."