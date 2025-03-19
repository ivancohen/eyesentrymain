-- ADMIN SYSTEM REBUILD SETUP
-- This script sets up the database structure for the new admin system

-- 1. EXTEND PROFILES TABLE FOR DOCTOR APPROVAL
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;

COMMENT ON COLUMN profiles.is_approved IS 'Whether the doctor account has been approved by an admin';
COMMENT ON COLUMN profiles.location IS 'City/location of the doctor''s office';
COMMENT ON COLUMN profiles.state IS 'State/province of the doctor''s office';
COMMENT ON COLUMN profiles.zip_code IS 'Postal code for geographic sorting';

-- 2. MODIFY PATIENT_RESPONSES TABLE TO LINK TO DOCTORS
ALTER TABLE patient_responses
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES profiles(id);

COMMENT ON COLUMN patient_responses.doctor_id IS 'The doctor/office associated with this patient';

-- 3. CREATE ADMIN VIEWS
-- Patient data view for admins (anonymous - no patient names)
CREATE OR REPLACE VIEW admin_patient_view AS
SELECT 
  pr.id,
  pr.created_at,
  pr.response->>'age' as age,
  pr.response->>'race' as race,
  pr.risk_level,
  pr.total_score,
  -- All risk factors
  (pr.response->>'systemic_steroid')::boolean as systemic_steroid,
  (pr.response->>'ocular_steroid')::boolean as ocular_steroid,
  (pr.response->>'intravitreal')::boolean as intravitreal,
  (pr.response->>'family_glaucoma')::boolean as family_glaucoma,
  (pr.response->>'iop_baseline')::boolean as iop_baseline,
  (pr.response->>'vertical_asymmetry')::boolean as vertical_asymmetry,
  (pr.response->>'vertical_ratio')::boolean as vertical_ratio,
  -- Doctor and location info
  doc.id as doctor_id,
  doc.name as doctor_name,
  doc.specialty as specialty,
  doc.location as office_location,
  doc.state,
  doc.zip_code
FROM 
  patient_responses pr
LEFT JOIN 
  profiles doc ON pr.doctor_id = doc.id;

-- Doctor approval view
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
  phone_number as contact,
  address
FROM 
  profiles
WHERE 
  is_approved = false AND 
  specialty IS NOT NULL; -- Only show profiles that appear to be doctor accounts

-- 4. DISABLE ROW LEVEL SECURITY TEMPORARILY
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
