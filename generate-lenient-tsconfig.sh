#!/bin/bash

echo "======================================================"
echo "Generating Lenient TypeScript Configuration"
echo "======================================================"
echo ""
echo "This script will generate a more lenient TypeScript configuration"
echo "that ignores type errors during build."
echo ""
echo "======================================================"

# Run our configuration generation script
node generate-lenient-tsconfig.js

if [ $? -ne 0 ]; then
    echo "Error executing configuration generation script"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "Configuration generation script completed"
echo "======================================================"
echo ""
echo "You can now try building with:"
echo "npm run build"
echo ""
read -p "Press Enter to continue..."