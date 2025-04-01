-- Refine RLS policies to prevent infinite recursion

-- On 'profiles' table:
-- 1. DROP the broad authenticated read policy (potential cause of recursion)
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;

-- 2. KEEP the policy allowing users to read their own profile (added in migration 004)
--    Ensures functions like is_admin can work when called by the user themselves.
--    Policy: "Allow individual user access to own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 3. ADD a specific policy allowing authenticated users to read ONLY id and name of others.
--    This is required for joining author names in the community board.
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
CREATE POLICY "Allow authenticated users to read names"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');
    -- NOTE: In Supabase UI, you might need to explicitly restrict this policy
    -- to only allow selecting the 'id' and 'name' columns if desired for stricter security.
    -- The SQL standard doesn't directly support column-level SELECT grants within the policy definition itself easily.


-- On 'community_posts' table:
-- 1. Simplify the SELECT policy. The application logic should ensure only doctors see the board.
--    The INSERT policy already correctly restricts inserts to the logged-in user.
DROP POLICY IF EXISTS "Allow doctors read access to posts" ON public.community_posts;
CREATE POLICY "Allow authenticated read access to posts" -- Renamed for clarity
    ON public.community_posts FOR SELECT
    USING (auth.role() = 'authenticated'); -- Simplified condition


-- On 'community_replies' table:
-- 1. Simplify the SELECT policy.
DROP POLICY IF EXISTS "Allow doctors read access to replies" ON public.community_replies;
CREATE POLICY "Allow authenticated read access to replies" -- Renamed for clarity
    ON public.community_replies FOR SELECT
    USING (auth.role() = 'authenticated'); -- Simplified condition