-- Simplest SQL fix for the infinite recursion in profiles table policies
-- Run this in the Supabase SQL Editor if the other scripts don't work

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

-- Step 3: Create the simplest possible policies

-- Allow all authenticated users to select all profiles
-- This is the simplest approach but less secure
CREATE POLICY "profiles_select_all_policy" 
ON "public"."profiles"
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_policy" 
ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy" 
ON "public"."profiles"
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No delete policy - this will effectively prevent deletion

-- Step 4: Test the fix
SELECT * FROM profiles LIMIT 1;

-- Note: This approach allows all authenticated users to view all profiles,
-- which may not be ideal for security but will definitely fix the recursion issue.
-- Once the application is working, you can implement more restrictive policies.