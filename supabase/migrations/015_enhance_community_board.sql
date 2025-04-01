-- Enhance community board tables with categories, pinning, and admin RLS

-- Add category column to posts
-- Using TEXT for flexibility, could use ENUM if categories are strictly defined later.
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN public.community_posts.category IS 'Category for the discussion post.';

-- Add is_pinned column to posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN public.community_posts.is_pinned IS 'Whether the post should be pinned to the top.';

-- Add index for category and pinned status
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON public.community_posts(is_pinned);


-- Update RLS Policies for Admin Control

-- community_posts: Allow admins full access
DROP POLICY IF EXISTS "Allow admin full access to posts" ON public.community_posts;
CREATE POLICY "Allow admin full access to posts"
    ON public.community_posts FOR ALL
    USING (is_admin(auth.uid())) -- Assumes is_admin function exists
    WITH CHECK (is_admin(auth.uid()));

-- community_posts: Keep policy allowing doctors to insert their own posts
-- Policy: "Allow doctors to insert their own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid() AND EXISTS (...check if active doctor...));

-- community_posts: Keep policy allowing authenticated users (doctors checked via app logic/other policies) to read
-- Policy: "Allow authenticated read access to posts" ON public.community_posts FOR SELECT USING (auth.role() = 'authenticated');


-- community_replies: Allow admins full access
DROP POLICY IF EXISTS "Allow admin full access to replies" ON public.community_replies;
CREATE POLICY "Allow admin full access to replies"
    ON public.community_replies FOR ALL
    USING (is_admin(auth.uid())) -- Assumes is_admin function exists
    WITH CHECK (is_admin(auth.uid()));

-- community_replies: Keep policy allowing doctors to insert their own replies
-- Policy: "Allow doctors to insert their own replies" ON public.community_replies FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid() AND EXISTS (...check if active doctor...));

-- community_replies: Keep policy allowing authenticated users to read
-- Policy: "Allow authenticated read access to replies" ON public.community_replies FOR SELECT USING (auth.role() = 'authenticated');