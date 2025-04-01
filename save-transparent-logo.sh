#!/bin/bash

echo "==================================================="
echo "Save Transparent Logo"
echo "==================================================="
echo
echo "This script will:"
echo "1. Create the src/assets directory if it doesn't exist"
echo "2. Create a placeholder for the logo file"
echo
echo "You will need to manually save the transparent logo to:"
echo "src/assets/logo.png"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read

echo
echo "Setting up logo..."
echo

node save-transparent-logo.js

echo
if [ $? -eq 0 ]; then
  echo "Logo setup completed successfully!"
else
  echo "Logo setup failed with error code $?"
  echo "Please check the console output for details."
fi

echo
echo "Press Enter to exit..."
read