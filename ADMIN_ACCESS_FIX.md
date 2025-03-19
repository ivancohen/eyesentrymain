# EyeSentry Admin Access Fix

This document provides instructions for fixing admin access for `ivan.s.cohen@gmail.com` in the EyeSentry application.

## Background

The EyeSentry application uses three methods to determine admin status in `AuthContext.tsx`:

1. **App Metadata**: Checks if the user's role is 'admin' in app_metadata
2. **Admin Email List**: Checks if the user's email is in the hardcoded admin list 
3. **Database Flag**: Checks if the is_admin flag is true in the profiles table

For complete admin access, all three methods should be configured correctly.

## Current Status

- ✅ **Admin Email List**: `ivan.s.cohen@gmail.com` is already in the hardcoded list in `AuthContext.tsx`
- ✅ **Database Flag**: We've verified and updated the `is_admin` flag in the profiles table
- ⚠️ **App Metadata**: May need to be updated in the `auth.users` table

## Fix Tools Provided

We've created several tools to fix the admin access issue:

### 1. Node.js Script (`src/utils/fix-admin-access.js`)

This script updates the `is_admin` flag in the profiles table but can't modify the app_metadata directly as it requires elevated permissions.

```bash
# Run from the project root
node src/utils/fix-admin-access.js
```

### 2. Windows Batch File (`fix-admin.bat`)

For Windows users, run this batch file to:
- Update the profiles table
- Provide instructions for updating app_metadata
- Open the HTML tool for further guidance

```bash
# Double-click or run from command prompt
fix-admin.bat
```

### 3. Shell Script (`fix-admin.sh`)

For Linux/Mac users, run this shell script to:
- Update the profiles table
- Provide instructions for updating app_metadata

```bash
# First make it executable
chmod +x fix-admin.sh
# Then run it
./fix-admin.sh
```

### 4. HTML Tool (`fix-admin-role.html`)

An interactive web page that:
- Checks the current status of admin flags
- Provides step-by-step instructions for fixing the issues
- Opens automatically from the batch file

## Steps to Fix Admin Access

### Step 1: Run the Automated Fix

Run one of the provided scripts based on your operating system:
- Windows: `fix-admin.bat`
- Mac/Linux: `./fix-admin.sh`

This will:
- Update the `is_admin` flag in the profiles table
- Display instructions for the next steps

### Step 2: Update App Metadata

To update the app_metadata, you need to run the following SQL in the Supabase dashboard SQL editor:

```sql
UPDATE auth.users 
SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    '{"role": "admin"}'::jsonb
WHERE email = 'ivan.s.cohen@gmail.com';
```

Alternatively:
1. Login to the [Supabase Dashboard](https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf)
2. Navigate to Authentication → Users
3. Find `ivan.s.cohen@gmail.com`
4. Manually set the role to "admin" in the metadata

### Step 3: Verification

After updating the app metadata:
1. Log out of the application
2. Log back in with `ivan.s.cohen@gmail.com`
3. You should now have full admin access

## Troubleshooting

If you still encounter issues:

1. Open the browser console (F12) to check for error messages
2. Look for these log messages:
   - "Admin by role: [true/false]" - Indicates if role=='admin' in app_metadata
   - "Admin by email match: [true/false]" - Indicates if email is in hardcoded list
   - "Admin by profile flag: [true/false]" - Indicates is_admin in database
   - "Final admin status: [true/false]" - The final determination

3. If issues persist, try the emergency quickfix:
   ```sql
   -- Run this in the Supabase SQL editor
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_app_meta_data)
   VALUES (
     'emergency-admin@eyesentry.app',
     -- hash for 'AdminAccess2025!'
     '$2a$10$QHVfiK.4SeBDvEN9L6Y7q.IqKefH3Y1GzgQtR.rMlWWNgJqrGz9Oa',
     NOW(),
     '{"role": "admin"}'
   );
   ```
   Then create a matching profile entry and use this emergency account.
