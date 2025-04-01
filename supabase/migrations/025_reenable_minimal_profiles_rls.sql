-- Re-enable RLS on profiles with minimal self-access policies.
-- This is the most basic secure configuration.

-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting older policies
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;

-- 3. Policy: Allow users to read their own profile
CREATE POLICY "Allow users to read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- 4. Policy: Allow users to update their own profile
DROP POLICY IF EXISTS "Allow individual user to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Note: No policies are added here to allow reading *other* users' profiles.
-- Features requiring this (like Community Board author names) will need adjustments
-- or separate, secure mechanisms (e.g., database functions) if this basic RLS setup works.