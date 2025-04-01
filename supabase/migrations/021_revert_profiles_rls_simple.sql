-- Revert RLS policies on 'profiles' table to a simpler state.
-- Enable RLS and only allow users to read their own profile via auth.uid().
-- Drop other potentially conflicting read policies added during debugging.

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop potentially conflicting/newer policies first
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles; -- Drop both uid and email versions just in case
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;

-- 3. Create the simple self-read policy using auth.uid()
CREATE POLICY "Allow individual user access to own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Note: RLS on other tables (clinical_resources, dropdown_options, community_*) remains as set by previous migrations.
-- This specifically targets the 'profiles' table RLS.