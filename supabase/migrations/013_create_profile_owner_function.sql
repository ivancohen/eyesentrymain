-- Create a helper function to check if the current user owns a specific profile.
-- This can sometimes work more reliably in RLS policies than direct auth checks.

CREATE OR REPLACE FUNCTION is_profile_owner(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER -- Run as the calling user
AS $$
  SELECT auth.uid() = profile_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_profile_owner(uuid) TO authenticated;