# Simplified Questionnaire Edit Fix Instructions

## Overview

This simplified fix addresses one of the two issues with the questionnaire editing functionality:

- ✅ **Forms not populated with original answers**: Fixes the issue where fields are not populated with original values when editing a questionnaire

- ❌ **Risk assessment scores not saving**: This simplified version does NOT fix this issue as it requires database credentials

## Why This Simplified Approach?

The original fix requires Supabase environment variables (`SUPABASE_URL` and `SUPABASE_SERVICE_KEY`) to execute the SQL script that fixes the risk score saving issue. Since these credentials aren't available, this simplified version only addresses the form population issue by replacing the component without executing any database operations.

## How to Apply the Simplified Fix

1. Run one of the following commands from the project root:
   - Windows: `fix-questionnaire-edit-simplified.bat`
   - Unix/Linux: `./fix-questionnaire-edit-simplified.sh`

2. The script will:
   - Create a backup of the original QuestionnaireEdit component
   - Replace it with the fixed version
   - Display a success message

## What's Fixed

After applying this fix, the edit form will be properly populated with the original answers when editing a questionnaire. Key improvements include:

1. Robust question ID mapping using text patterns to match DB fields to question IDs
2. Proper mapping between boolean DB values and string form values
3. Correctly utilizing the `answers` JSON field if it exists
4. Storage of original data for reference and proper resets

## What's Not Fixed

The risk score saving issue is not addressed by this simplified fix. When you submit an edited questionnaire:

- The frontend will calculate the correct risk score
- The submission will report success
- But the score may not be persisted in the database

## How to Fix the Risk Score Saving Issue Later

To fix the risk score saving issue, you'll need to:

1. Set up Supabase credentials in a `.env` file:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

2. Apply the SQL script manually using one of these methods:
   - Use the Supabase SQL Editor to run the content of `fix-risk-score-saving.sql`
   - Set up the credentials and run the full fix: `fix-questionnaire-edit.bat` (or `.sh`)

## Verifying the Fix

To verify that the form population fix works:

1. Log in to the application
2. Go to the Questionnaires page
3. Click 'Edit' on an existing questionnaire
4. Verify that all fields are populated with the original answers

## Rollback Instructions

If you encounter issues and need to roll back to the original component:

1. Go to `src/components/questionnaires/`
2. Replace `QuestionnaireEdit.tsx` with `QuestionnaireEdit.backup.tsx`

## Files Created/Modified

- `QuestionnaireEditFix.tsx`: Fixed version of the QuestionnaireEdit component
- `fix-questionnaire-edit-simplified.js`: Script to replace the component
- `fix-questionnaire-edit-simplified.bat/sh`: Batch/shell files to run the script
- `fix-risk-score-saving.sql`: SQL script for the database fix (not applied in this simplified approach)
- `SIMPLIFIED_FIX_INSTRUCTIONS.md`: This document

For more detailed information about both issues and the complete fix, see `QUESTIONNAIRE_EDIT_FIX.md`.