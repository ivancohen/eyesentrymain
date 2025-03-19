-- Ultra-simplified address fields migration script
-- This script adds structured address fields and handles dependencies safely

-- 1. Add the columns if they don't exist
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'street_address') THEN
    ALTER TABLE profiles ADD COLUMN street_address TEXT;
    RAISE NOTICE 'Added street_address column';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'state') THEN
    ALTER TABLE profiles ADD COLUMN state TEXT;
    RAISE NOTICE 'Added state column';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'zip_code') THEN
    ALTER TABLE profiles ADD COLUMN zip_code TEXT;
    RAISE NOTICE 'Added zip_code column';
  END IF;
END $$;

-- 2. Migrate data if address column exists
DO $$
DECLARE
  has_address BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
  ) INTO has_address;

  IF has_address THEN
    -- Simple update using split_part for comma-separated addresses
    UPDATE profiles SET
      street_address = TRIM(split_part(address, ',', 1)),
      city = TRIM(split_part(address, ',', 2)),
      state = TRIM(split_part(split_part(address, ',', 3), ' ', 1)),
      zip_code = TRIM(split_part(split_part(address, ',', 3), ' ', 2))
    WHERE 
      address IS NOT NULL AND 
      (street_address IS NULL OR city IS NULL OR state IS NULL OR zip_code IS NULL);
    
    RAISE NOTICE 'Migrated existing address data to structured fields';
  ELSE
    RAISE NOTICE 'No address column found, skipping data migration';
  END IF;
END $$;

-- 3. Update RLS policy
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

-- 4. Create the new get_pending_doctors_new function
DROP FUNCTION IF EXISTS get_pending_doctors_new() CASCADE;

CREATE FUNCTION get_pending_doctors_new()
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

-- 5. Update views if they exist
-- Create a separate block for each view to avoid nested DO blocks
DO $$
DECLARE
  has_view BOOLEAN;
  has_address BOOLEAN;
BEGIN
  -- Check if view exists
  SELECT EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'pending_doctor_approvals_no_role'
  ) INTO has_view;

  -- Check if address column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
  ) INTO has_address;

  -- Update view if it exists
  IF has_view THEN
    DROP VIEW IF EXISTS pending_doctor_approvals_no_role CASCADE;
    
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
END $$;

-- Update admin_patient_view_no_role view
DO $$
DECLARE
  has_address BOOLEAN;
  has_patient_id BOOLEAN;
BEGIN
  -- Check if profile columns exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
  ) INTO has_address;
  
  -- Check if patient_id exists in patient_questionnaires
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'patient_questionnaires' AND column_name = 'patient_id'
  ) INTO has_patient_id;
  
  -- Drop the view if it exists
  DROP VIEW IF EXISTS admin_patient_view_no_role CASCADE;
  
  -- Create the view with only the essential fields we know exist
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
  
  RAISE NOTICE 'Updated admin_patient_view_no_role view';
END $$;

-- Final completion notice
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Address fields migration complete!';
  RAISE NOTICE 'Added street_address, city, state, and zip_code columns';
  RAISE NOTICE 'Updated related views and functions';
  RAISE NOTICE '=================================================';
END $$;
