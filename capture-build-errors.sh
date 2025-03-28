#!/bin/bash

echo "======================================================"
echo "Capturing Build Errors"
echo "======================================================"
echo ""
echo "This script will attempt a build and capture any errors for analysis."
echo ""
echo "======================================================"

# Run our error capture script
node capture-build-errors.js

if [ $? -ne 0 ]; then
    echo "Error executing error capture script"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "Error capture script completed"
echo "======================================================"
echo ""
echo "After reviewing the errors, run ./fix-build-issues.sh to fix them."
echo ""
read -p "Press Enter to continue..."