#!/bin/bash
echo "==================================================="
echo "Fixing Question Reordering Functionality"
echo "==================================================="
echo

echo "Ensuring database schema is correct..."
bash add-display-order-to-dropdown-options.sh

echo
echo "Running fix script for QuestionService.ts..."
node fix-question-reordering.js

echo
echo "Done! Question reordering should now work properly."
echo "Please restart the application to apply the changes."
echo