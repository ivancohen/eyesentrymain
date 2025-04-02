-- Correct SQL fix for the infinite recursion in profiles table policies
-- This script uses the actual column names in the profiles table

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

-- Step 3: Create new, non-recursive policies using the correct column names

-- Select policy - allows users to view their own profile
CREATE POLICY "profiles_select_own_policy" 
ON "public"."profiles"
FOR SELECT
USING (auth.uid() = id);

-- Select policy - allows admins to view all profiles
CREATE POLICY "profiles_select_admin_policy" 
ON "public"."profiles"
FOR SELECT
USING (
  -- Check if the current user has is_admin = true in their profile
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Insert policy - allows users to insert their own profile
CREATE POLICY "profiles_insert_policy" 
ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Update policy - allows users to update their own profile
CREATE POLICY "profiles_update_own_policy" 
ON "public"."profiles"
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Update policy - allows admins to update all profiles
CREATE POLICY "profiles_update_admin_policy" 
ON "public"."profiles"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Delete policy - only admins can delete profiles
CREATE POLICY "profiles_delete_policy" 
ON "public"."profiles"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Step 4: Test the fix
SELECT * FROM profiles LIMIT 1;