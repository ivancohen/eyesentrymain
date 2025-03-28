# Questionnaire System Improvements

## Overview

This document covers two key improvements made to the questionnaire system:

1. **Removal of Questionnaire Edit Feature**: Completely removed the edit functionality to simplify the system and avoid data corruption issues.

2. **Dropdown Options Synchronization**: Created a solution to ensure dropdown options and scores are properly synchronized between the admin section and patient questionnaire form.

## 1. Removal of Questionnaire Edit Feature

### Issues Addressed
- Risk assessment scores were not saving correctly when editing questionnaires
- Fields were not populating with original answers when editing
- Overall complexity and potential for data corruption

### Changes Made
- Removed `QuestionnaireEdit` component import and route from App.tsx
- Removed Edit button and functionality from Questionnaires.tsx
- Removed `updateQuestionnaire` function from PatientQuestionnaireService.ts

### Benefits
- Simplified system architecture
- Ensured data integrity
- Maintained proper risk assessment for initial questionnaire submissions
- Eliminated workflows that could lead to corruption of questionnaire data

## 2. Dropdown Options Synchronization

### Issue Addressed
The dropdown items and scores were appearing correctly in the admin question management section but not in the patient questionnaire form. This is because:

1. The admin section uses the `dropdown_options` table
2. The patient form tries to use the `question_options` table first, but falls back to `dropdown_options`
3. The data wasn't being properly synchronized between these tables

### Solution Implemented
We created a SQL synchronization mechanism that:

1. Creates the `question_options` table if it doesn't exist
2. Ensures all fields like `display_order` and `score` are present
3. Copies all data from `dropdown_options` to `question_options`
4. Sets up database triggers to keep the tables synchronized automatically
5. Creates a combined view for compatibility

### Files Created

#### SQL Script
- `supabase/sync_dropdown_options.sql` - Contains the complete database changes

#### Application Scripts
- `apply-sync-dropdown-options.js` - JavaScript script to execute the SQL
- `apply-sync-dropdown-options.bat` - Windows batch file
- `apply-sync-dropdown-options.sh` - Unix/Linux shell script

## How to Apply These Changes

### To Apply Dropdown Options Synchronization:

1. Run the appropriate script for your operating system:
   - Windows: `apply-sync-dropdown-options.bat`
   - Unix/Linux: `./apply-sync-dropdown-options.sh`

2. If Supabase credentials are not available, the script will output the SQL which you can manually execute in the Supabase SQL Editor.

### After Applying Changes:

1. The patient questionnaire should now correctly display all dropdown options and scores
2. Any updates made in the admin question management will automatically propagate to the patient form
3. Risk assessment scores should calculate correctly on initial submission

## Technical Details

### Dropdown Options Synchronization Logic

The SQL script implements several key components:

1. **Table Verification and Creation**:
   ```sql
   IF NOT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'question_options'
   ) THEN
       CREATE TABLE public.question_options (...);
   END IF;
   ```

2. **Data Synchronization**:
   ```sql
   CREATE OR REPLACE FUNCTION sync_dropdown_options_to_question_options()
   RETURNS INTEGER AS $$
   -- Logic to copy data from dropdown_options to question_options
   $$ LANGUAGE plpgsql;
   ```

3. **Automatic Synchronization Trigger**:
   ```sql
   CREATE TRIGGER dropdown_options_sync_trigger
   AFTER INSERT OR UPDATE OR DELETE ON public.dropdown_options
   FOR EACH ROW
   EXECUTE FUNCTION sync_dropdown_option_changes();
   ```

4. **Compatibility View**:
   ```sql
   CREATE OR REPLACE VIEW combined_question_options AS
   -- Logic to combine both tables with precedence given to question_options
   ```

## Troubleshooting

If you encounter issues with dropdown options not appearing:

1. Verify the SQL script executed successfully
2. Check the Supabase database for the existence of the `question_options` table
3. Verify data exists in both `dropdown_options` and `question_options` tables
4. Ensure the `PatientQuestionnaireService.ts` is correctly querying the tables

## Next Steps and Future Improvements

1. Consider consolidating to a single options table in a future update
2. Add more comprehensive validation for question and option data
3. Implement a periodic database maintenance job to ensure continued synchronization