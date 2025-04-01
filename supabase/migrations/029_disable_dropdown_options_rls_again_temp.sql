-- Temporarily disable RLS ONLY on the dropdown_options table again for debugging.
-- WARNING: This reduces security for this specific table.

ALTER TABLE public.dropdown_options DISABLE ROW LEVEL SECURITY;

-- Note: RLS on profiles should remain ENABLED with self-read/update policies.
-- RLS on other tables (community_*, clinical_resources, etc.) should also remain ENABLED.