-- Temporarily disable RLS ONLY on the dropdown_options table.
-- This is a workaround for persistent 500 errors.
-- WARNING: This reduces security for this specific table.

ALTER TABLE public.dropdown_options DISABLE ROW LEVEL SECURITY;

-- Ensure RLS is ENABLED on other tables with their last known working simple policies

-- profiles (Self-read/update only)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual user access to own profile" ON public.profiles;
CREATE POLICY "Allow users to read own profile" -- Renamed for consistency
    ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Ensure other read policies on profiles are dropped
DROP POLICY IF EXISTS "Allow Admins or Doctors to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read names" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;


-- community_posts (Auth read/insert)
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read access to posts" ON public.community_posts;
CREATE POLICY "Allow authenticated read access to posts"
    ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to insert their own posts" ON public.community_posts;
CREATE POLICY "Allow authenticated users to insert their own posts"
    ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Ensure admin policy is dropped
DROP POLICY IF EXISTS "Allow admin full access to posts" ON public.community_posts;


-- community_replies (Auth read/insert)
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read access to replies" ON public.community_replies;
CREATE POLICY "Allow authenticated read access to replies"
    ON public.community_replies FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow authenticated users to insert their own replies" ON public.community_replies;
CREATE POLICY "Allow authenticated users to insert their own replies"
    ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Ensure admin policy is dropped
DROP POLICY IF EXISTS "Allow admin full access to replies" ON public.community_replies;


-- clinical_resources (Public read active, Admin ALL) - Re-adding admin policy here as it didn't seem to cause recursion
ALTER TABLE public.clinical_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to active clinical resources" ON public.clinical_resources;
CREATE POLICY "Allow public read access to active clinical resources"
    ON public.clinical_resources FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Allow admin full access to clinical resources" ON public.clinical_resources;
CREATE POLICY "Allow admin full access to clinical resources"
    ON public.clinical_resources FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));


-- community_categories (Auth read, Admin ALL) - Re-adding admin policy
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read access to categories" ON public.community_categories;
CREATE POLICY "Allow authenticated read access to categories"
    ON public.community_categories FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.community_categories;
CREATE POLICY "Allow admin full access to categories"
    ON public.community_categories FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));