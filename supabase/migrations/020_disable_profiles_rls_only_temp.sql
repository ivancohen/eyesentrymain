-- Temporarily disable RLS ONLY on the profiles table for debugging recursion issues.
-- WARNING: This is insecure and should only be used for temporary testing.
-- RLS on other tables remains enabled.

-- Disable RLS on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Ensure RLS is ENABLED on other relevant tables (re-asserting from previous states)
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;