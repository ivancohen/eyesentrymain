-- Modify the RLS policy allowing users to read their own profile.
-- Instead of comparing auth.uid() directly to id, compare auth.email() to the email column.
-- This might be more reliable during the login transaction.

-- Policy: Allow users to read their own profile (using email)
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to own profile"
    ON public.profiles FOR SELECT
    USING (auth.email() = email); -- Changed from auth.uid() = id

-- Keep other policies on 'profiles' as they are (e.g., the one added in migration 008 if it exists and is needed)
-- DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
-- CREATE POLICY "Allow Admins or Doctors to read profiles" ...