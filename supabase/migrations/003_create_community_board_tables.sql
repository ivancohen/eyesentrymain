-- Migration script to create tables for the community message board

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL -- For potential future edits
);

COMMENT ON TABLE public.community_posts IS 'Stores main posts for the doctor community message board.';
COMMENT ON COLUMN public.community_posts.user_id IS 'The ID of the doctor who created the post.';

-- Create community_replies table
CREATE TABLE IF NOT EXISTS public.community_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.community_replies IS 'Stores replies to posts on the community message board.';
COMMENT ON COLUMN public.community_replies.post_id IS 'The ID of the post this reply belongs to.';
COMMENT ON COLUMN public.community_replies.user_id IS 'The ID of the doctor who wrote the reply.';

-- Enable RLS for both tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
-- Allow authenticated doctors to read all posts
DROP POLICY IF EXISTS "Allow doctors read access to posts" ON public.community_posts;
CREATE POLICY "Allow doctors read access to posts"
    ON public.community_posts FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = false AND is_approved = true AND is_suspended = false) -- Check if user is an active, approved doctor
    );

-- Allow authenticated doctors to insert their own posts
DROP POLICY IF EXISTS "Allow doctors to insert their own posts" ON public.community_posts;
CREATE POLICY "Allow doctors to insert their own posts"
    ON public.community_posts FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = false AND is_approved = true AND is_suspended = false) -- Check if user is an active, approved doctor
    );

-- Allow users to update their own posts (optional, add if needed)
-- DROP POLICY IF EXISTS "Allow users to update their own posts" ON public.community_posts;
-- CREATE POLICY "Allow users to update their own posts"
--     ON public.community_posts FOR UPDATE
--     USING (auth.uid() = user_id);

-- Allow users to delete their own posts (optional, add if needed)
-- DROP POLICY IF EXISTS "Allow users to delete their own posts" ON public.community_posts;
-- CREATE POLICY "Allow users to delete their own posts"
--     ON public.community_posts FOR DELETE
--     USING (auth.uid() = user_id);


-- RLS Policies for community_replies
-- Allow authenticated doctors to read all replies
DROP POLICY IF EXISTS "Allow doctors read access to replies" ON public.community_replies;
CREATE POLICY "Allow doctors read access to replies"
    ON public.community_replies FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = false AND is_approved = true AND is_suspended = false) -- Check if user is an active, approved doctor
    );

-- Allow authenticated doctors to insert their own replies
DROP POLICY IF EXISTS "Allow doctors to insert their own replies" ON public.community_replies;
CREATE POLICY "Allow doctors to insert their own replies"
    ON public.community_replies FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = false AND is_approved = true AND is_suspended = false) -- Check if user is an active, approved doctor
    );

-- Allow users to update their own replies (optional)
-- DROP POLICY IF EXISTS "Allow users to update their own replies" ON public.community_replies;
-- CREATE POLICY "Allow users to update their own replies"
--     ON public.community_replies FOR UPDATE
--     USING (auth.uid() = user_id);

-- Allow users to delete their own replies (optional)
-- DROP POLICY IF EXISTS "Allow users to delete their own replies" ON public.community_replies;
-- CREATE POLICY "Allow users to delete their own replies"
--     ON public.community_replies FOR DELETE
--     USING (auth.uid() = user_id);

-- Trigger for community_posts updated_at
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Reuse existing function