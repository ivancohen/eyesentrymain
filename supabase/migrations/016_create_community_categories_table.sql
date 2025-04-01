-- Create table for community board categories

CREATE TABLE IF NOT EXISTS public.community_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.community_categories IS 'Stores categories for the community message board.';
COMMENT ON COLUMN public.community_categories.name IS 'The unique name of the category.';

-- Enable RLS
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_categories
-- Allow authenticated users to read all categories (needed for dropdowns)
DROP POLICY IF EXISTS "Allow authenticated read access to categories" ON public.community_categories;
CREATE POLICY "Allow authenticated read access to categories"
    ON public.community_categories FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow admins full access to manage categories
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.community_categories;
CREATE POLICY "Allow admin full access to categories"
    ON public.community_categories FOR ALL
    USING (is_admin(auth.uid())) -- Assumes is_admin function exists
    WITH CHECK (is_admin(auth.uid()));

-- Seed initial categories (optional, can be done via UI later)
-- INSERT INTO public.community_categories (name, description) VALUES
-- ('General', 'General discussions and questions'),
-- ('Diagnostics', 'Discussions related to diagnostic tools and techniques'),
-- ('Equipment', 'Questions and discussions about medical equipment'),
-- ('Treatment', 'Discussions on treatment protocols and patient care'),
-- ('Case Study', 'Sharing and discussing interesting case studies'),
-- ('Research', 'Sharing and discussing relevant research papers'),
-- ('Rules & Announcements', 'Official rules and announcements from admins');

-- Note: We are keeping the 'category' column in 'community_posts' as TEXT for now
-- to avoid complex data migration. The frontend will use names from this new table.