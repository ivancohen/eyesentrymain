# Admin User Setup Guide

This guide provides two methods to ensure your admin users have proper privileges for accessing the data management page.

## Method 1: Set Up Admin User through Supabase Dashboard

1. **Log in to your Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Access Authentication > Users**
   - Look for the user with email `ivan.s.cohen@gmail.com`
   - Click on the user to view details

3. **Edit User Metadata**
   - In the user details view, find the "Metadata" section
   - Click "Edit" next to "app_metadata"
   - Ensure the metadata contains: `{"role": "admin"}`
   - Save changes

4. **Set the Profile is_admin Flag via SQL Editor**
   - Go to SQL Editor in the Supabase Dashboard
   - Create a new query
   - Run this SQL command:
   
   ```sql
   UPDATE profiles 
   SET is_admin = true 
   WHERE email = 'ivan.s.cohen@gmail.com';
   ```

5. **Verify Admin Status**
   - Sign out of your application
   - Sign back in with the `ivan.s.cohen@gmail.com` account
   - Try accessing the Data Management page

## Method 2: Create a New Admin User

If you prefer to create a new admin user instead:

1. **Create a New User in Supabase Dashboard**
   - Go to Authentication > Users
   - Click "Create User"
   - Fill in email and password for the new admin
   - Create the user

2. **Set App Metadata for Admin Role**
   - Find the newly created user
   - Edit the app_metadata to: `{"role": "admin"}`
   - Save changes

3. **Create a Profile for the New User via SQL Editor**
   - Go to SQL Editor
   - Create a new query
   - Find the user's UUID from the users list
   - Run this SQL (replace USER_UUID with the actual UUID):
   
   ```sql
   INSERT INTO profiles (id, email, name, is_admin, created_at)
   VALUES (
       'USER_UUID',
       'new_admin@example.com',
       'New Admin User',
       true,
       NOW()
   );
   ```

4. **Login with New Admin Account**
   - Sign in to your application using the new admin credentials
   - Verify you can access the Data Management page

## Troubleshooting

If you still experience permission issues:

1. **Verify RLS Policies are Applied**
   - Make sure you've run the RLS policies SQL script from `supabase/rls_policies.sql`

2. **Check Console Errors**
   - Use browser devtools to inspect network requests and error messages
   - Look for permission-related errors in API responses

3. **Verify User Sessions**
   - Try logging out and logging back in to refresh the session token
   - This ensures your JWT contains updated claims and metadata

4. **Inspect JWT Token**
   - You can use browser devtools to view the JWT token content
   - Check if it contains the expected admin role information
