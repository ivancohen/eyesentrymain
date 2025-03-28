#!/bin/bash

echo "======================================================"
echo "Fixing Build Issues"
echo "======================================================"
echo ""
echo "This script will diagnose and fix common build issues."
echo ""
echo "======================================================"

# Run our build fix script
node fix-build-issues.js

if [ $? -ne 0 ]; then
    echo "Error executing build fix script"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "Build fix script completed successfully"
echo "======================================================"
echo ""
echo "You can now try deploying the application again:"
echo "./deploy-to-cloudflare.sh"
echo ""
read -p "Press Enter to continue..."