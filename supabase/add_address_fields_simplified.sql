-- =====================================================
-- SIMPLIFIED ADDRESS FIELDS MIGRATION
-- =====================================================
-- This script adds address fields to the profiles table
-- and updates related views and functions

-- Check and add columns if they don't exist
DO $$
DECLARE
  street_address_exists BOOLEAN;
  city_exists BOOLEAN;
  state_exists BOOLEAN;
  zip_code_exists BOOLEAN;
BEGIN
  -- Check if columns already exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'street_address'
  ) INTO street_address_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city'
  ) INTO city_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'state'
  ) INTO state_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'zip_code'
  ) INTO zip_code_exists;

  -- Add columns if they don't exist
  IF NOT street_address_exists THEN
    ALTER TABLE profiles ADD COLUMN street_address TEXT;
    RAISE NOTICE 'Added street_address column to profiles table';
  END IF;

  IF NOT city_exists THEN
    ALTER TABLE profiles ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column to profiles table';
  END IF;
  
  IF NOT state_exists THEN
    ALTER TABLE profiles ADD COLUMN state TEXT;
    RAISE NOTICE 'Added state column to profiles table';
  END IF;

  IF NOT zip_code_exists THEN
    ALTER TABLE profiles ADD COLUMN zip_code TEXT;
    RAISE NOTICE 'Added zip_code column to profiles table';
  END IF;
END $$;

-- Check if address column exists and migrate data if it does
DO $$
DECLARE
  address_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
  ) INTO address_exists;

  IF address_exists THEN
    EXECUTE '
      UPDATE profiles 
      SET 
        street_address = CASE 
          WHEN address IS NOT NULL AND position('','''' in address) > 0 
          THEN trim(split_part(address, '','', 1))
          ELSE address
        END,
        city = CASE 
          WHEN address IS NOT NULL AND position('','''' in address) > 0 
          THEN trim(split_part(address, '','', 2))
          ELSE NULL
        END,
        state = CASE 
          WHEN address IS NOT NULL AND array_length(string_to_array(address, '',''), 1) >= 3
          THEN trim(split_part(regexp_replace(split_part(address, '','', 3), ''([A-Z]{2})\s+\d{5}(-\d{4})?$'', ''\1''), '' '', 1))
          ELSE NULL
        END,
        zip_code = CASE 
          WHEN address IS NOT NULL AND array_length(string_to_array(address, '',''), 1) >= 3
          THEN regexp_replace(split_part(address, '','', 3), ''^.*?([0-9]{5}(-[0-9]{4})?)$'', ''\1'')
          ELSE NULL
        END
      WHERE 
        (street_address IS NULL OR city IS NULL OR state IS NULL OR zip_code IS NULL)
        AND address IS NOT NULL;
    ';
    RAISE NOTICE 'Migrated data from address column to structured fields';
  ELSE
    RAISE NOTICE 'Address column not found, skipping data migration';
  END IF;
END $$;

-- Update RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
  CREATE POLICY "Anyone can read profiles" ON profiles 
    FOR SELECT USING (
      auth.uid() = id OR
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
      )
    );
  RAISE NOTICE 'Updated RLS policies for profiles table';
END $$;

-- Create a new pending doctors function that doesn't rely on views
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_pending_doctors_new() CASCADE;
  
  CREATE OR REPLACE FUNCTION get_pending_doctors_new()
  RETURNS TABLE (
    doctor_id uuid,
    doctor_email text,
    doctor_name text
  )
  LANGUAGE sql
  SECURITY DEFINER
  AS $$
    SELECT 
      p.id as doctor_id, 
      p.email as doctor_email, 
      p.name as doctor_name
    FROM profiles p
    WHERE 
      p.is_approved = false AND
      EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = p.id
        AND (u.raw_app_meta_data->>'requestRole')::text = 'doctor'
      );
  $$;
  
  RAISE NOTICE 'Created get_pending_doctors_new function';
END $$;

-- Check for views existence
DO $$
BEGIN
  -- Update pending_doctor_approvals_no_role view if it exists
  IF EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'pending_doctor_approvals_no_role'
  ) THEN
    -- First check if address column exists
    DECLARE
      has_address BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
      ) INTO has_address;
      
      -- Drop existing view
      DROP VIEW IF EXISTS pending_doctor_approvals_no_role CASCADE;
      
      -- Recreate view conditionally
      IF has_address THEN
      CREATE VIEW pending_doctor_approvals_no_role AS
      SELECT 
        p.id,
        p.email,
        p.name,
        p.is_approved,
        p.created_at,
        p.specialty,
        p.address,
        p.location,
        p.state,
        p.zip_code,
        p.street_address,
        p.city
      FROM profiles p
      WHERE 
        p.is_approved = false AND
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = p.id
          AND (u.raw_app_meta_data->>'requestRole')::text = 'doctor'
        );
    ELSE
      CREATE VIEW pending_doctor_approvals_no_role AS
      SELECT 
        p.id,
        p.email,
        p.name,
        p.is_approved,
        p.created_at,
        p.specialty,
        p.location,
        p.state,
        p.zip_code,
        p.street_address,
        p.city
      FROM profiles p
      WHERE 
        p.is_approved = false AND
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = p.id
          AND (u.raw_app_meta_data->>'requestRole')::text = 'doctor'
        );
    END IF;
    
    RAISE NOTICE 'Updated pending_doctor_approvals_no_role view';
  END IF;
  
  -- Now handle admin_patient_view_no_role view
  DECLARE
    has_address BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
    ) INTO has_address;
    
    -- Drop the view if it exists
    DROP VIEW IF EXISTS admin_patient_view_no_role CASCADE;
    
    -- Create appropriate view version
    IF has_address THEN
    CREATE VIEW admin_patient_view_no_role AS
    SELECT 
      pq.id,
      pq.created_at,
      pq.doctor_id,
      dr.email as doctor_email,
      dr.name as doctor_name,
      dr.specialty,
      dr.location as office_location,
      dr.state,
      dr.zip_code,
      dr.street_address,
      dr.city,
      dr.address
    FROM patient_questionnaires pq
    LEFT JOIN profiles dr ON pq.doctor_id = dr.id
    WHERE EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
    );
  ELSE
    CREATE VIEW admin_patient_view_no_role AS
    SELECT 
      pq.id,
      pq.created_at,
      pq.doctor_id,
      dr.email as doctor_email,
      dr.name as doctor_name,
      dr.specialty,
      dr.location as office_location,
      dr.state,
      dr.zip_code,
      dr.street_address,
      dr.city
    FROM patient_questionnaires pq
    LEFT JOIN profiles dr ON pq.doctor_id = dr.id
    WHERE EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
    );
  END IF;
  
  RAISE NOTICE 'Updated admin_patient_view_no_role view';
END $$;

-- Final completion message
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Address fields migration complete!';
  RAISE NOTICE 'Added street_address, city, state, and zip_code columns';
  RAISE NOTICE 'Updated related views and functions';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'NOTE: The function get_pending_doctors() was replaced by get_pending_doctors_new()';
  RAISE NOTICE 'Please update any code that uses the old function to use the new one';
END $$;
