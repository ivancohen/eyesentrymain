# Risk Assessment Scoring Fix

## Issue Identified

The patient risk assessment scores are not being totalled after the questionnaire is completed. After investigating the code, we've identified that:

1. The risk assessment scoring logic is correctly implemented in the `RiskAssessmentService.ts` file
2. The `PatientQuestionnaireService.ts` file correctly calls the risk assessment service and stores the scores
3. The issue is likely with the database functions that handle the questionnaire submission

## Solution

We've created a comprehensive fix that ensures risk scores are properly calculated, saved, and displayed:

1. **Database Schema**: Ensuring the `patient_questionnaires` table has the necessary columns:
   - `total_score`: To store the calculated risk score
   - `risk_level`: To store the risk level (Low, Moderate, High)

2. **Database Functions**: Updating the database functions to properly handle risk scores:
   - `insert_patient_questionnaire`: To properly save the total score and risk level
   - `get_patient_questionnaires_for_user`: To return the total score and risk level

3. **Service Layer**: Verifying that the service layer correctly:
   - Calculates the risk scores
   - Passes the scores to the database functions
   - Returns the scores to the frontend

## Implementation Steps

1. Execute the SQL in the `fix_risk_assessment_scoring.sql` file in your Supabase SQL editor:
   - Log in to your Supabase dashboard
   - Go to the SQL Editor
   - Copy and paste the contents of the `fix_risk_assessment_scoring.sql` file
   - Run the SQL

2. Restart the application to apply the changes:
   ```bash
   cmd.exe /c restart-server-final.bat
   ```

## SQL Fix Details

The SQL fix includes:

```sql
-- Ensure the patient_questionnaires table has the necessary columns
ALTER TABLE IF EXISTS public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Unknown';

-- Update the insert_patient_questionnaire function to properly handle risk scores
CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
  -- Parameters including total_score and risk_level
) RETURNS UUID AS $$
  -- Function body that properly saves total_score and risk_level
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the get_patient_questionnaires_for_user function returns total_score and risk_level
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF patient_questionnaires AS $$
  -- Function body that returns all columns including total_score and risk_level
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Verification

After implementing the fix, you should be able to:

1. Submit a new questionnaire
2. See the calculated risk score and risk level
3. View the risk score and risk level in the questionnaire details

If you still encounter issues after implementing this fix, please let me know and we can explore other solutions.