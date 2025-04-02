-- Drastic SQL fix for the infinite recursion in profiles table policies
-- This script completely disables Row Level Security for the profiles table
-- WARNING: This is a temporary solution and reduces security!

-- Step 1: List all existing policies on the profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- Step 2: Drop all existing policies on the profiles table
-- This ensures we remove any problematic policies
DROP POLICY IF EXISTS "Allow authenticated users to select their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow individual users to update own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_insert_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_update_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_delete_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_select_own_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_select_admin_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_update_own_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_update_admin_policy" ON "public"."profiles";

-- Step 3: Disable Row Level Security for the profiles table
-- This is a drastic measure but will definitely fix the recursion issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Test the fix
SELECT * FROM profiles LIMIT 1;

-- IMPORTANT: This is a temporary solution!
-- After confirming that the application works correctly,
-- you should re-enable Row Level Security with properly designed policies.
-- To re-enable RLS, run:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Then create appropriate policies.