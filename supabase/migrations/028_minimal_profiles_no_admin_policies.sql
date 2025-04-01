-- Final attempt to resolve RLS recursion during login/profile fetch.
-- Enable minimal self-read/update RLS on profiles.
-- Disable all admin-specific policies on other tables that use is_admin().

-- On 'profiles' table:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Drop potentially conflicting policies first
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
-- Add ONLY the self-read policy
CREATE POLICY "Allow users to read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
-- Add basic self-update policy
CREATE POLICY "Allow users to update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- On 'community_posts' table:
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to posts" ON public.community_posts;
-- Ensure simple read/insert policies exist
DROP POLICY IF EXISTS "Allow authenticated read access to posts" ON public.community_posts;
CREATE POLICY "Allow authenticated read access to posts"
    ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to insert their own posts" ON public.community_posts;
CREATE POLICY "Allow authenticated users to insert their own posts"
    ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);


-- On 'community_replies' table:
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to replies" ON public.community_replies;
-- Ensure simple read/insert policies exist
DROP POLICY IF EXISTS "Allow authenticated read access to replies" ON public.community_replies;
CREATE POLICY "Allow authenticated read access to replies"
    ON public.community_replies FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to insert their own replies" ON public.community_replies;
CREATE POLICY "Allow authenticated users to insert their own replies"
    ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);


-- On 'clinical_resources' table:
ALTER TABLE public.clinical_resources ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to clinical resources" ON public.clinical_resources;
-- Ensure simple read policy exists
DROP POLICY IF EXISTS "Allow public read access to active clinical resources" ON public.clinical_resources;
CREATE POLICY "Allow public read access to active clinical resources"
    ON public.clinical_resources FOR SELECT USING (is_active = TRUE);


-- On 'dropdown_options' table:
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
-- Ensure simple read policy exists
DROP POLICY IF EXISTS "Allow authenticated users read access to dropdown options" ON public.dropdown_options;
CREATE POLICY "Allow authenticated users read access to dropdown options"
    ON public.dropdown_options FOR SELECT USING (auth.role() = 'authenticated');


-- On 'community_categories' table:
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
-- Drop admin policy
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.community_categories;
-- Ensure simple read policy exists
DROP POLICY IF EXISTS "Allow authenticated read access to categories" ON public.community_categories;
CREATE POLICY "Allow authenticated read access to categories"
    ON public.community_categories FOR SELECT USING (auth.role() = 'authenticated');