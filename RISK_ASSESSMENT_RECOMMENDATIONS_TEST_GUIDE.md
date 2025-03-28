# Risk Assessment Recommendations Testing Guide

This guide will help you verify that the risk assessment recommendations fix has been correctly applied and is working as expected.

## Prerequisites

1. Ensure you have applied the fix by running either:
   - Windows: `apply-risk-assessment-fix.bat`
   - Mac/Linux: `sh apply-risk-assessment-fix.sh`

2. Make sure your application is running (`npm run dev`)

3. Have access to both admin and doctor roles in the application

## Test Procedure

### Step 1: Verify SQL Functions

1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following queries to verify our functions exist:

```sql
-- Check if get_risk_assessment_advice function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_risk_assessment_advice';

-- Check if update_risk_assessment_advice function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'update_risk_assessment_advice';
```

### Step 2: Test Recommendation Creation in Admin Panel

1. Log in as an administrator
2. Navigate to the Risk Assessment section
3. For each risk level (Low, Moderate, High), create a distinctive recommendation:
   - Low: "TEST123 - This is a test recommendation for LOW risk patients"
   - Moderate: "TEST456 - This is a test recommendation for MODERATE risk patients"
   - High: "TEST789 - This is a test recommendation for HIGH risk patients"
4. Save each recommendation and verify it appears in the admin list view

### Step 3: Test Recommendation Display in Doctor View

1. Log in as a doctor (or switch to doctor role)
2. Navigate to the Patient Questionnaires section
3. Select a questionnaire with a **Low** risk level:
   - Verify the recommendation displays correctly and shows your "TEST123" text
   - Check the browser console for detailed matching logs
4. Repeat for **Moderate** and **High** risk questionnaires
   - Verify each shows the appropriate recommendation

### Step 4: Test Edge Cases

1. **Case sensitivity**: Create a recommendation with mixed case (e.g., "Low" vs "LOW")
   - Verify it still gets matched correctly
2. **Score-based matching**: Create a patient with a borderline score
   - Verify the recommendation matches based on both risk level and score
3. **Missing recommendation**: Temporarily delete all recommendations for one risk level
   - Verify the system uses appropriate fallback text

## Troubleshooting

If recommendations are not displaying correctly:

1. Check browser console logs for detailed debugging information
2. Verify the risk levels match exactly (case sensitive) or are being normalized correctly
3. Ensure the Supabase RPC functions are accessible to your application
4. Confirm the advice data exists in the `risk_assessment_advice` table

## Expected Results

After applying the fix, you should observe:

1. Recommendations entered in the admin panel should consistently appear in doctor view
2. Matching should work regardless of case sensitivity
3. Multiple matching strategies should ensure recommendations are found
4. The browser console should show detailed logs about the matching process

If any test fails, please refer to the `RISK_ASSESSMENT_RECOMMENDATIONS_FIX_PLAN.md` document for a detailed explanation of the fix and potential issues.