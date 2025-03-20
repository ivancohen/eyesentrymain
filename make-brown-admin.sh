#!/bin/bash

echo "EyeSentry Make Admin Script"
echo "=========================="
echo "This script will make brownh@eyesentrymed.com an admin in the system."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed or not in your PATH."
  echo "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Run the JavaScript script
echo "Running admin promotion script..."
echo ""
node make-brown-admin.js

echo ""
echo "Script execution complete."
echo ""
echo "If the script was successful, brownh@eyesentrymed.com should now be an admin."
echo "The user should log out and log back in for the changes to take effect."
echo ""
echo "If problems persist, run the SQL script in the Supabase dashboard:"
echo "supabase/make_brown_admin.sql"
echo ""
