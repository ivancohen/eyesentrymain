# Questionnaire Edit Fix Documentation

## Issues Description

The questionnaire editing functionality is currently experiencing two critical issues:

1. **Risk Assessment Scores Not Saving**: When editing a questionnaire, the risk assessment scores are calculated correctly and the RPC call reports success, but the scores are not being persisted in the database.

2. **Form Not Populated with Original Answers**: When editing a questionnaire, none of the fields are populated with the original answers, and the score is reset to 0. This forces users to re-enter all information, causing a poor user experience and potential data loss.

## Root Causes

### Issue 1: Risk Assessment Scores Not Saving

The database function `update_patient_questionnaire` may not be properly handling the `total_score` and `risk_level` fields during updates. The frontend code correctly calculates and sends these values, but they're not being stored in the database.

Specifically:
- The SQL function may not be explicitly handling these fields in its parameter list
- The update statement in the function may be missing these fields in its SET clause
- There might be a mismatch between parameter names and database column names

### Issue 2: Form Not Populated with Original Answers

The mapping between database fields and form fields in the `QuestionnaireEdit` component is failing because:

1. The component uses text-matching attempts to find question IDs, which is unreliable
2. There's no consistent method to map database boolean fields to string option values
3. The component doesn't properly utilize the `answers` JSON field if it exists
4. The mapping logic isn't robust enough to handle varying question text patterns

## Solution Approach

### Fix for Risk Assessment Scores Not Saving

We've created an SQL script that modifies the `update_patient_questionnaire` function to:

1. Explicitly include `total_score` and `risk_level` parameters
2. Properly update these fields in the SET clause of the UPDATE statement
3. Add audit logging to track successful updates
4. Ensure proper permissions are applied to the function

### Fix for Form Not Populated with Original Answers

We've created a fixed version of the `QuestionnaireEdit` component that:

1. Implements a robust question ID mapping system using consistent patterns
2. Properly handles boolean-to-string mapping for option selections
3. Correctly utilizes the `answers` JSON field if it exists in the fetched data
4. Stores the original questionnaire data to enable proper resets
5. Improves error handling and validation

## Implementation Details

### SQL Function Update

The SQL function has been updated to:

```sql
CREATE OR REPLACE FUNCTION public.update_patient_questionnaire(
    questionnaire_id uuid,
    -- ... other parameters ...
    total_score integer,  -- Ensure this parameter is included
    risk_level text,      -- Ensure this parameter is included
    metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- ... function body ...
    UPDATE public.patient_questionnaires
    SET 
        -- ... other fields ...
        total_score = update_patient_questionnaire.total_score,  -- Explicitly update risk score
        risk_level = update_patient_questionnaire.risk_level,   -- Explicitly update risk level
        -- ... other fields ...
    WHERE id = questionnaire_id;
-- ... rest of function ...
$$;
```

### Component Improvements

The `QuestionnaireEdit` component has been enhanced with:

1. **Improved Question Mapping**:
   ```typescript
   // Map of known DB fields to their question text patterns for better mapping
   const DB_FIELD_PATTERNS: Record<string, string[]> = {
     'age': ['age', 'how old'],
     'race': ['race', 'ethnicity'],
     'family_glaucoma': ['family', 'glaucoma', 'immediate family'],
     // ... other patterns ...
   };
   ```

2. **Boolean-to-String Mapping**:
   ```typescript
   // Map DB boolean fields to string values
   const BOOLEAN_TO_STRING_MAP: Record<string, { true: string, false: string }> = {
     'family_glaucoma': { true: 'yes', false: 'no' },
     'ocular_steroid': { true: 'yes', false: 'no' },
     // ... other mappings ...
   };
   ```

3. **Original Data Storage**:
   ```typescript
   // Store the original questionnaire data for reference
   const [originalData, setOriginalData] = useState<FetchedQuestionnaireData | null>(null);
   // Cache the question ID mapping for better performance
   const [questionIdMap, setQuestionIdMap] = useState<Record<string, string>>({});
   ```

4. **Improved Answer Mapping**:
   ```typescript
   // If the questionnaire has an answers JSON field, use it directly
   if (questionnaireData.answers && Object.keys(questionnaireData.answers).length > 0) {
     console.log("Using stored answers JSON directly:", questionnaireData.answers);
     setAnswers(questionnaireData.answers);
   } else {
     // Otherwise, map the DB fields to question IDs
     // We'll do this mapping after questionIdMap is populated
     // ...
   }
   ```

## Files Created/Modified

1. `fix-risk-score-saving.sql`: Contains the SQL to update the database function
2. `fix-risk-score-saving.js`: JavaScript script to execute the SQL
3. `fix-risk-score-saving.bat/sh`: Batch/shell files to run the JavaScript script
4. `QuestionnaireEditFix.tsx`: Fixed version of the QuestionnaireEdit component
5. `fix-questionnaire-edit.js`: Script to apply both fixes
6. `fix-questionnaire-edit.bat/sh`: Batch/shell files to run the combined fix

## How to Apply the Fix

1. Run the `fix-questionnaire-edit.bat` file (Windows) or `fix-questionnaire-edit.sh` (Unix/Linux) from the project root directory.

2. The script will:
   - Execute the SQL script to update the database function
   - Replace the original `QuestionnaireEdit.tsx` with the fixed version
   - Create backups of the original files in case a rollback is needed
   - Display a success message when the fix is applied

## Verifying the Fix

To verify the fix has been properly applied:

1. Log in to the application
2. Go to the Questionnaires page
3. Click 'Edit' on an existing questionnaire
4. Verify that:
   - All fields are populated with the original answers
   - The risk score is displayed correctly
5. Make changes to some fields and save the questionnaire
6. Verify that:
   - The form submits successfully 
   - The risk score is updated based on the new values
   - When returning to edit, the updated values are displayed

## Troubleshooting

If you encounter issues after applying the fix:

1. **Forms still not populating**: Check if the `answers` field exists in your questionnaire records. If not, the system will use mapping logic which might need further adjustment.

2. **Risk scores still not saving**: Verify that the SQL function was updated correctly by querying the function definition:
   ```sql
   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'update_patient_questionnaire';
   ```

3. **Component errors after upgrade**: Restore from backup by copying the backup file:
   ```
   cp src/components/questionnaires/QuestionnaireEdit.backup.tsx src/components/questionnaires/QuestionnaireEdit.tsx
   ```

## Future Improvements

1. Add more robust error handling and recovery mechanisms
2. Implement automatic field mapping based on database schema metadata
3. Add more comprehensive logging for risk assessment calculations
4. Create unit tests to verify the form population and risk score calculation
5. Consider storing the question ID mapping in a database table for easier management