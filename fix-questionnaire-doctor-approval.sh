#!/bin/bash

# Script to fix questionnaire and doctor approval issues
echo "Running questionnaire and doctor approval fix..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run this script."
    exit 1
fi

# Run the fix script
node fix-questionnaire-doctor-approval.js

echo "Script execution completed."
echo "Please follow the instructions displayed above to complete the fix."