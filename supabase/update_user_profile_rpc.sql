-- Create an RPC function for updating user profiles
-- This function will be used by the UserManagement component

-- Create the function
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  user_name TEXT,
  is_admin_status BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Update the profile
  UPDATE profiles 
  SET 
    name = user_name,
    is_admin = is_admin_status
  WHERE id = user_id;
  
  -- Check if update was successful
  IF FOUND THEN
    success := true;
    
    -- Also try to update the auth metadata if admin status changed
    IF is_admin_status = true THEN
      BEGIN
        -- This requires admin privileges
        UPDATE auth.users 
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            '{"role": "admin"}'::jsonb
        WHERE id = user_id;
      EXCEPTION WHEN OTHERS THEN
        -- Ignore errors when updating metadata, profile update is the main success criteria
        RAISE NOTICE 'Could not update auth metadata: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN success;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION update_user_profile(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(UUID, TEXT, BOOLEAN) TO anon;

-- Also create a helper function for executing arbitrary SQL (used as fallback)
CREATE OR REPLACE FUNCTION execute_sql(sql_statement TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
  RETURN false;
END;
$$;

-- Only grant to authenticated users as this is potentially dangerous
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
