#!/bin/bash
echo "==================================================="
echo "Complete Question Reordering Fix and Test"
echo "==================================================="
echo

echo "Step 1: Ensuring database schema is correct..."
echo "---------------------------------------------------"
bash add-display-order-to-dropdown-options.sh
if [ $? -ne 0 ]; then
    echo "❌ Database schema update failed. Aborting."
    exit 1
fi
echo

echo "Step 2: Fixing QuestionService.ts implementation..."
echo "---------------------------------------------------"
node fix-question-reordering.js
if [ $? -ne 0 ]; then
    echo "❌ Service implementation fix failed. Aborting."
    exit 1
fi
echo

echo "Step 3: Restarting the server to apply changes..."
echo "---------------------------------------------------"
bash restart-server.sh
if [ $? -ne 0 ]; then
    echo "⚠️ Server restart had issues, but continuing."
fi
echo

echo "Step 4: Testing the reordering functionality..."
echo "---------------------------------------------------"
node test-question-reordering.js
TEST_RESULT=$?
if [ $TEST_RESULT -ne 0 ]; then
    echo "⚠️ Test failed. The fix may need adjustments."
    INCOMPLETE=true
else
    INCOMPLETE=false
fi

echo
if [ "$INCOMPLETE" = false ]; then
    echo "==================================================="
    echo "🎉 SUCCESS! Question reordering is now working"
    echo "==================================================="
    echo "The following fixes have been applied:"
    echo " - Added display_order column to dropdown_options table"
    echo " - Updated QuestionService.ts to properly handle display_order"
    echo " - Implemented efficient reordering with PostgreSQL function" 
    echo " - Verified functionality with automated tests"
else
    echo "==================================================="
    echo "⚠️ WARNING: Fix applied but test failed"
    echo "==================================================="
    echo "The fixes have been applied, but the test did not complete successfully."
    echo "This may indicate additional issues that need to be addressed."
fi
echo

if [ "$INCOMPLETE" = true ]; then
    exit 1
else
    exit 0
fi