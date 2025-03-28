#!/bin/bash

# EyeSentry Questionnaire System Fix Script
# This script applies all necessary fixes to the questionnaire system

echo "==============================================="
echo "EyeSentry Questionnaire System Fix Script"
echo "==============================================="

# Create a restore point
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESTORE_POINT_DIR="docs/restore-points"
RESTORE_POINT_FILE="$RESTORE_POINT_DIR/RESTORE_${TIMESTAMP}_questionnaire_system.md"

mkdir -p "$RESTORE_POINT_DIR"

echo "Creating restore point at $RESTORE_POINT_FILE..."
cat > "$RESTORE_POINT_FILE" << EOF
# Questionnaire System Restore Point (${TIMESTAMP})

This restore point was created before applying the questionnaire system fixes.

## Components affected:
- PatientQuestionnaireService.ts - Risk score calculation and API fixes
- QuestionnaireForm.tsx - Special question handling and category filtering
- Database schemas - RPC functions and risk assessment advice table

If you need to revert changes, refer to this restore point.
EOF

echo "Restore point created successfully."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found! You can still run the SQL scripts manually."
else
    echo "Supabase CLI found, connecting to Supabase..."
    
    # Run the SQL fixes
    echo "Applying RPC function fix..."
    supabase db execute --file supabase/fix_questionnaire_rpc.sql
    
    echo "Applying risk assessment advice table fix..."
    supabase db execute --file supabase/fix_risk_assessment_advice.sql
    
    echo "Updating test question tooltip..."
    supabase db execute --file supabase/update_test_question_tooltip.sql
    
    echo "Adding risk score to questions table..."
    supabase db execute --file supabase/add_risk_score_to_questions.sql
fi

echo ""
echo "==============================================="
echo "Fix Summary:"
echo "==============================================="
echo "1. Fixed PatientQuestionnaireService.ts to correctly handle test questions"
echo "2. Improved error handling for risk assessment advice"
echo "3. Created SQL fixes for database issues"
echo "4. Updated test question to include it in risk calculations"
echo ""
echo "To test the fix:"
echo "1. Run the application with 'npm run dev'"
echo "2. Fill out the questionnaire form and answer 'yes' to the test question"
echo "3. Verify the test question appears in the risk factors"
echo "4. Confirm the risk score includes the test question's point"
echo ""
echo "Note: If you couldn't run the SQL scripts automatically,"
echo "please run them manually in the Supabase console:"
echo "- supabase/fix_questionnaire_rpc.sql"
echo "- supabase/fix_risk_assessment_advice.sql"
echo "- supabase/update_test_question_tooltip.sql"

echo ""
echo "Fix script completed."