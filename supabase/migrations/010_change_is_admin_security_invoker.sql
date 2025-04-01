-- Change the is_admin function to SECURITY INVOKER
-- This might prevent RLS recursion issues when the function is called
-- within other policy checks or joins.

CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER -- Changed from DEFINER to INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND is_admin = TRUE
  );
$$;

-- Re-grant execute permission (might not be strictly necessary, but good practice)
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;