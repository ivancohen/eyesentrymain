#!/bin/bash
echo "==================================================="
echo "Restoring Patient Names System"
echo "==================================================="
echo

echo "Calling restore function..."
node restore-patient-names.js

echo
echo "Done! Patient names system should be restored to its previous state."
echo