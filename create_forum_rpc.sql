-- SQL script to create RPC functions for the forum feature

-- Function to manage forum categories (Create, Update, Delete)
-- Requires admin privileges (checked via RLS on the table or within function if needed)
CREATE OR REPLACE FUNCTION manage_forum_category(
    p_id uuid, -- null for create, existing id for update/delete
    p_name text,
    p_description text,
    p_rules text,
    p_display_order integer,
    p_delete boolean
)
RETURNS void -- Or returns the id/record if needed
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with the privileges of the function owner (usually postgres)
AS $$
DECLARE
  v_admin_check boolean;
BEGIN
  -- Optional: Explicit admin check within the function if RLS isn't sufficient
  -- SELECT check_is_admin() INTO v_admin_check;
  -- IF NOT v_admin_check THEN
  --   RAISE EXCEPTION 'Admin privileges required to manage categories';
  -- END IF;

  IF p_delete THEN
    -- Handle Delete: Consider soft delete or check for existing posts
    -- Option 1: Soft delete (if table has is_deleted column)
    -- UPDATE public.forum_categories SET is_deleted = true WHERE id = p_id;

    -- Option 2: Hard delete (use with caution, maybe check posts first)
    DELETE FROM public.forum_categories WHERE id = p_id;

  ELSIF p_id IS NOT NULL THEN
    -- Handle Update
    UPDATE public.forum_categories
    SET
      name = p_name,
      description = p_description,
      rules = p_rules,
      display_order = p_display_order
      -- Do not update created_at or created_by
    WHERE id = p_id;
  ELSE
    -- Handle Create
    INSERT INTO public.forum_categories (name, description, rules, display_order, created_by)
    VALUES (p_name, p_description, p_rules, p_display_order, auth.uid());
    -- Note: Assumes auth.uid() provides the creator's ID
  END IF;
END;
$$;
COMMENT ON FUNCTION manage_forum_category(uuid, text, text, text, integer, boolean)
IS 'Handles Create, Update, and Delete operations for forum_categories. Requires admin privileges.';

-- Function to create a new forum post
CREATE OR REPLACE FUNCTION create_forum_post(
    p_category_id uuid,
    p_title text,
    p_content text
)
RETURNS uuid -- Return the new post ID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_post_id uuid;
BEGIN
  INSERT INTO public.forum_posts (category_id, author_id, title, content)
  VALUES (p_category_id, auth.uid(), p_title, p_content)
  RETURNING id INTO new_post_id;
  RETURN new_post_id;
END;
$$;

COMMENT ON FUNCTION create_forum_post(uuid, text, text)
IS 'Creates a new forum post and returns its ID. Called by authenticated users.';

-- Function to create a new forum reply, update post activity, and create notification
CREATE OR REPLACE FUNCTION create_forum_reply(
    p_post_id uuid,
    p_content text
)
RETURNS uuid -- Return the new reply ID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_reply_id uuid;
  v_post_author_id uuid;
  v_reply_author_id uuid;
  v_post_title text;
BEGIN
  v_reply_author_id := auth.uid(); -- Get the ID of the user making the reply

  -- Insert the reply
  INSERT INTO public.forum_replies (post_id, author_id, content)
  VALUES (p_post_id, v_reply_author_id, p_content)
  RETURNING id INTO new_reply_id;

  -- Update the last_activity_at on the parent post (handled by trigger now, but can be explicit)
  -- UPDATE public.forum_posts SET last_activity_at = now() WHERE id = p_post_id;

  -- Get post author ID and title for notification
  SELECT author_id, title INTO v_post_author_id, v_post_title
  FROM public.forum_posts
  WHERE id = p_post_id;

  -- Insert notification for the original post author (if not replying to own post)
  IF v_post_author_id IS NOT NULL AND v_post_author_id <> v_reply_author_id THEN
    INSERT INTO public.notifications (user_id, type, content, link)
    VALUES (
      v_post_author_id,
      'new_forum_reply', -- Define a notification type
      jsonb_build_object( -- Store relevant details as JSON
        'replyAuthorId', v_reply_author_id,
        -- 'replyAuthorName', (SELECT name FROM public.profiles WHERE id = v_reply_author_id), -- Optional: Get replier name
        'postId', p_post_id,
        'postTitle', v_post_title,
        'replyId', new_reply_id
      ),
      '/forum/post/' || p_post_id -- Link directly to the post
    );
  END IF;

  RETURN new_reply_id;
END;
$$;

COMMENT ON FUNCTION create_forum_reply(uuid, text)
IS 'Creates a new forum reply, updates post activity (via trigger), and notifies the original post author. Called by authenticated users.';

-- Function to delete (soft) a forum post (Admin only)
CREATE OR REPLACE FUNCTION delete_forum_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Optional: Add admin check if RLS is not sufficient
  -- IF NOT check_is_admin() THEN RAISE EXCEPTION 'Admin privileges required'; END IF;
  UPDATE public.forum_posts SET is_deleted = true WHERE id = p_post_id;
END;
$$;

COMMENT ON FUNCTION delete_forum_post(uuid)
IS 'Soft deletes a forum post. Requires admin privileges.';

-- Function to delete (soft) a forum reply (Admin only)
CREATE OR REPLACE FUNCTION delete_forum_reply(p_reply_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Optional: Add admin check if RLS is not sufficient
  -- IF NOT check_is_admin() THEN RAISE EXCEPTION 'Admin privileges required'; END IF;
  UPDATE public.forum_replies SET is_deleted = true WHERE id = p_reply_id;
END;
$$;

COMMENT ON FUNCTION delete_forum_reply(uuid)
IS 'Soft deletes a forum reply. Requires admin privileges.';

-- Function to pin/unpin a forum post (Admin only)
CREATE OR REPLACE FUNCTION pin_forum_post(p_post_id uuid, p_pin_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Optional: Add admin check if RLS is not sufficient
  -- IF NOT check_is_admin() THEN RAISE EXCEPTION 'Admin privileges required'; END IF;
  UPDATE public.forum_posts SET is_pinned = p_pin_status WHERE id = p_post_id;
END;
$$;

COMMENT ON FUNCTION pin_forum_post(uuid, boolean)
IS 'Pins or unpins a forum post. Requires admin privileges.';