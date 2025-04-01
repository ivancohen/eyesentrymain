-- Modify the is_admin function to use plpgsql and direct select.
-- This is another attempt to resolve potential RLS conflicts.

CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql -- Changed to plpgsql
SECURITY INVOKER -- Keep as INVOKER
STABLE -- Add STABLE modifier as it doesn't modify the database
AS $$
DECLARE
  is_admin_flag boolean;
BEGIN
  SELECT p.is_admin
  INTO is_admin_flag
  FROM public.profiles p
  WHERE p.id = user_id;

  RETURN COALESCE(is_admin_flag, false); -- Return false if user not found or flag is null
END;
$$;

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;