-- Adjust RLS policy on 'profiles' table again.
-- Revert self-read policy to use auth.uid() directly.
-- Ensure the complex Admin/Doctor read policy is removed.

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to read their own profile (using auth.uid())
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id); -- Revert back to direct ID check

-- 3. Ensure the complex Admin/Doctor read policy is definitely removed
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;

-- 4. Ensure the broad authenticated read policy is also removed
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;

-- Note: Other tables (community_posts, etc.) should still have their simple
-- 'authenticated' read policies active from previous migrations.