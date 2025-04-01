#!/bin/bash

echo "==================================================="
echo "Update Logos"
echo "==================================================="
echo
echo "This script will:"
echo "1. Update logo path in Navbar.tsx"
echo "2. Add logo to SpecialistQuestionnaire.tsx"
echo "3. Check other logo references"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read

echo
echo "Updating logos..."
echo

node update-logos.js

echo
if [ $? -eq 0 ]; then
  echo "Logo update completed successfully!"
else
  echo "Logo update failed with error code $?"
  echo "Please check the console output for details."
fi

echo
echo "Press Enter to exit..."
read