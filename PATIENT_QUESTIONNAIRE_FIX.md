# EyeSentry Patient Questionnaire & Doctor Approval Fix

This document provides instructions for fixing two critical issues in the EyeSentry application:

1. **Doctor Approval Status Checking** - 404 error when calling the `check_doctor_approval_status` function
2. **Patient Questionnaire Submission** - Foreign key constraint errors when attempting to submit questionnaires

## Issue Details

### 1. Doctor Approval Status Checking

The application is trying to call a database function that doesn't exist:

```
Failed to load resource: the server responded with a status of 404 ()
Error checking approval status: Object
```

This occurs because the `check_doctor_approval_status` function is referenced in the code but not defined in the database.

### 2. Patient Questionnaire Submission

The questionnaire submission fails with a foreign key constraint error:

```
Error: insert or update on table "patient_questionnaires" violates foreign key constraint "patient_questionnaires_patient_id_fkey"
```

This is caused by a database schema issue where:
- The `patient_questionnaires` table requires a `patient_id` column
- This column has a foreign key constraint to another table
- The function tries to use the current user's ID as the patient ID, but this ID doesn't exist in the referenced table

## Solution

### Step 1: Fix Database Structure Issues

Execute the SQL scripts in your Supabase database in the following order:

1. First, run the doctor approvals setup script (if not already done):
   ```
   eyesentry/supabase/doctor_approvals_setup.sql
   ```

2. Create the doctor approval check function:
   ```
   eyesentry/supabase/doctor_approval_check_function.sql
   ```

3. Fix the patient questionnaires table structure:
   ```
   eyesentry/supabase/fix_patient_questionnaires_table.sql
   ```

### How the Fixes Work

#### Doctor Approval Check Function

The `check_doctor_approval_status` function:
- Checks if the current user has requested doctor status
- Looks up their approval record in the `doctor_approvals` table
- Returns their approval status as a JSON object
- Creates a pending approval record if none exists

#### Patient Questionnaire Table Fix

The fix script:
1. **Removes Problematic Foreign Key Constraints**:
   - Finds and drops any foreign key constraints on `patient_id` and `doctor_id`
   - This prevents the constraint violation errors

2. **Adds Required Columns**:
   - `user_id`: References the authenticated user (foreign key to auth.users)
   - `patient_id`: Stores patient reference (no foreign key constraint)
   - `doctor_id`: Stores doctor reference (no foreign key constraint)

3. **Sets Default Values for Existing Records**:
   - For existing records, uses admin or doctor user IDs
   - Ensures no NULL values remain in required columns

4. **Implements Proper Security**:
   - Updates Row Level Security policies
   - Allows doctors to see their patients' questionnaires
   - Allows patients to see their own questionnaires
   - Allows admins to see all questionnaires

5. **Creates Database Functions**:
   - `insert_patient_questionnaire`: For adding new questionnaires
   - `update_patient_questionnaire`: For modifying existing questionnaires
   - `get_patient_questionnaires_for_user`: For retrieving user's questionnaires

## Executing the Solution

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content from each of the SQL files listed above
4. Execute each script in the order listed
5. Verify the functions exist by checking the "Functions" section in the Supabase dashboard

After applying these fixes, both the doctor approval process and questionnaire submission should work correctly.

## Verifying the Fix

1. Doctor Approval Check:
   - Log in as a user with a doctor role request
   - The application should properly display their approval status

2. Questionnaire Submission:
   - Fill out and submit the patient questionnaire form
   - It should save successfully without any foreign key constraint errors
   - The submitted data should be accessible in the patient's history
