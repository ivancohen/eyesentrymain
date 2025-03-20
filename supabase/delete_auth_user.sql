-- Create a function to delete a user from auth.users
CREATE OR REPLACE FUNCTION delete_auth_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    RETURN FALSE;
  END IF;

  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated; 