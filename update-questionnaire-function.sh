#!/bin/bash
echo "==================================================="
echo "Updating get_patient_questionnaires_for_user Function"
echo "==================================================="
echo

echo "Applying fix to update the get_patient_questionnaires_for_user function..."
node update-questionnaire-function.js

echo
echo "Done! The get_patient_questionnaires_for_user function has been updated."
echo "Patient names should now be displayed correctly in the questionnaires list."
echo