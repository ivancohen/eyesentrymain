#!/bin/bash

echo "==================================================="
echo "Fix Steroid Questions Conditional Logic"
echo "==================================================="
echo
echo "This script will:"
echo "1. Create backups of the original files"
echo "2. Modify the handleAnswerChange function in QuestionnaireContainer.tsx"
echo "3. Improve the conditional logic in QuestionnaireForm.tsx"
echo
echo "Press Ctrl+C to cancel or Enter to continue..."
read

echo
echo "Applying fix..."
echo

node fix-steroid-questions.js

echo
if [ $? -eq 0 ]; then
  echo "Fix completed successfully!"
  echo
  echo "Next steps:"
  echo "1. Restart your development server"
  echo "2. Test the steroid questions to verify the fix"
else
  echo "Fix failed with error code $?"
  echo "Please check the console output for details."
fi

echo
echo "Press Enter to exit..."
read