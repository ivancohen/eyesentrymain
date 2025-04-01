-- Attempt to fix RLS issues by removing the complex profile read policy again.
-- We will rely on the "Allow individual user access to own profile" policy
-- and the simplified policies on other tables.

-- 1. DROP the policy potentially causing issues
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;

-- 2. Ensure the policy allowing users to read their own profile still exists (from migration 014)
--    Policy: "Allow individual user access to own profile" ON public.profiles FOR SELECT USING (is_profile_owner(id));
--    (No SQL needed here, just confirming it wasn't dropped)