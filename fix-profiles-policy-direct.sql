-- Direct SQL fix for the infinite recursion in profiles table policies
-- Run this in the Supabase SQL Editor

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

-- Step 3: Create new, non-recursive policies

-- Select policy - allows users to view their own profile and admins to view all profiles
CREATE POLICY "profiles_select_policy" 
ON "public"."profiles"
FOR SELECT
USING (
  -- Simple condition that doesn't cause recursion
  auth.uid() = id OR
  -- For admins to see all profiles - using a simple role check
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Insert policy - allows users to insert their own profile
CREATE POLICY "profiles_insert_policy" 
ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Update policy - allows users to update their own profile and admins to update all profiles
CREATE POLICY "profiles_update_policy" 
ON "public"."profiles"
FOR UPDATE
USING (
  auth.uid() = id OR
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  auth.uid() = id OR
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Delete policy - only admins can delete profiles
CREATE POLICY "profiles_delete_policy" 
ON "public"."profiles"
FOR DELETE
USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Step 4: Test the fix
SELECT * FROM profiles LIMIT 1;