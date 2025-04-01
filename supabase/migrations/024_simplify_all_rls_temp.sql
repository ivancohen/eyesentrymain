-- Simplify RLS policies on all relevant tables to basic authenticated access
-- or self-access, removing all dependencies on the is_admin() function
-- within policies as a debugging step for the recursion error.
-- WARNING: This reduces security temporarily, especially for admin actions.

-- On 'profiles' table:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Drop all existing policies first to ensure a clean state
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;
-- Add ONLY the self-read policy
CREATE POLICY "Allow individual user access to own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
-- Add basic self-update policy (might be needed by profile page)
DROP POLICY IF EXISTS "Allow individual user to update own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- On 'community_posts' table:
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to posts" ON public.community_posts;
-- Keep/Set simple read policy
DROP POLICY IF EXISTS "Allow authenticated read access to posts" ON public.community_posts;
CREATE POLICY "Allow authenticated read access to posts"
    ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');
-- Keep/Set simple insert policy
DROP POLICY IF EXISTS "Allow doctors to insert their own posts" ON public.community_posts;
CREATE POLICY "Allow authenticated users to insert their own posts" -- Renamed slightly
    ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);


-- On 'community_replies' table:
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to replies" ON public.community_replies;
-- Keep/Set simple read policy
DROP POLICY IF EXISTS "Allow authenticated read access to replies" ON public.community_replies;
CREATE POLICY "Allow authenticated read access to replies"
    ON public.community_replies FOR SELECT USING (auth.role() = 'authenticated');
-- Keep/Set simple insert policy
DROP POLICY IF EXISTS "Allow doctors to insert their own replies" ON public.community_replies;
CREATE POLICY "Allow authenticated users to insert their own replies" -- Renamed slightly
    ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);


-- On 'clinical_resources' table:
ALTER TABLE public.clinical_resources ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to clinical resources" ON public.clinical_resources;
-- Keep/Set simple read policy
DROP POLICY IF EXISTS "Allow public read access to active clinical resources" ON public.clinical_resources;
CREATE POLICY "Allow public read access to active clinical resources"
    ON public.clinical_resources FOR SELECT USING (is_active = TRUE);


-- On 'dropdown_options' table:
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
-- Keep/Set simple read policy
DROP POLICY IF EXISTS "Allow authenticated users read access to dropdown options" ON public.dropdown_options;
CREATE POLICY "Allow authenticated users read access to dropdown options"
    ON public.dropdown_options FOR SELECT USING (auth.role() = 'authenticated');


-- On 'community_categories' table:
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.community_categories;
-- Keep/Set simple read policy
DROP POLICY IF EXISTS "Allow authenticated read access to categories" ON public.community_categories;
CREATE POLICY "Allow authenticated read access to categories"
    ON public.community_categories FOR SELECT USING (auth.role() = 'authenticated');