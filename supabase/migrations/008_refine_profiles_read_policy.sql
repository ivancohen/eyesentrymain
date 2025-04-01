-- Refine RLS policies on 'profiles' table again to prevent recursion

-- 1. DROP the previous broad authenticated read policy (from migration 007)
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;

-- 2. KEEP the policy allowing users to read their own profile (from migration 004)
--    Ensures functions like is_admin can work when called by the user themselves.
--    Policy: "Allow individual user access to own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 3. ADD a policy allowing Admins OR Approved Doctors to read profiles.
--    Admins need it for management, Doctors need it for community board names.
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
CREATE POLICY "Allow Admins or Doctors to read profiles"
    ON public.profiles FOR SELECT
    USING (
        -- Condition 1: User is an admin
        is_admin(auth.uid())
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

-- Note: This still allows reading ALL columns for Admins/Doctors.
-- Consider column-level security in Supabase UI if needed later.