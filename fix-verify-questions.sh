#!/bin/bash

echo "======================================================"
echo "Fixing verify-questions.js"
echo "======================================================"
echo ""
echo "This script will fix TypeScript errors in verify-questions.js"
echo "by creating a TypeScript version and a simplified JavaScript version."
echo ""
echo "======================================================"

# Run our fix script
node fix-verify-questions.js

if [ $? -ne 0 ]; then
    echo "Error executing fix script"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "Fix script completed successfully"
echo "======================================================"
echo ""
echo "You can now try building again:"
echo "npm run build"
echo ""
read -p "Press Enter to continue..."