-- SQL script to create tables for the forum feature

-- 1. Forum Categories Table
CREATE TABLE public.forum_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    rules text, -- Rules specific to this category
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES public.profiles(id) -- Admin who created it
);

-- Add comments for forum_categories table and columns
COMMENT ON TABLE public.forum_categories IS 'Stores categories for the forum.';
COMMENT ON COLUMN public.forum_categories.name IS 'The display name of the category.';
COMMENT ON COLUMN public.forum_categories.description IS 'A brief description of the category.';
COMMENT ON COLUMN public.forum_categories.rules IS 'Specific rules for posting within this category.';
COMMENT ON COLUMN public.forum_categories.display_order IS 'Order in which categories are displayed.';
COMMENT ON COLUMN public.forum_categories.created_by IS 'The admin user who created the category.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- 2. Forum Posts Table
CREATE TABLE public.forum_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES public.forum_categories(id),
    author_id uuid NOT NULL REFERENCES public.profiles(id), -- Doctor who created it
    title text NOT NULL,
    content text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL, -- Set by admins
    is_deleted boolean DEFAULT false NOT NULL, -- Soft delete flag
    created_at timestamptz DEFAULT now() NOT NULL,
    last_activity_at timestamptz DEFAULT now() NOT NULL -- Updated on new reply
);

-- Add comments for forum_posts table and columns
COMMENT ON TABLE public.forum_posts IS 'Stores individual forum posts (threads).';
COMMENT ON COLUMN public.forum_posts.category_id IS 'The category this post belongs to.';
COMMENT ON COLUMN public.forum_posts.author_id IS 'The user (doctor) who created the post.';
COMMENT ON COLUMN public.forum_posts.title IS 'The title of the forum post.';
COMMENT ON COLUMN public.forum_posts.content IS 'The main content/body of the post.';
COMMENT ON COLUMN public.forum_posts.is_pinned IS 'Indicates if the post is pinned to the top by an admin.';
COMMENT ON COLUMN public.forum_posts.is_deleted IS 'Flag for soft deletion by admins.';
COMMENT ON COLUMN public.forum_posts.last_activity_at IS 'Timestamp of the last reply (or post creation if no replies).';

-- Add index for faster querying by category and activity
CREATE INDEX idx_forum_posts_category_activity ON public.forum_posts (category_id, is_deleted, is_pinned, last_activity_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- 3. Forum Replies Table
CREATE TABLE public.forum_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.forum_posts(id),
    author_id uuid NOT NULL REFERENCES public.profiles(id), -- Doctor who replied
    content text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL, -- Soft delete flag
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add comments for forum_replies table and columns
COMMENT ON TABLE public.forum_replies IS 'Stores replies to forum posts.';
COMMENT ON COLUMN public.forum_replies.post_id IS 'The post this reply belongs to.';
COMMENT ON COLUMN public.forum_replies.author_id IS 'The user (doctor) who wrote the reply.';
COMMENT ON COLUMN public.forum_replies.content IS 'The content of the reply.';
COMMENT ON COLUMN public.forum_replies.is_deleted IS 'Flag for soft deletion by admins.';

-- Add index for faster querying of replies by post
CREATE INDEX idx_forum_replies_post ON public.forum_replies (post_id, is_deleted, created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Optional: Trigger function to update last_activity_at on forum_posts when a reply is inserted
CREATE OR REPLACE FUNCTION update_post_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_posts
  SET last_activity_at = now()
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_last_activity
AFTER INSERT ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION update_post_last_activity();

COMMENT ON FUNCTION public.update_post_last_activity() IS 'Updates the last_activity_at timestamp on the parent post when a new reply is inserted.';

-- Note: RLS policies need to be created separately based on the plan.
-- Note: Notification trigger/logic needs to be implemented separately.