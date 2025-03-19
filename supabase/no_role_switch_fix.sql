-- FIX FOR ROLE SWITCHING ERRORS
-- This script adds a fix that completely eliminates the need for role switching

-- 1. Create a new Supabase function that checks admin status directly
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if the current user is an admin by querying the profiles table
  SELECT is_admin INTO is_admin_user 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Return the admin status (or false if not found)
  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- 2. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_is_admin() TO authenticated;

-- 3. Create a more lenient version of the admin view that doesn't require admin role
DROP VIEW IF EXISTS admin_patient_view_no_role;
CREATE VIEW admin_patient_view_no_role AS
SELECT 
  pr.id,
  pr.created_at,
  pr.doctor_id,
  -- Include profile fields
  doc.id as profile_id,
  doc.email as doctor_email,
  doc.name as doctor_name,
  doc.location as office_location,
  doc.state,
  doc.zip_code,
  doc.specialty
FROM 
  patient_responses pr
LEFT JOIN 
  profiles doc ON pr.doctor_id = doc.id
WHERE 
  -- Only allow access if the current user is an admin
  check_is_admin() = true;

-- 4. First drop any dependent functions to allow view recreation
DROP FUNCTION IF EXISTS get_pending_doctors();

-- Then create a more lenient version of the pending approvals view
DROP VIEW IF EXISTS pending_doctor_approvals_no_role CASCADE;
CREATE VIEW pending_doctor_approvals_no_role AS
SELECT 
  p.id,
  u.email,
  COALESCE(p.name, u.email) as name,
  p.created_at,
  p.location,
  p.state,
  p.zip_code,
  p.specialty,
  p.is_approved
FROM 
  profiles p
JOIN
  auth.users u ON p.id = u.id
WHERE 
  (p.is_approved IS NULL OR p.is_approved = false) AND 
  (p.is_admin IS NULL OR p.is_admin = false) AND
  -- Only allow access if the current user is an admin
  check_is_admin() = true;

-- 5. Grant access to the new views
GRANT SELECT ON admin_patient_view_no_role TO authenticated;
GRANT SELECT ON pending_doctor_approvals_no_role TO authenticated;

-- 6. Create or update the get_pending_doctors function
CREATE OR REPLACE FUNCTION get_pending_doctors()
RETURNS SETOF pending_doctor_approvals_no_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view pending doctors';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT * FROM pending_doctor_approvals_no_role;
END;
$$;

-- 7. Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION get_pending_doctors() TO authenticated;
