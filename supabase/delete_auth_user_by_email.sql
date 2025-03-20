-- Create a function to delete a user from auth.users by email
CREATE OR REPLACE FUNCTION delete_auth_user_by_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    RETURN FALSE;
  END IF;

  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
    RETURN FALSE;
  END IF;

  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_auth_user_by_email(TEXT) TO authenticated; 