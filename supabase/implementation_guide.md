# Implementation Guide for Row-Level Security Solution

This guide provides a step-by-step process to implement the Row-Level Security (RLS) solution for fixing the "permission denied to set role 'admin'" error.

## Step 1: Implement RLS Policies

1. Log in to your Supabase dashboard at [app.supabase.com](https://app.supabase.com)
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `supabase/rls_policies.sql`
5. Run the script

This will:
- Create the `is_admin()` function that will be used by RLS policies
- Enable Row Level Security on all relevant tables
- Set up policies that control who can access which data

## Step 2: Set Up Admin User

Run the admin user setup script to ensure your account has the necessary permissions:

1. In the Supabase SQL Editor, create a new query
2. Copy and paste the contents of `supabase/set_admin_user.sql`
3. Run the script

This will:
- Find user `ivan.s.cohen@gmail.com` in the authentication system
- Ensure the user has a profile with `is_admin = true`
- Set the app metadata to include `"role": "admin"`

## Step 3: Diagnose Any Remaining Issues (if needed)

If you still experience issues, run the diagnostic script:

1. In the Supabase SQL Editor, create a new query
2. Copy and paste the contents of `supabase/check_admin_status.sql`
3. Run the script
4. Review the output for any recommendations

## Step 4: Update Your Frontend Code

The frontend code has already been updated to work with the new RLS policies. The changes to `src/services/AdminService.ts`:
- Remove any code that tries to set PostgreSQL roles
- Use direct table queries with the RLS policies
- Add better error handling for permission-related errors

## Step 5: Test the Application

1. **Important**: Log out and log back in to refresh your JWT token
   - This ensures your token contains the updated claims and metadata

2. Navigate to the Data Management page
   - The page should now load without the permission error

## Troubleshooting

If you still encounter issues:

1. **Check Browser Console**
   - Open browser dev tools (F12)
   - Look for specific error messages in the Console tab

2. **Verify JWT Token**
   - Look for the JWT token in browser localStorage
   - Use [jwt.io](https://jwt.io) to decode it
   - Verify it contains `{"role": "admin"}` in the app_metadata

3. **Consider Creating a New Admin User**
   - Follow Method 2 in the `supabase/admin_setup_guide.md` document

## Technical Summary

This solution fixes the permission issue by:

1. Using RLS policies instead of PostgreSQL role switching
2. Determining admin status through the `is_admin()` function
3. Securing all database tables with proper RLS policies
4. Updating the frontend code to work with this security model

This approach is more secure, maintainable, and eliminates the need for PostgreSQL role switching that was causing the error.
