-- Add is_suspended column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_suspended IS 'Indicates if the user account is suspended (true) or active (false).';

-- Optional: Add an index if you expect to query suspended users frequently
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);