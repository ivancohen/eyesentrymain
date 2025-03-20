-- Direct SQL to make brownh@eyesentrymed.com an admin
-- This bypasses the function call and directly updates both tables

-- Step 1: Update the profiles table
UPDATE profiles 
SET is_admin = true 
WHERE email = 'brownh@eyesentrymed.com';

-- Step 2: Update auth.users table metadata (will only work if run by superuser)
UPDATE auth.users 
SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    '{"role": "admin"}'::jsonb
WHERE email = 'brownh@eyesentrymed.com';

-- Step 3: Verification query to check if update worked
SELECT 
  p.email,
  p.is_admin AS profile_is_admin,
  (u.raw_app_meta_data->>'role') AS auth_role
FROM 
  profiles p
JOIN 
  auth.users u ON p.id = u.id
WHERE 
  p.email = 'brownh@eyesentrymed.com';
