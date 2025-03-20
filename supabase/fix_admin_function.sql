-- Fix for the 'create_admin' function that is used by NewAdminService.setAdminStatus
-- This ensures the function exists and works as expected

-- Create or replace the function
CREATE OR REPLACE FUNCTION create_admin(admin_email TEXT, admin_name TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  success BOOLEAN := false;
BEGIN
      -- Find the user
      SELECT id INTO target_user_id 
      FROM profiles 
      WHERE email = admin_email;
      
      IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', admin_email;
      END IF;
      
      -- Update the profiles table
      UPDATE profiles 
      SET is_admin = true 
      WHERE id = target_user_id;
      
      -- Check if update was successful
      IF FOUND THEN
        success := true;
        
        -- Also try to update the auth metadata if possible
        BEGIN
          -- This requires admin privileges
          UPDATE auth.users 
          SET raw_app_meta_data = 
              COALESCE(raw_app_meta_data, '{}'::jsonb) || 
              '{"role": "admin"}'::jsonb
          WHERE id = target_user_id;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore errors, the profiles update is the main success criteria
          RAISE NOTICE 'Could not update auth metadata: %', SQLERRM;
        END;
      END IF;
      
      RETURN success;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION create_admin(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin(TEXT, TEXT) TO anon;

-- Test the function (uncomment to execute)
-- SELECT create_admin('ivan.s.cohen@gmail.com', 'Ivan Cohen');
