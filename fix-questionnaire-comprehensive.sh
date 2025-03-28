#!/bin/bash
echo "======================================================"
echo "Executing comprehensive questionnaire system fix script"
echo "======================================================"

# Make sure Node modules are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies first..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error installing dependencies"
        exit 1
    fi
fi

# Run our fix script
echo "Running comprehensive fix script..."
node run-comprehensive-questionnaire-fix.js

if [ $? -ne 0 ]; then
    echo "Error executing fix script"
    exit 1
fi

echo ""
echo "Fix script completed successfully"
echo "======================================================"
echo ""
echo "You may now test the system functionality:"
echo "1. Submitting new questionnaires - patient names should be saved"
echo "2. Risk assessment scores should be calculated correctly" 
echo "3. Editing existing questionnaires should work as expected"
echo ""