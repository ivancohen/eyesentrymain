-- Simple script to disable Row Level Security for the profiles table
-- This is the most reliable fix for the infinite recursion issue
-- WARNING: This is a temporary solution and reduces security!

-- Step 1: Disable Row Level Security for the profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Test the fix
SELECT * FROM profiles LIMIT 1;

-- IMPORTANT: This is a temporary solution!
-- After confirming that the application works correctly,
-- you should re-enable Row Level Security with properly designed policies.
-- To re-enable RLS, run:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Then create appropriate policies.