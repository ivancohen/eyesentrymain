# Questionnaire & Doctor Approval Fix Guide

This guide provides instructions for fixing two critical issues in the EyeSentry application:

1. **Doctor Approval Status Checking** - 404 error when calling the `check_doctor_approval_status` function
2. **Patient Questionnaire Submission** - Foreign key constraint errors when attempting to submit questionnaires

## Prerequisites

- Access to the Supabase dashboard for the EyeSentry project
- Basic knowledge of SQL and database operations

## Automated Fix Script

We've provided scripts to help diagnose the issues and guide you through the fix process:

- **Windows**: Run `fix-questionnaire-doctor-approval.bat`
- **Mac/Linux**: Run `fix-questionnaire-doctor-approval.sh`

These scripts will:
1. Check if the required database objects exist
2. Test if the issues have been fixed
3. Provide instructions for manual SQL execution if needed

## Manual Fix Instructions

If the automated script doesn't resolve the issues, follow these manual steps:

### Step 1: Fix Doctor Approvals Setup

1. Log in to your Supabase dashboard: https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf
2. Navigate to the SQL Editor
3. Copy and paste the content from `supabase/doctor_approvals_setup.sql`
4. Execute the script
5. Verify the `doctor_approvals` table was created successfully

### Step 2: Create Doctor Approval Check Function

1. In the SQL Editor, copy and paste the content from `supabase/doctor_approval_check_function.sql`
2. Execute the script
3. Verify the `check_doctor_approval_status` function was created successfully

### Step 3: Fix Patient Questionnaires Table

1. In the SQL Editor, copy and paste the content from `supabase/fix_patient_questionnaires_table.sql`
2. Execute the script
3. Verify the `patient_questionnaires` table structure was updated successfully

## Verifying the Fix

After applying the fixes, verify that:

1. **Doctor Approval Status Checking**:
   - Log in as a user with a doctor role request
   - The application should properly display their approval status without 404 errors

2. **Questionnaire Submission**:
   - Fill out and submit the patient questionnaire form
   - It should save successfully without any foreign key constraint errors
   - The submitted data should be accessible in the patient's history

## Troubleshooting

If you encounter issues after applying the fixes:

1. **Check Browser Console**: Look for any error messages in the browser console
2. **Check Supabase Logs**: Review the database logs for any SQL errors
3. **Verify Function Existence**: Ensure the `check_doctor_approval_status` function exists in the database
4. **Check Table Structure**: Verify the `patient_questionnaires` table has the correct columns and constraints

## Restore Point

A restore point has been created at `docs/restore-points/RESTORE_20240326_questionnaire_doctor_approval.md` in case you need to revert the changes.

## Technical Details

### Doctor Approval Check Function

The `check_doctor_approval_status` function:
- Checks if the current user has requested doctor status
- Looks up their approval record in the `doctor_approvals` table
- Returns their approval status as a JSON object
- Creates a pending approval record if none exists

### Patient Questionnaire Table Fix

The fix script:
1. **Removes Problematic Foreign Key Constraints**:
   - Finds and drops any foreign key constraints on `patient_id` and `doctor_id`
   - This prevents the constraint violation errors

2. **Adds Required Columns**:
   - `user_id`: References the authenticated user (foreign key to auth.users)
   - `patient_id`: Stores patient reference (no foreign key constraint)
   - `doctor_id`: Stores doctor reference (no foreign key constraint)

3. **Creates Database Functions**:
   - `insert_patient_questionnaire`: For adding new questionnaires
   - `update_patient_questionnaire`: For modifying existing questionnaires
   - `get_patient_questionnaires_for_user`: For retrieving user's questionnaires