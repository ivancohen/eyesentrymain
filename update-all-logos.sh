#!/bin/bash

echo "==================================================="
echo "Update All Logo References"
echo "==================================================="
echo
echo "This script will:"
echo "1. Find all files in the codebase that reference logos"
echo "2. Update all logo references to use the transparent logo at src/assets/logo.png"
echo "3. Ensure consistency across the entire application"
echo
echo "Please ensure that the transparent logo file is correctly placed at:"
echo "src/assets/logo.png"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read

echo
echo "Updating all logo references..."
echo

node update-all-logos.js

echo
if [ $? -eq 0 ]; then
  echo "Logo references updated successfully!"
else
  echo "Failed to update logo references with error code $?"
  echo "Please check the console output for details."
fi

echo
echo "Press Enter to exit..."
read