# Risk Assessment Score Saving Fix

## Issue Description

The system is currently experiencing an issue where risk assessment scores are not being saved properly when editing patient questionnaires. The console logs show that:

1. The risk score is being calculated correctly: `Calculated Score: 0 Risk Level: Low`
2. The data is being prepared for the database call: `Data prepared for RPC update_patient_questionnaire: {age: '', race: '', family_glaucoma: false, ocular_steroid: false, intravitreal: false, …}`
3. The RPC call even reports success: `Questionnaire 7b2c5744-a2cb-4f5c-bc20-01165a78a523 updated successfully via RPC.`

Despite these successes, the risk assessment scores and risk levels are not being persisted in the database.

## Root Cause

After investigation, we've identified that the issue is in the `update_patient_questionnaire` database function. While the frontend code correctly calculates and sends the risk score and risk level values, the database function may not be properly assigning these values to the database columns during updates.

Specifically:

1. The SQL function may not be explicitly handling the `total_score` and `risk_level` fields
2. There might be a mismatch between parameter names in the function and the field names in the table
3. The update operation may be missing these specific fields in its SET clause

## Solution

We've created a SQL fix that modifies the `update_patient_questionnaire` function to properly handle risk assessment scores. The fix:

1. Ensures the function accepts `total_score` and `risk_level` parameters
2. Explicitly updates these fields in the SET clause of the UPDATE statement
3. Adds audit logging to track successful updates
4. Applies proper permissions to the function

This is part of the comprehensive questionnaire system fix and builds upon previous improvements to the risk assessment calculation.

## How to Apply the Fix

1. Run the `fix-risk-score-saving.bat` file (Windows) from the project root directory
2. The script will:
   - Execute the SQL script to update the database function
   - Display a success message when the fix is applied

## Verifying the Fix

To verify the fix has been properly applied:

1. Log in to the application
2. Edit an existing questionnaire:
   - Change values that affect risk assessment (e.g., race, family history of glaucoma)
   - Save the questionnaire
3. Refresh the page and verify that the risk score and risk level have been updated
4. Check the database directly (if possible) to confirm that the `total_score` and `risk_level` columns contain the expected values

## Files Created/Modified

- `fix-risk-score-saving.sql`: Contains the SQL to update the database function
- `fix-risk-score-saving.js`: JavaScript script to execute the SQL
- `fix-risk-score-saving.bat`: Batch file to run the JavaScript script

## Related Issues

This fix addresses the "risk assessment scores are not saving" issue, which is one of the key issues with the questionnaire system. It complements the previous fixes for:

1. Patient names saving correctly
2. Risk assessment scores calculating correctly
3. Editing questionnaires without errors

## Technical Details

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

## Next Steps

After applying this fix, the entire questionnaire system should function correctly. Future enhancements may include:

1. Adding more comprehensive logging for risk assessment calculations
2. Improving the UI to better display risk scores and advice
3. Adding data validation to ensure risk scores are within expected ranges