-- This script ensures that ivan.s.cohen@gmail.com has admin privileges
-- and creates a new admin account if needed

-- First, ensure the user has admin flag set in profiles table
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user_id for ivan.s.cohen@gmail.com
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'ivan.s.cohen@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User with email ivan.s.cohen@gmail.com not found in auth.users';
    ELSE
        -- Check if user exists in profiles table
        IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
            -- Update the is_admin flag to true
            UPDATE profiles 
            SET is_admin = true 
            WHERE id = user_id;
            
            RAISE NOTICE 'Updated admin status for existing user with email ivan.s.cohen@gmail.com';
        ELSE
            -- Insert a new profile with admin status
            INSERT INTO profiles (id, email, name, is_admin, created_at)
            VALUES (
                user_id, 
                'ivan.s.cohen@gmail.com', 
                'Ivan Cohen', 
                true, 
                NOW()
            );
            
            RAISE NOTICE 'Created new profile with admin status for ivan.s.cohen@gmail.com';
        END IF;
        
        -- Set app_metadata role to admin for this user
        UPDATE auth.users 
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || 
            '{"role": "admin"}'::jsonb
        WHERE id = user_id;
        
        RAISE NOTICE 'Updated app_metadata for user with email ivan.s.cohen@gmail.com';
    END IF;
END $$;

-- If you need to create a new admin account, uncomment and modify the following:
/*
-- Create a new admin user (if original account cannot be fixed)
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Create a new user in auth.users (this requires admin access to the Supabase project)
    -- Note: This is just for demonstration. In practice, use the Supabase dashboard or API
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        'admin@yourdomain.com', 
        '********', -- You should use proper password hashing
        NOW(),
        '{"role": "admin"}',
        '{"name": "Admin User"}'
    )
    RETURNING id INTO new_user_id;
    
    -- Create profile for the new admin user
    INSERT INTO profiles (id, email, name, is_admin, created_at)
    VALUES (
        new_user_id,
        'admin@yourdomain.com',
        'Admin User',
        true,
        NOW()
    );
    
    RAISE NOTICE 'Created new admin user with email admin@yourdomain.com';
END $$;
*/
