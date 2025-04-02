-- Script to drop all existing policies and disable RLS
-- This is the most reliable fix for the infinite recursion issue

-- Step 1: List all existing policies before changes
SELECT
  policyname
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- Step 2: Drop all possible policy names that might exist
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
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "public"."profiles";

-- Step 3: Verify that all policies have been dropped
SELECT
  policyname
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- Step 4: Disable Row Level Security for the profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 5: Test the fix
SELECT * FROM profiles LIMIT 1;

-- IMPORTANT: This is a temporary solution!
-- After confirming that the application works correctly,
-- you should re-enable Row Level Security with properly designed policies.
-- To re-enable RLS, run:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Then create appropriate policies.