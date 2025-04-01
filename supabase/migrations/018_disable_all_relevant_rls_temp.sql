-- Temporarily disable RLS on multiple tables for debugging recursion issues.
-- WARNING: This is insecure and should only be used for temporary testing.
-- RLS MUST be re-enabled with correct policies afterwards.

-- Disable RLS on profiles (might already be disabled from migration 012)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on community_posts
ALTER TABLE public.community_posts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on community_replies
ALTER TABLE public.community_replies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on clinical_resources
ALTER TABLE public.clinical_resources DISABLE ROW LEVEL SECURITY;

-- Disable RLS on dropdown_options
ALTER TABLE public.dropdown_options DISABLE ROW LEVEL SECURITY;

-- Disable RLS on community_categories
ALTER TABLE public.community_categories DISABLE ROW LEVEL SECURITY;