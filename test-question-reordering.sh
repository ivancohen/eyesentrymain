#!/bin/bash
echo "==================================================="
echo "Testing Question Reordering Functionality"
echo "==================================================="
echo

echo "Running test script..."
node test-question-reordering.js

echo
if [ $? -eq 0 ]; then
  echo "Test completed successfully!"
else
  echo "Test failed with error code: $?"
  echo "Please check the logs for details."
fi
echo