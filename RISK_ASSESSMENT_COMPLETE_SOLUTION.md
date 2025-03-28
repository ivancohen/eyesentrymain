# Risk Assessment Recommendations: Complete Solution

## Executive Summary

The issue with risk assessment recommendations not appearing in doctor questionnaire pages stems from a mismatch between how administrators enter recommendations and how the application retrieves them. The current implementation is using a different pattern from other successfully working parts of the system.

This document provides a complete solution that aligns risk assessment recommendations with the same pattern used by other questionnaire elements, ensuring recommendations flow properly from admin input to doctor display.

## Root Cause Analysis

1. **Pattern Mismatch**: 
   - Risk assessment recommendations use a direct database query pattern
   - Other successful questionnaire elements use RPC functions with security context
   - The `getDirectFixAdvice` method bypasses normal data flow

2. **Data Source Issue**:
   - Recommendations may be stored in a different location than where the service is looking
   - The admin UI writes to one location while doctor views read from another

3. **Retrieval Logic**:
   - Current implementation falls back to hardcoded values too readily
   - Matching logic for risk levels may be inconsistent with other elements

## Solution Overview

The solution follows the exact same patterns used by other successful parts of the system:

1. **Use RPC Functions**: Create and use an RPC function for accessing recommendations
2. **Standardize Data Flow**: Ensure consistent flow from admin input to doctor display
3. **Normalize Matching Logic**: Use consistent case handling and matching strategies
4. **Add Robust Logging**: Make data flow visible for troubleshooting

## Technical Implementation

### 1. Create SQL RPC Function

Create an RPC function that follows the same pattern as other successful functions:

```sql
-- Create RPC function for risk assessment recommendations
CREATE OR REPLACE FUNCTION get_risk_assessment_recommendations()
RETURNS SETOF risk_assessment_advice
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT *
    FROM risk_assessment_advice
    ORDER BY min_score ASC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO anon;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO service_role;
```

### 2. Update RiskAssessmentService

Modify the RiskAssessmentService to use the same patterns as other services:

```typescript
// Update getAdvice method to match successful patterns
async getAdvice(): Promise<RiskAssessmentAdvice[]> {
  try {
    // Clear cache to ensure fresh data
    cachedAdvice = null;
    
    // Use RPC function instead of direct table query
    const { data, error } = await supabase
      .rpc('get_risk_assessment_recommendations');
    
    // Add detailed logging for troubleshooting
    console.log("RECOMMENDATIONS FROM RPC:", {
      success: !error,
      count: data?.length || 0,
      items: data?.map(a => ({
        level: a.risk_level,
        preview: a.advice?.substring(0, 30) + '...'
      }))
    });
    
    // Handle errors with appropriate fallback
    if (error) {
      console.error("Error fetching recommendations:", error);
      return [...FALLBACK_ADVICE];
    }
    
    // Process and normalize data
    if (data && data.length > 0) {
      const normalizedData = data.map(item => ({
        ...item,
        risk_level: this.normalizeRiskLevel(item.risk_level)
      }));
      
      // Cache the normalized data
      cachedAdvice = normalizedData;
      return normalizedData;
    }
    
    // Use fallback as last resort
    console.warn("No recommendations found in database");
    return [...FALLBACK_ADVICE];
  } catch (error) {
    console.error("Error in getAdvice:", error);
    return [...FALLBACK_ADVICE];
  }
}

// Either remove getDirectFixAdvice or update it to use the same pattern
// If kept, it should use the RPC function rather than returning hardcoded values
```

### 3. Update Questionnaires Component

Ensure Questionnaires.tsx follows the same patterns as other components:

```typescript
// Update the risk assessment handling
const handleViewRiskAssessment = async (id: string) => {
  console.log("Loading risk assessment for ID:", id);
  try {
    setSelectedQuestionnaire(id);
    setIsViewingRisk(true);
    
    // Get questionnaire data using existing pattern
    const data = await getQuestionnaireById(id);
    console.log("Questionnaire data:", data);
    
    // Use standard getAdvice method - NOT getDirectFixAdvice
    const adviceList = await riskAssessmentService.getAdvice();
    console.log("Advice list:", adviceList);
    
    // Determine risk level consistently
    const riskLevel = data.risk_level || 
      (data.total_score <= 2 ? 'Low' : data.total_score <= 5 ? 'Moderate' : 'High');
    
    // Use consistent matching logic
    const normalizedRiskLevel = riskLevel.toLowerCase();
    let matchedAdvice = adviceList.find(a => 
      a.risk_level.toLowerCase() === normalizedRiskLevel
    );
    
    console.log("Matched advice:", matchedAdvice);
    
    // Set the risk assessment state with all required fields
    setRiskAssessment({
      score: data.total_score,
      riskLevel: riskLevel,
      contributing_factors: [ /* existing code */ ],
      advice: matchedAdvice?.advice || "No specific recommendations available at this time."
    });
  } catch (error) {
    console.error("Error loading risk assessment:", error);
    toast.error("Failed to load risk assessment");
  }
};
```

### 4. Update QuestionnaireResults Component

Ensure the component handles recommendations correctly:

```typescript
// In QuestionnaireResults.tsx, add logging to verify data flow
console.log("Rendering QuestionnaireResults with:", {
  score,
  riskLevel,
  advice,
  adviceLength: advice?.length || 0
});

// Use the advice prop directly, with fallback if empty
const displayAdvice = advice && advice.trim().length > 0
  ? advice
  : `No specific recommendations available for ${riskLevel} risk level.`;
```

## Implementation Steps

1. **Create SQL Function**:
   - Execute the SQL to create the `get_risk_assessment_recommendations` function
   - Verify it returns expected data

2. **Update Service**:
   - Modify RiskAssessmentService to use the RPC function
   - Replace `getDirectFixAdvice` or update it to use the RPC pattern

3. **Update Components**:
   - Modify Questionnaires.tsx to use standard methods
   - Ensure consistent risk level normalization
   - Add detailed logging for troubleshooting

4. **Test**:
   - Enter recommendations in admin panel
   - View patient questionnaires as doctor
   - Verify recommendations display correctly

## Verification Checklist

- [ ] RPC function executes without errors
- [ ] Service retrieves recommendations from database
- [ ] Risk levels are matched consistently
- [ ] Recommendations display in doctor view
- [ ] No errors appear in browser console
- [ ] Other functionality works without disruption

## Conclusion

This solution aligns risk assessment recommendations with the successful patterns used elsewhere in the system. By using RPC functions, consistent data flow, and proper error handling, we ensure recommendations entered by administrators will properly appear in doctor questionnaire views.