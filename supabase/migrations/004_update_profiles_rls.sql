-- Add RLS policy to allow users to select their own profile data.
-- This is often necessary for functions/policies that need to check user attributes.

-- Ensure RLS is enabled on profiles (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own profile
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Optional: If admins need to read all profiles (e.g., for user management), ensure that policy exists too.
-- The fetchUsers function currently selects '*' directly, relying on such a policy or RLS being off.
-- If RLS *is* enabled and causing issues elsewhere, add an admin read policy:
-- DROP POLICY IF EXISTS "Allow admin users to read all profiles" ON public.profiles;
-- CREATE POLICY "Allow admin users to read all profiles"
--     ON public.profiles FOR SELECT
--     USING (is_admin(auth.uid())); -- Assumes is_admin function exists