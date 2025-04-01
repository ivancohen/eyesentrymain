-- Temporarily disable RLS on the profiles table for debugging recursion issues.
-- WARNING: This is insecure and should only be used for temporary testing.
-- RLS should be re-enabled with correct policies afterwards.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;