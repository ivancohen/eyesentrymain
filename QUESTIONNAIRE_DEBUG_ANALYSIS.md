# Questionnaire Form Issue Analysis

## The Problem

Currently, the questions displayed in the admin panel are not appearing in the patient questionnaire. After analyzing the code, I've identified several potential reasons for this inconsistency.

## Detailed Diagnosis

### Data Flow Analysis

1. **Fetching Questions**: 
   - The `QuestionnaireContainer` component uses `getQuestionsWithTooltips()` to fetch all questions from the database
   - This function fetches 36 questions (according to logs), but only 17 appear in the patient questionnaire

2. **Filtering Logic Issue**:
   ```javascript
   // This is the problematic filtering logic
   const dbQuestions = questions
     .filter(dbQ => dbQ.page_category === currentPageCategory)
   ```

3. **Category Mapping**:
   ```javascript
   const currentPageCategory = currentPage === 0 ? 'patient_info' :
                              currentPage === 1 ? 'medical_history' :
                              currentPage === 2 ? 'clinical_measurements' : '';
   ```

### Potential Causes

1. **Page Category Mismatch**: 
   - The values in the database may not match exactly what we expect in the code
   - Expected values: 'patient_info', 'medical_history', 'clinical_measurements'
   - Actual values might be different (capitalization, spaces, different naming)

2. **Case Sensitivity Issues**:
   - JavaScript comparison is case-sensitive
   - If database has 'Patient_Info' but code checks for 'patient_info', they won't match

3. **Whitespace Problems**:
   - Database values might have extra spaces (e.g., ' patient_info ')

## Proposed Solution

1. **More Robust Filtering**:
   - Make the category filtering case-insensitive
   - Trim any whitespace
   - Add fallback logic (e.g., check if the category contains certain keywords)

2. **Enhanced Debugging**:
   - Log all unique page_category values from the database
   - Compare expected vs. actual categories

3. **Implementation Plan**:
   ```javascript
   // More robust filtering logic
   const dbQuestions = questions
     .filter(dbQ => {
       // Normalize the page category for comparison
       const dbCategory = (dbQ.page_category || '').trim().toLowerCase();
       
       // Log all unique categories for debugging
       if (!seenCategories.has(dbCategory)) {
         seenCategories.add(dbCategory);
         console.log('Found category in database:', dbCategory);
       }
       
       // More flexible matching logic
       return dbCategory === currentPageCategory.toLowerCase() || 
             dbCategory.includes(currentPageCategory.toLowerCase()) ||
             currentPageCategory.toLowerCase().includes(dbCategory);
     })
   ```

## Additional Considerations

- We should also improve error handling to catch and log these mismatches
- A migration script could standardize all category values in the database
- Long-term, we should add validation to prevent category name mismatches

## Next Steps

Since this requires code changes to the React components, we need to switch to Code mode to implement the fix.