-- Re-enable RLS on profiles and use the is_profile_owner function for self-read policy.
-- Also re-add the policy allowing Admins/Doctors to read profiles.

-- 1. Re-enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to read their own profile (using helper function)
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to own profile"
    ON public.profiles FOR SELECT
    USING (is_profile_owner(id)); -- Use the new function

-- 3. Re-add policy allowing Admins OR Approved Doctors to read profiles (needed for Community Board joins etc.)
--    This policy was likely dropped during debugging or by the previous migration.
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
CREATE POLICY "Allow Admins or Doctors to read profiles"
    ON public.profiles FOR SELECT
    USING (
        -- Condition 1: User is an admin
        is_admin(auth.uid()) -- Assumes is_admin function exists and works
        OR
        -- Condition 2: User is an approved, non-suspended doctor
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.is_admin = false
              AND p.is_approved = true
              AND p.is_suspended = false
        )
    );