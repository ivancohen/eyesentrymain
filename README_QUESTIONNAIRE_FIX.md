# EyeSentry Questionnaire & Doctor Approval Fix

## Overview

This package contains fixes for three critical issues in the EyeSentry application:

1. **Doctor Approval Status Checking** - 404 error when calling the `check_doctor_approval_status` function
2. **Patient Questionnaire Submission** - Foreign key constraint errors when attempting to submit questionnaires
3. **Questions Table** - ID constraint error when adding new questions

## Current Status

Based on our diagnostics:

✅ **Doctor Approval Status Checking**: Already fixed
❌ **Patient Questionnaire Submission**: Still needs fixing
❌ **Questions Table**: Needs fixing (ID constraint issue)

## Quick Start

1. Run the diagnostic script to verify the current status:
   - Windows: `fix-questionnaire-doctor-approval.bat`
   - Mac/Linux: `fix-questionnaire-doctor-approval.sh`

2. Follow the instructions in `QUESTIONNAIRE_FIX_SIMPLIFIED.md` to apply the remaining fixes.

## Files Included

- `fix-questionnaire-doctor-approval.js` - JavaScript diagnostic script
- `fix-questionnaire-doctor-approval.bat` - Windows batch file to run the script
- `fix-questionnaire-doctor-approval.sh` - Shell script for Mac/Linux to run the script
- `QUESTIONNAIRE_FIX_SIMPLIFIED.md` - Simplified fix instructions
- `QUESTIONNAIRE_DOCTOR_APPROVAL_FIX_GUIDE.md` - Comprehensive documentation
- `docs/restore-points/RESTORE_20240326_questionnaire_doctor_approval.md` - Restore point documentation
- `supabase/fix_patient_questionnaires_table.sql` - SQL script to fix patient questionnaires table
- `supabase/fix_questions_table.sql` - SQL script to fix questions table

## Implementation Details

The fix addresses three main issues:

1. **Doctor Approval Status Checking**:
   - Creates the `check_doctor_approval_status` function in the database
   - This function checks if a user has requested doctor status and returns their approval status

2. **Patient Questionnaire Submission**:
   - Removes problematic foreign key constraints on the `patient_id` column
   - Ensures the `user_id`, `patient_id`, and `doctor_id` columns exist with proper values
   - Creates database functions for questionnaire operations

3. **Questions Table**:
   - Adds a default UUID generator to the `id` column
   - Ensures the `display_order` and other required columns exist
   - Creates an `insert_question` function for proper ID handling

## Verification

After applying the fixes, verify that:

1. Doctor approval status checking works without 404 errors
2. Questionnaire submission works without foreign key constraint errors
3. Submitted questionnaires are accessible in the patient's history
4. New questions can be added without ID constraint errors

## Questionnaire Form Implementation

After thorough testing, we've determined that the most reliable approach for the questionnaire form is to use the predefined questions in the codebase rather than dynamically loading them from the database. This approach ensures:

1. Consistency in the questionnaire experience
2. Proper validation of required fields
3. Correct conditional question logic
4. Reliable risk assessment scoring

The system will still:
- Use database tooltips and question text when available
- Store questions in the database for admin management
- Allow dropdown options to be fetched from the database

### Hybrid Approach for Future Extension

We've implemented a hybrid approach that allows for future extension:

1. The questionnaire primarily displays the 4 hardcoded questions defined in `questionnaireConstants.ts`
2. These questions are enhanced with tooltips and improved text from the database when available
3. The code now includes a mechanism to add special questions from the admin interface
   - To add a question from the admin panel to the form:
     1. Add "add_to_form" in the tooltip
     2. Ensure the question has the correct page_category matching where it should appear
   - We've included a SQL script (update_test_question_tooltip.sql) that correctly configures
     the "This is a test question" item to appear ONLY on the first page (patient_info category)
   - The test question now contributes to the risk assessment score (adds 1 point if answered "yes")
   - All future questions added with "add_to_form" in the tooltip will follow the same logic
   - Each question with a "yes" answer will add 1 point to the risk assessment score

This approach maintains the stability of the current questionnaire while providing a path for future extensions.

### Database-related Improvements

We've improved the database handling with:

1. Better error handling for the questions table
2. A fix for the created_by column NULL constraint
3. A trigger to automatically set the ID for new questions
4. An RPC function for question insertion

### Standardizing Question Categories

We've also created a script (`standardize_question_categories.sql`) to help normalize question categories in the database. This ensures that categories in the admin panel follow a consistent naming convention.

## Risk Assessment Score Limitation

Please note that while new questions will appear in the patient questionnaire form, they won't be automatically included in the risk assessment score calculation. The risk assessment score is calculated based on a predefined set of questions in the `PatientQuestionnaireService.ts` file.

To include new questions in the risk assessment score, you would need to:
1. Add scoring configurations for the new questions in the database
2. Or modify the `PatientQuestionnaireService.ts` file to include the new questions in the score calculation

This enhancement is beyond the scope of the current fix but could be implemented as a future improvement.

## Support

If you encounter any issues after applying the fixes, please refer to the comprehensive documentation in `QUESTIONNAIRE_DOCTOR_APPROVAL_FIX_GUIDE.md`.