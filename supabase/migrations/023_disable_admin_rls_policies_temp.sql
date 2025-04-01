-- Temporarily disable admin-specific RLS policies on related tables
-- to debug recursion issues potentially triggered by the is_admin() function.
-- WARNING: This reduces security temporarily.

-- Disable admin policy on community_posts
DROP POLICY IF EXISTS "Allow admin full access to posts" ON public.community_posts;

-- Disable admin policy on community_replies
DROP POLICY IF EXISTS "Allow admin full access to replies" ON public.community_replies;

-- Disable admin policy on clinical_resources
DROP POLICY IF EXISTS "Allow admin full access to clinical resources" ON public.clinical_resources;

-- Disable admin policy on community_categories
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.community_categories;

-- Note: RLS is still DISABLED on 'profiles' from migration 020.
-- RLS remains ENABLED on community_posts, community_replies, clinical_resources,
-- dropdown_options, community_categories, but without the admin-specific policies.