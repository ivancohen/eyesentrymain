-- =============================
-- PHASE 1: ADD NEW COLUMNS
-- =============================
-- Safely add new columns if they don't exist

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
  
  IF NOT state_exists AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE profiles ADD COLUMN state TEXT;
    RAISE NOTICE 'Added state column to profiles table';
  END IF;

  IF NOT zip_code_exists AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN zip_code TEXT;
    RAISE NOTICE 'Added zip_code column to profiles table';
  END IF;
END $$;

-- =============================
-- PHASE 2: MIGRATE EXISTING DATA
-- =============================
-- First check if the address column exists, then parse existing address data into new columns

DO $$
DECLARE
  address_exists BOOLEAN;
BEGIN
  -- Check if address column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
  ) INTO address_exists;

  IF address_exists THEN
    -- Only perform the migration if the address column exists
    RAISE NOTICE 'Migrating data from address column to structured fields...';
    
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
          THEN trim(split_part(split_part(address, '','', 3), '' '', 1))
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
    
    RAISE NOTICE 'Data migration from address column complete';
  ELSE
    RAISE NOTICE 'Address column not found, skipping data migration';
  END IF;
END $$;

-- =============================
-- PHASE 3: UPDATE RLS POLICIES
-- =============================
-- Update RLS policies to include new fields

DO $$
BEGIN
  -- Re-create the read policy for profiles to ensure it includes the new columns
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
  RAISE NOTICE 'Updated profiles table RLS policies';
END $$;

-- =============================
-- PHASE 4: UPDATE VIEWS
-- =============================
-- Carefully update views to include new columns

DO $$
BEGIN
  -- Check if pending_doctor_approvals_no_role view exists before dropping
  IF EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'pending_doctor_approvals_no_role'
  ) THEN
    -- First check if address column exists in profiles
    DECLARE
      has_address_column BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
      ) INTO has_address_column;
      
      -- Create the view with appropriate columns based on what exists
      IF has_address_column THEN
        EXECUTE format('
          CREATE OR REPLACE VIEW pending_doctor_approvals_new AS
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
          FROM 
            profiles p
          WHERE 
            p.is_approved = false AND
            EXISTS (
              SELECT 1 FROM auth.users u
              WHERE u.id = p.id
              AND (u.raw_app_meta_data->>''requestRole'')::text = ''doctor''
            );
        ');
      ELSE
        EXECUTE format('
          CREATE OR REPLACE VIEW pending_doctor_approvals_new AS
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
          FROM 
            profiles p
          WHERE 
            p.is_approved = false AND
            EXISTS (
              SELECT 1 FROM auth.users u
              WHERE u.id = p.id
              AND (u.raw_app_meta_data->>''requestRole'')::text = ''doctor''
            );
        ');
      END IF;
    END;
    
    -- Drop the existing view and its dependencies with cascade
    DROP VIEW IF EXISTS pending_doctor_approvals_no_role CASCADE;
    
    -- Rename the new view to the original name
    ALTER VIEW pending_doctor_approvals_new RENAME TO pending_doctor_approvals_no_role;
    
    RAISE NOTICE 'Updated pending_doctor_approvals_no_role view';
  END IF;
  
  -- Create a new simpler function that doesn't depend on the view
  EXECUTE format('
    CREATE OR REPLACE FUNCTION get_pending_doctors_new()
    RETURNS TABLE (
      doctor_id uuid,
      doctor_email text,
      doctor_name text
    )
    AS $FUNC$
      SELECT p.id as doctor_id, p.email as doctor_email, p.name as doctor_name
      FROM profiles p
      WHERE p.is_approved = false 
      AND EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = p.id
        AND (u.raw_app_meta_data->>''requestRole'')::text = ''doctor''
      );
    $FUNC$ LANGUAGE sql SECURITY DEFINER;
  ');
  
  RAISE NOTICE 'Created get_pending_doctors_new function';
  
  -- Update admin_patient_view_no_role to include new address fields
  DROP VIEW IF EXISTS admin_patient_view_no_role CASCADE;
  
  -- Check if address column exists in profiles
  DECLARE
    has_address_column BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address'
    ) INTO has_address_column;
    
    -- Create the view with appropriate columns based on what exists
    IF has_address_column THEN
      EXECUTE format('
        CREATE VIEW admin_patient_view_no_role AS
        SELECT 
          pq.id,
          pq.created_at,
          pq.doctor_id,
          pq.profile_id,
          dr.email as doctor_email,
          dr.name as doctor_name,
          dr.specialty,
          dr.location as office_location,
          dr.state,
          dr.zip_code,
          dr.street_address,
          dr.city,
          dr.address
        FROM 
          patient_questionnaires pq
        LEFT JOIN 
          profiles dr ON pq.doctor_id = dr.id
        WHERE 
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_app_meta_data->>''is_admin'')::boolean = true
          );
      ');
    ELSE
      EXECUTE format('
        CREATE VIEW admin_patient_view_no_role AS
        SELECT 
          pq.id,
          pq.created_at,
          pq.doctor_id,
          pq.profile_id,
          dr.email as doctor_email,
          dr.name as doctor_name,
          dr.specialty,
          dr.location as office_location,
          dr.state,
          dr.zip_code,
          dr.street_address,
          dr.city
        FROM 
          patient_questionnaires pq
        LEFT JOIN 
          profiles dr ON pq.doctor_id = dr.id
        WHERE 
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_app_meta_data->>''is_admin'')::boolean = true
          );
      ');
    END IF;
  END;

  RAISE NOTICE 'Updated admin_patient_view_no_role view';
END $$;

-- =============================
-- PHASE 5: FINAL NOTICE
-- =============================

DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Added address fields to profiles table and updated views';
  RAISE NOTICE 'NOTE: The function get_pending_doctors() was replaced by get_pending_doctors_new()';
  RAISE NOTICE 'Please update any code that uses the old function to use the new one';
END $$;
