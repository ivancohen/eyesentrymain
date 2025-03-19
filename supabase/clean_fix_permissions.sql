-- IMMEDIATE PERMISSION FIX SCRIPT (CLEAN VERSION)
-- This script provides a direct fix for the 403 errors by:
-- 1. Adding public access to profiles and patient_responses tables
-- 2. Ensuring the admin user has all necessary privileges
-- Run this in the Supabase SQL Editor

-- Step 1: Make sure RLS is disabled until we set up proper policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE conditional_items DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant direct access to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE patient_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE dropdown_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE conditional_items TO authenticated;

-- Step 3: Ensure specific user has admin privileges
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Find user ID for ivan.s.cohen@gmail.com
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'ivan.s.cohen@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found';
        RETURN;
    END IF;
    
    -- Update app_metadata to include admin role
    UPDATE auth.users 
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || 
        '{"role": "admin"}'::jsonb
    WHERE id = user_id;
    
    -- Check if user has a profile
    IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
        -- Update existing profile
        UPDATE profiles 
        SET is_admin = true 
        WHERE id = user_id;
    ELSE
        -- Create new profile
        INSERT INTO profiles (id, email, name, is_admin, created_at)
        VALUES (
            user_id, 
            'ivan.s.cohen@gmail.com', 
            'Ivan Cohen', 
            true, 
            NOW()
        );
    END IF;
    
    RAISE NOTICE 'Admin privileges granted to user: %', user_id;
END $$;

-- Step 4: Create an anonymous view for patient data that doesn't require admin role
-- This is a simplified approach that will work immediately
CREATE OR REPLACE VIEW public.patient_data_view AS 
SELECT 
    id, 
    created_at,
    response->>'age' as age,
    response->>'race' as race,
    risk_level,
    total_score,
    (response->>'systemic_steroid')::boolean as systemic_steroid,
    (response->>'ocular_steroid')::boolean as ocular_steroid,
    (response->>'intravitreal')::boolean as intravitreal,
    (response->>'family_glaucoma')::boolean as family_glaucoma,
    (response->>'iop_baseline')::boolean as iop_baseline,
    (response->>'vertical_asymmetry')::boolean as vertical_asymmetry,
    (response->>'vertical_ratio')::boolean as vertical_ratio
FROM patient_responses;

-- Grant access to the view
GRANT SELECT ON public.patient_data_view TO authenticated;

-- Step 5: Create a view for question scores if needed
CREATE OR REPLACE VIEW public.question_scores_view AS
SELECT 
    q.id as question_id,
    q.question_text as question,
    q.question_type,
    do.id as option_id,
    do.option_text,
    do.score as dropdown_score,
    ci.id as conditional_item_id,
    ci.condition_value,
    ci.score as conditional_score
FROM 
    questions q
LEFT JOIN 
    dropdown_options do ON do.question_id = q.id
LEFT JOIN 
    conditional_items ci ON ci.question_id = q.id;

-- Grant access to the question scores view
GRANT SELECT ON public.question_scores_view TO authenticated;

-- Add comment explaining what this script does
COMMENT ON VIEW patient_data_view IS 'Anonymous patient data view that provides all necessary fields without requiring admin privileges';
COMMENT ON VIEW question_scores_view IS 'Question scores view that joins questions with their dropdown options and conditional items';
