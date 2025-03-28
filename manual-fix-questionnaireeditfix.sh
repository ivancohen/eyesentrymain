#!/bin/bash

echo "======================================================"
echo "Fixing QuestionnaireEditFix.tsx"
echo "======================================================"
echo ""
echo "This script will fix references to updateQuestionnaire in QuestionnaireEditFix.tsx."
echo ""
echo "======================================================"

# Run our fix script
node manual-fix-questionnaireeditfix.js

if [ $? -ne 0 ]; then
    echo "Error executing fix script"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "Fix script completed successfully"
echo "======================================================"
echo ""
echo "After fixing QuestionnaireEditFix.tsx, try building again:"
echo "npm run build"
echo ""
read -p "Press Enter to continue..."