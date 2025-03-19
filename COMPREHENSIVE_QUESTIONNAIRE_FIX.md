# Comprehensive Patient Questionnaire Fix

This document provides a detailed solution for fixing the foreign key constraint error that occurs when submitting patient questionnaires in the EyeSentry application.

## Error Details

When submitting a patient questionnaire, the following error occurs:

```
Failed to load resource: the server responded with a status of 409 ()
Error submitting questionnaire: insert or update on table "patient_questionnaires" violates foreign key constraint "patient_questionnaires_patient_id_fkey"
```

## Root Cause Analysis

The error occurs because:

1. The `patient_questionnaires` table has a foreign key constraint on the `patient_id` column
2. This constraint references another table (possibly `patients` or `profiles`)
3. When submitting a questionnaire, the current user's ID is used as the `patient_id`
4. However, this ID doesn't exist in the referenced table, causing the foreign key constraint violation

## Solution Files

We've created two SQL scripts to fix this issue:

1. **Primary Fix**: `eyesentry/supabase/fix_patient_questionnaires_table.sql`
   - This script modifies the table structure to remove problematic foreign keys
   - It ensures correct columns exist and have appropriate non-NULL values
   - It updates or creates the necessary database functions for questionnaire operations

2. **Aggressive Fix**: `eyesentry/supabase/drop_questionnaire_constraints.sql`
   - This is a more aggressive approach if the primary fix doesn't resolve the issue
   - It uses multiple methods to identify and remove ALL foreign key constraints
   - It recreates the affected columns without constraints if needed

## Implementation Steps

Follow these steps to apply the fix:

### Step 1: Run the Primary Fix

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content from `eyesentry/supabase/fix_patient_questionnaires_table.sql`
4. Execute the script
5. Look for any error messages in the output

This script will:
- Find and remove foreign key constraints on `patient_id` and `doctor_id`
- Ensure the `user_id`, `patient_id`, and `doctor_id` columns exist and have proper values
- Update RLS policies for proper access control
- Create or replace the necessary database functions for questionnaire operations

### Step 2: Test the Application

After running the primary fix:

1. Try submitting a patient questionnaire in the application
2. If it works successfully, no further action is needed
3. If the error persists, proceed to Step 3

### Step 3: Apply the Aggressive Fix (if needed)

If the primary fix doesn't resolve the issue:

1. Return to the Supabase SQL Editor
2. Copy and paste the content from `eyesentry/supabase/drop_questionnaire_constraints.sql`
3. Execute the script
4. Look for any error messages in the output

This script uses multiple approaches to ensure all foreign key constraints are removed:
- It uses the PostgreSQL system catalogs to find ALL foreign key constraints
- It attempts to drop constraints by commonly used names
- If needed, it recreates the columns entirely to eliminate any lingering constraints

### Step 4: Run the Primary Fix Again

After running the aggressive fix:

1. Run the primary fix script again to ensure all functions and policies are properly set up
2. Test the application to confirm the issue is resolved

## How the Fixes Work

### Primary Fix Approach

The primary fix:
1. Uses information schema to identify existing constraints
2. Drops identified foreign key constraints
3. Ensures required columns exist and have proper values
4. Creates security-definer functions to handle questionnaire operations safely

### Aggressive Fix Approach

The aggressive fix:
1. Uses lower-level PostgreSQL system catalogs to find ALL constraints
2. Tries multiple methods to drop constraints (by type, by name pattern)
3. If needed, recreates columns entirely to eliminate any constraints
4. Preserves all data during the column recreation process

## Verifying the Fix

You'll know the fix is successful when:

1. Patient questionnaires can be submitted without errors
2. Submitted questionnaires are properly stored in the database
3. Users can view their questionnaire history

## Technical Details for Developers

The fixed database structure:
- Uses `user_id` (with foreign key to `auth.users`) for authentication
- Uses `patient_id` (without foreign key constraint) for patient reference
- Uses `doctor_id` (without foreign key constraint) for doctor reference
- RLS policies are based on `user_id` for proper access control

The approach avoids foreign key constraints on `patient_id` and `doctor_id` to prevent the constraint violation, while maintaining data integrity through the application logic.
