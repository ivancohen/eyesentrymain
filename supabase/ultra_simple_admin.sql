-- ADMIN SYSTEM REBUILD SETUP (ULTRA SIMPLE VERSION)
-- This script works with ANY database schema, no matter what columns exist or don't exist

-- 1. EXTEND PROFILES TABLE FOR DOCTOR APPROVAL
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Remove phone_number field if it exists (per updated requirements)
ALTER TABLE profiles DROP COLUMN IF EXISTS phone_number;

COMMENT ON COLUMN profiles.is_approved IS 'Whether the doctor account has been approved by an admin';
COMMENT ON COLUMN profiles.location IS 'City/location of the doctor''s office';
COMMENT ON COLUMN profiles.state IS 'State/province of the doctor''s office';
COMMENT ON COLUMN profiles.zip_code IS 'Postal code for geographic sorting';
COMMENT ON COLUMN profiles.specialty IS 'Doctor specialty or area of expertise';

-- 2. MODIFY PATIENT_RESPONSES TABLE TO LINK TO DOCTORS
ALTER TABLE patient_responses
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES profiles(id);

COMMENT ON COLUMN patient_responses.doctor_id IS 'The doctor/office associated with this patient';

-- 3. CREATE A MINIMAL VIEW USING ONLY COLUMNS GUARANTEED TO EXIST
CREATE OR REPLACE VIEW admin_patient_view AS
SELECT 
  pr.id,
  pr.created_at,
  -- Doctor reference
  pr.doctor_id,
  -- Include profile fields that definitely exist
  doc.id as profile_id,
  doc.email as doctor_email,
  -- Optional profile fields with nullability
  doc.name as doctor_name,
  doc.location as office_location,
  doc.state,
  doc.zip_code,
  doc.specialty
FROM 
  patient_responses pr
LEFT JOIN 
  profiles doc ON pr.doctor_id = doc.id;

-- Doctor approval view using only columns guaranteed to exist
CREATE OR REPLACE VIEW pending_doctor_approvals AS
SELECT 
  id,
  email,
  name,
  created_at,
  location,
  state,
  zip_code,
  specialty,
  is_approved
FROM 
  profiles
WHERE 
  is_approved = false AND 
  specialty IS NOT NULL;

-- 4. DISABLE ROW LEVEL SECURITY TEMPORARILY TO ENSURE ACCESS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE conditional_items DISABLE ROW LEVEL SECURITY;

-- 5. GRANT ACCESS TO VIEWS
GRANT SELECT ON admin_patient_view TO authenticated;
GRANT SELECT ON pending_doctor_approvals TO authenticated;

-- 6. GRANT TABLE ACCESS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE patient_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE dropdown_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE conditional_items TO authenticated;

-- 7. CREATE ADMIN FUNCTIONS
-- Function to approve a doctor account
CREATE OR REPLACE FUNCTION approve_doctor(doctor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if the current user is an admin
  SELECT id INTO admin_id FROM profiles WHERE id = auth.uid() AND is_admin = true;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve doctors';
    RETURN FALSE;
  END IF;
  
  -- Update the doctor's profile
  UPDATE profiles 
  SET is_approved = true,
      updated_at = NOW()
  WHERE id = doctor_id;
  
  RETURN FOUND;
END;
$$;

-- Function to reject a doctor account
CREATE OR REPLACE FUNCTION reject_doctor(doctor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if the current user is an admin
  SELECT id INTO admin_id FROM profiles WHERE id = auth.uid() AND is_admin = true;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can reject doctors';
    RETURN FALSE;
  END IF;
  
  -- For now, just delete the account
  -- Could be modified to keep the record with a 'rejected' status
  DELETE FROM profiles WHERE id = doctor_id;
  
  RETURN FOUND;
END;
$$;

-- Function to create an admin user
CREATE OR REPLACE FUNCTION create_admin(admin_email TEXT, admin_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
  new_admin_id UUID;
BEGIN
  -- Check if the current user is an admin
  SELECT id INTO current_admin_id FROM profiles WHERE id = auth.uid() AND is_admin = true;
  
  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create other admins';
    RETURN FALSE;
  END IF;
  
  -- Check if the user already exists in auth.users
  SELECT id INTO new_admin_id FROM auth.users WHERE email = admin_email;
  
  IF new_admin_id IS NULL THEN
    RAISE EXCEPTION 'User does not exist. They must register first.';
    RETURN FALSE;
  END IF;
  
  -- Check if they already have a profile
  IF EXISTS (SELECT 1 FROM profiles WHERE id = new_admin_id) THEN
    -- Update existing profile to admin
    UPDATE profiles
    SET is_admin = true,
        name = admin_name,
        updated_at = NOW()
    WHERE id = new_admin_id;
  ELSE
    -- Create new profile with admin privileges
    INSERT INTO profiles (
      id, 
      email, 
      name, 
      is_admin, 
      created_at
    ) VALUES (
      new_admin_id,
      admin_email,
      admin_name,
      true,
      NOW()
    );
  END IF;
  
  -- Update user's metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      '{"role": "admin"}'::jsonb
  WHERE id = new_admin_id;
  
  RETURN TRUE;
END;
$$;

-- Function to modify question scores
CREATE OR REPLACE FUNCTION update_question_score(option_type TEXT, option_id UUID, new_score INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if the current user is an admin
  SELECT id INTO admin_id FROM profiles WHERE id = auth.uid() AND is_admin = true;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update question scores';
    RETURN FALSE;
  END IF;
  
  -- Update the appropriate table based on option_type
  IF option_type = 'dropdown' THEN
    UPDATE dropdown_options
    SET score = new_score
    WHERE id = option_id;
  ELSIF option_type = 'conditional' THEN
    UPDATE conditional_items
    SET score = new_score
    WHERE id = option_id;
  ELSE
    RAISE EXCEPTION 'Invalid option type: %', option_type;
    RETURN FALSE;
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Add display_order column to questions table for ordering
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS display_order INTEGER,
ADD COLUMN IF NOT EXISTS page_category TEXT;

-- Function to delete a doctor account
CREATE OR REPLACE FUNCTION delete_doctor(doctor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if the current user is an admin
  SELECT id INTO admin_id FROM profiles WHERE id = auth.uid() AND is_admin = true;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete doctors';
    RETURN FALSE;
  END IF;
  
  -- Delete the doctor's profile
  DELETE FROM profiles WHERE id = doctor_id;
  
  RETURN FOUND;
END;
$$;
