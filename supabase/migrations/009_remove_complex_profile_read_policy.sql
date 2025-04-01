-- Attempt to fix RLS recursion by removing the complex profile read policy.
-- We will rely on the "Allow individual user access to own profile" policy
-- and the SECURITY DEFINER property of the is_admin function.

-- 1. DROP the policy causing potential recursion
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;

-- 2. Ensure the policy allowing users to read their own profile still exists (from migration 004)
--    CREATE POLICY "Allow individual user access to own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
--    (No need to recreate if it wasn't dropped)

-- 3. Ensure the policy allowing authenticated users to read names was dropped (from migration 008)
--    DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
--    (No need to re-drop if it was already dropped)