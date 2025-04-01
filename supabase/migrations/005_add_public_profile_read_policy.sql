-- Add RLS policy to allow authenticated users to read basic public profile data (id, name)
-- This is needed for joining profile data in other queries (e.g., community posts).

-- Policy: Allow authenticated users to read public profile info
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;
CREATE POLICY "Allow authenticated users to read public profile info"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- IMPORTANT: This policy allows reading ALL columns by default for authenticated users.
-- If you have sensitive columns in 'profiles' that should NOT be readable by everyone,
-- you need to either:
-- 1. Modify this policy to explicitly list allowed columns:
--    CREATE POLICY "Allow authenticated users to read public profile info"
--        ON public.profiles FOR SELECT
--        USING (auth.role() = 'authenticated')
--        -- Add WITH CHECK clause if needed, specifying columns allowed, e.g.:
--        -- WITH CHECK (true); -- Placeholder, needs specific column checks if sensitive data exists
--
-- 2. Or, ensure sensitive data is protected by other means (e.g., separate table, column-level security if available/needed).
-- For now, this broad read access for authenticated users is often necessary for joins.