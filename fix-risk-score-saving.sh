#!/bin/bash

echo "======================================================"
echo "Fixing risk assessment scores not saving"
echo "======================================================"

# Run our fix script
node fix-risk-score-saving.js

if [ $? -ne 0 ]; then
    echo "Error executing fix script"
    exit 1
fi

echo ""
echo "Fix script completed successfully"
echo "======================================================"
echo ""
echo "The risk assessment scores should now be saved correctly."
echo "When editing questionnaires, the risk scores will be properly updated in the database."
echo ""
read -p "Press Enter to continue..."