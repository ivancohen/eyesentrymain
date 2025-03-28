#!/bin/bash
echo "==================================================="
echo "Fixing Patient Names in Questionnaires"
echo "==================================================="
echo

echo "Applying fix to ensure patient names are saved correctly..."
node fix-patient-names.js

echo
echo "Done! The patient names should now be saved correctly in questionnaires."
echo