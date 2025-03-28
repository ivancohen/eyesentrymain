# Risk Assessment Recommendations Fix Plan

## Problem Statement
Recommendations entered in the admin panel are not showing up in doctor questionnaire pages. This is a critical issue as doctors need to see the appropriate risk assessment recommendations for patients.

## Root Issues Identified

1. **Data Fetching Pattern Mismatch**:
   - Working services use RPC functions (stored procedures)
   - RiskAssessmentService directly queries database tables which may have different access permissions or behavior
   - The successful pattern in the codebase uses RPC functions like `get_patient_questionnaires_for_user`

2. **Data Matching Logic**:
   - Multiple matching strategies implemented but not consistently applied
   - Potential case sensitivity issues in risk level comparisons (e.g., "Low" vs "low")
   - Possible field naming inconsistencies between admin and doctor views

3. **Cache Management**:
   - Cache clearing may not be properly propagating across the application
   - Manual cache invalidation in Questionnaires.tsx using `riskAssessmentService["cachedAdvice"] = null` is not ideal

4. **Code Structure Issue**:
   - A syntax error (extra curly brace) in RiskAssessmentService.ts was causing parsing issues
   - This has been fixed but other structural issues may remain

## Recommended Solutions

1. **Create RPC Function for Risk Advice**:
   - Develop a new stored procedure similar to `get_patient_questionnaires_for_user`
   - Example: `get_risk_assessment_advice()`
   - This ensures consistent access patterns and permissions

2. **Modify RiskAssessmentService to**:
   - Use the new RPC function instead of direct table access
   - Standardize risk level casing for consistent matching
   - Add comprehensive logging for diagnostic purposes
   - Implement proper cache invalidation

3. **Fix Matching Logic**:
   - Implement consistent case-insensitive matching
   - Use multiple fallback strategies in a predictable order
   - Ensure score range matching aligns with risk levels

4. **Enhance Error Handling**:
   - Provide clear fallbacks when advice cannot be found
   - Log detailed information for debugging purposes
   - Use consistent error handling patterns

## Implementation Plan

### Phase 1: Create SQL Function
1. Create a PostgreSQL function `get_risk_assessment_advice()` that:
   - Uses SECURITY DEFINER to avoid permission issues
   - Returns all risk assessment advice records
   - Properly handles null values and case sensitivity

### Phase 2: Update Service Layer
1. Modify `RiskAssessmentService.ts` to:
   - Call the new RPC function instead of direct table access
   - Implement proper cache management
   - Add comprehensive logging
   - Fix any matching logic issues

### Phase 3: Update UI Components
1. Modify `Questionnaires.tsx` to:
   - Properly display the fetched advice
   - Handle all possible edge cases (no advice, errors, etc.)
   - Log important debugging information

### Phase 4: Testing
1. Manual testing scenarios:
   - Add new risk advice in admin panel with distinctive text
   - Verify advice appears in doctor questionnaire view
   - Test with various risk levels and scores
   - Verify cache invalidation works as expected

## Additional Considerations

- Consider standardizing all database access through RPC functions for consistency
- Implement a more robust caching strategy with proper invalidation
- Add unit and integration tests for this critical functionality
- Document the solution for future reference