-- Script to drop all existing policies on the profiles table
-- This will help you start fresh with new policies

-- First, list all existing policies
SELECT
  policyname
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- Drop all possible policy names that might exist
-- This is a comprehensive list based on common naming patterns
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

-- Verify that all policies have been dropped
SELECT
  policyname
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- After running this script, you should see no policies listed in the final query result
-- Then you can either:
-- 1. Create new policies using one of the other SQL scripts
-- 2. Disable RLS entirely using the disable-rls-only.sql script