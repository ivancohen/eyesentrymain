-- Re-apply simple authenticated read policies to tables causing 500 errors.

-- On 'dropdown_options' table:
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
-- Drop policy just in case it exists in a problematic state
DROP POLICY IF EXISTS "Allow authenticated users read access to dropdown options" ON public.dropdown_options;
-- Recreate the simple policy
CREATE POLICY "Allow authenticated users read access to dropdown options"
    ON public.dropdown_options FOR SELECT
    USING (auth.role() = 'authenticated');


-- On 'community_posts' table:
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
-- Drop policy just in case it exists in a problematic state
DROP POLICY IF EXISTS "Allow authenticated read access to posts" ON public.community_posts;
-- Recreate the simple policy
CREATE POLICY "Allow authenticated read access to posts"
    ON public.community_posts FOR SELECT
    USING (auth.role() = 'authenticated');

-- Note: Ensure RLS on 'profiles' is still enabled with only the self-read/update policies from migration 021.
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow users to read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);