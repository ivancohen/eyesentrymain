-- Script to list all existing policies on the profiles table
-- This will help you understand what policies already exist

-- List all policies on the profiles table
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

-- This will show you all the existing policies, their names, and their conditions
-- You can use this information to:
-- 1. Identify which policies are causing the infinite recursion
-- 2. Decide which policies to drop before creating new ones
-- 3. Understand the current security model for the profiles table