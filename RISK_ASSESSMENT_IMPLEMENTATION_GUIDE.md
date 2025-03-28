# Risk Assessment Recommendations Implementation Guide

This guide provides specific implementation steps to fix the issue where recommendations entered in the admin panel aren't appearing in doctor questionnaire pages. It uses the same pattern as other successfully working questionnaire elements.

## Step 1: Identify Admin Input Location

First, we need to confirm exactly where administrators enter recommendations:

1. Navigate to the admin panel in the running application
2. Find the section for risk assessment recommendations
3. Note the form fields and structure of data being entered
4. Identify any "Save" or "Update" buttons and their associated click handlers

This typically looks like:
- Risk Level (dropdown: Low, Moderate, High)
- Min/Max Score thresholds 
- Recommendation text (textarea)

## Step 2: Trace Data Flow

Execute these SQL queries to identify where recommendation data is stored:

```sql
-- Check all tables that might contain recommendations
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%risk%' OR 
      table_name LIKE '%advice%' OR 
      table_name LIKE '%recommendation%';

-- Check question table for recommendation entries
SELECT id, question, tooltip
FROM questions
WHERE question LIKE '%recommendation%' OR
      question LIKE '%advice%' OR
      tooltip LIKE '%risk%';

-- Find admin form submissions 
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name LIKE '%advice%' OR
      column_name LIKE '%recommendation%';
```

## Step 3: Identify Correct Service Pattern

Examine the PatientQuestionnaireService which successfully brings admin-entered content to the doctor view:

```javascript
// Look for functions like:
export async function getUserQuestionnaires() {
  try {
    // Get the current authenticated user directly from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error("User not authenticated");
    }

    // Use RPC function for data access
    const { data, error } = await supabase
      .rpc('get_patient_questionnaires_for_user', { user_id_param: user.id });

    if (error) {
      console.error("Error fetching questionnaires:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    throw error;
  }
}
```

## Step 4: Code Changes

### 4.1: Define an RPC Function (SQL)

Create an RPC function that matches the pattern used by other successful elements:

```sql
CREATE OR REPLACE FUNCTION get_risk_assessment_recommendations()
RETURNS SETOF risk_assessment_advice
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return all recommendations from the appropriate table
  -- This should match where admin actually inputs recommendations
  RETURN QUERY
    SELECT *
    FROM risk_assessment_advice
    ORDER BY min_score ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO anon;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO service_role;
```

### 4.2: Update RiskAssessmentService.ts

Modify the service to match the pattern of other successful services:

```typescript
// Update the getAdvice method to use RPC function
async getAdvice(): Promise<RiskAssessmentAdvice[]> {
  try {
    // Clear cache to force fresh fetch
    cachedAdvice = null;
    
    // Use RPC function - matching pattern used by getUserQuestionnaires
    const { data, error } = await supabase
      .rpc('get_risk_assessment_recommendations');
    
    console.log("Recommendations from database:", {
      success: !error,
      count: data?.length || 0,
      samples: data?.map(a => ({
        level: a.risk_level,
        preview: a.advice?.substring(0, 30) + '...'
      }))
    });
    
    // Handle errors with appropriate fallback
    if (error) {
      console.error("Error fetching recommendations:", error);
      return [...FALLBACK_ADVICE];
    }
    
    // If we got data, transform it to match expected format
    if (data && data.length > 0) {
      return data.map(item => ({
        ...item,
        // Ensure consistent case for risk level matching
        risk_level: this.normalizeRiskLevel(item.risk_level)
      }));
    }
    
    // Fallback only if no data
    return [...FALLBACK_ADVICE];
  } catch (error) {
    console.error("Error in getAdvice:", error);
    return [...FALLBACK_ADVICE];
  }
}

// Remove or update getDirectFixAdvice to use the same pattern
// This function may be bypassing normal flow
```

### 4.3: Update Questionnaires.tsx

Ensure it's using the standard method for fetching recommendations:

```typescript
// Modify handleViewRiskAssessment to use standard getAdvice method
const handleViewRiskAssessment = async (id: string) => {
  try {
    setSelectedQuestionnaire(id);
    setIsViewingRisk(true);
    const data = await getQuestionnaireById(id);
    
    // Use standard getAdvice method instead of custom method
    const adviceList = await riskAssessmentService.getAdvice();
    
    // Match risk levels using case-insensitive comparison
    const riskLevel = data.risk_level || 
      (data.total_score <= 2 ? 'Low' : data.total_score <= 5 ? 'Moderate' : 'High');
    
    // Find matching advice using normalized risk level
    const normalizedRiskLevel = riskLevel.toLowerCase();
    const matchedAdvice = adviceList.find(a => 
      a.risk_level.toLowerCase() === normalizedRiskLevel
    );
    
    // Set risk assessment with the matched advice
    setRiskAssessment({
      score: data.total_score,
      riskLevel: riskLevel,
      contributing_factors: [ /* ... existing code ... */ ],
      advice: matchedAdvice?.advice || "No specific recommendations available at this time."
    });
  } catch (error) {
    console.error("Error loading risk assessment:", error);
    toast.error("Failed to load risk assessment");
  }
};
```

## Step 5: Verification

1. Enter distinctive recommendations in the admin panel for each risk level
2. View a patient questionnaire in doctor view
3. Verify the recommendation matches what was entered in admin

## Troubleshooting Guide

If recommendations still don't appear:

1. **Check Browser Console**: Look for errors or warnings
2. **Verify Data Storage**: Confirm data is saved to the expected table
3. **Trace RPC Function**: Ensure it's returning the expected data
4. **Check Service Method**: Add console.logs to verify data flow
5. **Verify Component Props**: Ensure advice is being passed correctly

## Rollback Plan

If issues arise, restore from backup:

```sql
-- Execute in Supabase SQL Editor
SELECT restore_questionnaire_system();
```

This approach directly aligns with the successful patterns used elsewhere in the code, ensuring a consistent and maintainable solution.