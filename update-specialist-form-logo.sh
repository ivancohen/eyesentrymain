#!/bin/bash

echo "==================================================="
echo "Add Logo to Specialist Assessment Form"
echo "==================================================="
echo
echo "This script will:"
echo "1. Add a logo to the specialist assessment form"
echo "2. Update the update-logos.js script to include this change"
echo "3. Update the DEPLOYMENT_README.md to mention this change"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read

echo
echo "Adding logo to specialist assessment form..."
echo

node update-specialist-form-logo.js

echo
if [ $? -eq 0 ]; then
  echo "Logo added successfully!"
else
  echo "Failed to add logo with error code $?"
  echo "Please check the console output for details."
fi

echo
echo "Press Enter to exit..."
read