-- Admin Status Diagnostic Script
-- This script checks the admin status of a user and helps diagnose permission issues

-- Replace with the email of the user you want to check
\set email_to_check '\'ivan.s.cohen@gmail.com\''

-- Function to display admin status information
DO $$
DECLARE
    user_id UUID;
    user_record RECORD;
    profile_record RECORD;
    app_metadata JSONB;
    is_admin_function BOOLEAN;
BEGIN
    RAISE NOTICE '=== ADMIN STATUS DIAGNOSTIC REPORT ===';
    RAISE NOTICE 'Checking admin status for: %', :email_to_check;
    
    -- Step 1: Check if user exists in auth.users
    SELECT id, raw_app_meta_data, raw_user_meta_data, created_at 
    INTO user_record 
    FROM auth.users 
    WHERE email = :email_to_check;
    
    IF user_record IS NULL THEN
        RAISE NOTICE 'ERROR: User with email % not found in auth.users table', :email_to_check;
        RETURN;
    END IF;
    
    user_id := user_record.id;
    app_metadata := user_record.raw_app_meta_data;
    
    RAISE NOTICE 'User found in auth.users:';
    RAISE NOTICE '  - ID: %', user_id;
    RAISE NOTICE '  - Created at: %', user_record.created_at;
    RAISE NOTICE '  - App metadata: %', app_metadata;
    RAISE NOTICE '  - User metadata: %', user_record.raw_user_meta_data;
    
    -- Check for role in app_metadata
    IF app_metadata IS NULL THEN
        RAISE NOTICE '  - App metadata is NULL';
    ELSIF app_metadata ? 'role' THEN
        RAISE NOTICE '  - Role from app_metadata: %', app_metadata->>'role';
        IF app_metadata->>'role' = 'admin' THEN
            RAISE NOTICE '  - ✅ User has admin role in app_metadata';
        ELSE
            RAISE NOTICE '  - ❌ User does not have admin role in app_metadata';
        END IF;
    ELSE
        RAISE NOTICE '  - ❌ No role key found in app_metadata';
    END IF;
    
    -- Step 2: Check if user has a profile
    SELECT * INTO profile_record FROM profiles WHERE id = user_id;
    
    IF profile_record IS NULL THEN
        RAISE NOTICE 'ERROR: No profile found for this user in profiles table';
        RAISE NOTICE '❌ RECOMMENDATION: Create a profile for this user';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Profile found in profiles table:';
    RAISE NOTICE '  - Email: %', profile_record.email;
    RAISE NOTICE '  - Name: %', profile_record.name;
    RAISE NOTICE '  - is_admin: %', profile_record.is_admin;
    
    IF profile_record.is_admin THEN
        RAISE NOTICE '  - ✅ User has is_admin = true in profiles table';
    ELSE
        RAISE NOTICE '  - ❌ User does not have is_admin = true in profiles table';
    END IF;
    
    -- Step 3: Test the is_admin() function used by RLS policies
    -- Temporarily set local role to the user we're checking
    BEGIN
        -- This will fail if you don't have permission to set role
        EXECUTE 'SET LOCAL ROLE authenticated;';
        EXECUTE 'SET LOCAL "request.jwt.claim.sub" = ''' || user_id || ''';';
        
        -- Check if is_admin() function returns true for this user
        -- This simulates what happens when the user makes an authenticated request
        EXECUTE 'SELECT public.is_admin()' INTO is_admin_function;
        
        IF is_admin_function THEN
            RAISE NOTICE 'RLS Policy Check: ✅ is_admin() function returns TRUE for this user';
        ELSE
            RAISE NOTICE 'RLS Policy Check: ❌ is_admin() function returns FALSE for this user';
        END IF;
        
        -- Reset role
        RESET ROLE;
        RESET "request.jwt.claim.sub";
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'RLS Policy Check: ❌ Could not test is_admin() function - %', SQLERRM;
        -- Reset role
        RESET ROLE;
        RESET "request.jwt.claim.sub";
    END;
    
    -- Summary and recommendations
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY AND RECOMMENDATIONS ===';
    
    IF (app_metadata IS NULL OR NOT app_metadata ? 'role' OR app_metadata->>'role' != 'admin') THEN
        RAISE NOTICE '❌ RECOMMENDATION: Update app_metadata by running:';
        RAISE NOTICE 'UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || ''{"role": "admin"}''::jsonb WHERE id = ''%'';', user_id;
    END IF;
    
    IF NOT profile_record.is_admin THEN
        RAISE NOTICE '❌ RECOMMENDATION: Set is_admin flag in profiles table by running:';
        RAISE NOTICE 'UPDATE profiles SET is_admin = true WHERE id = ''%'';', user_id;
    END IF;
    
    IF (app_metadata IS NOT NULL AND app_metadata ? 'role' AND app_metadata->>'role' = 'admin' AND profile_record.is_admin) THEN
        RAISE NOTICE '✅ User appears to have all necessary admin privileges.';
        RAISE NOTICE 'If issues persist, try:';
        RAISE NOTICE '  1. Logging out and back in to refresh the JWT token';
        RAISE NOTICE '  2. Checking RLS policies are correctly applied (review supabase/rls_policies.sql)';
        RAISE NOTICE '  3. Examining browser console for specific error messages';
    END IF;
    
    RAISE NOTICE '=== END OF REPORT ===';
END $$;
