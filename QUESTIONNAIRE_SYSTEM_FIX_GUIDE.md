# Questionnaire System Fix Guide

This guide explains how to apply the comprehensive fix for the questionnaire system that addresses multiple issues:

1. Patient names not being saved after questionnaire submission
2. Risk assessment scores not being calculated correctly
3. Editing of patient questionnaires not functioning as intended

## Root Cause Analysis

After thorough investigation, we identified several issues in the codebase:

1. **Inconsistent Parameter Naming**: 
   - Frontend code called RPC functions with unprefixed parameters
   - Some SQL functions expected prefixed parameters (e.g., `p_first_name`)
   - This mismatch caused data loss during transfer

2. **Metadata vs Direct Fields**:
   - Patient names were inconsistently stored in both direct fields and metadata
   - There was no synchronization between these two storage locations

3. **Table Name Inconsistency**:
   - Code referenced both `dropdown_options` and `question_options` tables
   - Creating confusion about where options data should be stored/retrieved

4. **Missing Risk Score Data**:
   - Risk scores were calculated but not properly stored
   - The answers containing score data were not consistently passed to the database

## Fix Implementation

The fix addresses these issues through several coordinated changes:

### 1. Database Changes (SQL)

- Created consistent RPC functions without prefixed parameters
- Added synchronization between metadata and direct name fields
- Created views to handle table name inconsistencies
- Added proper answers storage in both metadata and a dedicated column
- Implemented triggers to ensure data consistency

### 2. Frontend Code Changes

- Updated `PatientQuestionnaireService.ts` to:
  - Include answers in metadata
  - Use consistent parameter names
  - Handle both table name possibilities (dropdown_options/question_options)
  - Properly pass metadata during updates

### 3. Data Healing

- Added SQL to fix existing records with:
  - Missing patient names (populated from metadata)
  - Missing risk scores (populated from answers data)

## How to Apply the Fix

1. **Run the Fix Script**:
   - Windows: Execute `fix-questionnaire-all-issues.bat`
   - Unix/Mac: Execute `./fix-questionnaire-all-issues.sh` (make it executable first with `chmod +x fix-questionnaire-all-issues.sh`)

   This will:
   - Apply all SQL fixes to the database
   - Test each function to ensure it works correctly
   - Report any issues encountered

2. **Check the Modified Files**:
   - `src/services/PatientQuestionnaireService.ts`: Updated to handle all issues
   - `supabase/fix_questionnaire_comprehensive.sql`: Contains all database fixes

3. **Testing**:
   The script performs basic tests, but you should manually verify:
   - Patient names are saved correctly when submitting a questionnaire
   - Risk assessment scores are calculated and displayed properly
   - You can edit existing questionnaires without losing data

## Restoration Point

If needed, you can revert to the previous state using the restore point:

```sql
SELECT restore_questionnaire_system();
```

## Additional Information

- The fix maintains backward compatibility with existing data
- No data loss should occur during the migration
- The approach ensures both field locations (direct and metadata) are populated
- Future submissions will maintain consistency between both storage locations

## Troubleshooting

If you encounter issues after applying the fix:

1. Check the console logs for error messages
2. Verify that the database tables have the expected structure:
   ```sql
   SELECT * FROM information_schema.columns WHERE table_name = 'patient_questionnaires';
   ```
3. Confirm RPC functions exist:
   ```sql
   SELECT * FROM pg_proc WHERE proname LIKE '%patient_questionnaire%';
   ```
4. If needed, can revert using the restore point command mentioned above

For persistent issues, run the diagnostic function:
```sql
SELECT * FROM diagnose_patient_questionnaire_system();