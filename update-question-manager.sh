#!/bin/bash

echo "==================================================="
echo "Update Question Manager with Category-Based Cards"
echo "==================================================="
echo
echo "This script will:"
echo "1. Create backups of the original files"
echo "2. Replace the original files with enhanced versions"
echo "3. Add react-beautiful-dnd dependency if needed"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read

echo
echo "Updating question manager..."
echo

node update-question-manager.js

echo
if [ $? -eq 0 ]; then
  echo "Update completed successfully!"
  echo
  echo "Next steps:"
  echo "1. If react-beautiful-dnd was added, run 'npm install' or 'yarn'"
  echo "2. Restart your development server"
  echo "3. Navigate to the question management page"
else
  echo "Update failed with error code $?"
  echo "Please check the console output for details."
fi

echo
echo "Press Enter to exit..."
read