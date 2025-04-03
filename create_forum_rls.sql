-- SQL script to create RLS policies for the forum feature

-- Helper function to check if a user is an admin
-- (Assumes a function check_is_admin() exists or uses profile metadata)
-- CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
-- RETURNS boolean AS $$
-- DECLARE
--   is_admin_flag boolean;
-- BEGIN
--   SELECT is_admin INTO is_admin_flag FROM public.profiles WHERE id = user_id;
--   RETURN is_admin_flag;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- Note: Ensure this function exists and works correctly, or adjust policy logic.

-- 1. RLS Policies for forum_categories
-- Admins can do everything
CREATE POLICY "Allow admins full access on categories"
ON public.forum_categories FOR ALL
USING (check_is_admin()) -- Removed auth.uid() argument
WITH CHECK (check_is_admin()); -- Removed auth.uid() argument

-- Authenticated users (doctors) can read categories
CREATE POLICY "Allow authenticated users read access on categories"
ON public.forum_categories FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. RLS Policies for forum_posts
-- Admins can do everything
CREATE POLICY "Allow admins full access on posts"
ON public.forum_posts FOR ALL
USING (check_is_admin()) -- Removed auth.uid() argument
WITH CHECK (check_is_admin()); -- Removed auth.uid() argument

-- Authenticated users (doctors) can view non-deleted posts
CREATE POLICY "Allow authenticated users read access on non-deleted posts"
ON public.forum_posts FOR SELECT
USING (auth.role() = 'authenticated' AND is_deleted = false);

-- Authenticated users (doctors) can create posts
CREATE POLICY "Allow authenticated users to create posts"
ON public.forum_posts FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

-- Authors can view their own posts even if deleted? (Optional - uncomment if needed)
-- CREATE POLICY "Allow authors to view their own posts"
-- ON public.forum_posts FOR SELECT
-- USING (author_id = auth.uid());

-- 3. RLS Policies for forum_replies
-- Admins can do everything
CREATE POLICY "Allow admins full access on replies"
ON public.forum_replies FOR ALL
USING (check_is_admin()) -- Removed auth.uid() argument
WITH CHECK (check_is_admin()); -- Removed auth.uid() argument

-- Authenticated users (doctors) can view non-deleted replies
CREATE POLICY "Allow authenticated users read access on non-deleted replies"
ON public.forum_replies FOR SELECT
USING (auth.role() = 'authenticated' AND is_deleted = false);

-- Authenticated users (doctors) can create replies
CREATE POLICY "Allow authenticated users to create replies"
ON public.forum_replies FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

-- Authors can view their own replies even if deleted? (Optional - uncomment if needed)
-- CREATE POLICY "Allow authors to view their own replies"
-- ON public.forum_replies FOR SELECT
-- USING (author_id = auth.uid());

-- Ensure RLS is enabled on all tables (already done in create_forum_tables.sql, but good practice to confirm)
-- ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;