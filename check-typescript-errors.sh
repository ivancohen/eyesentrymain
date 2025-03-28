#!/bin/bash

echo "======================================================"
echo "Checking TypeScript Errors"
echo "======================================================"
echo ""
echo "This script will check for TypeScript errors and attempt to fix them."
echo ""
echo "======================================================"

# Run our TypeScript check script
node check-typescript-errors.js

if [ $? -ne 0 ]; then
    echo "Error executing TypeScript check script"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "TypeScript check script completed"
echo "======================================================"
echo ""
echo "After fixing TypeScript errors, try building again:"
echo "npm run build"
echo ""
read -p "Press Enter to continue..."