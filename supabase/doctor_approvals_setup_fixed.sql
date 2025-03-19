-- Setup for doctor approvals workflow
-- This script creates and configures the doctor_approvals table and related functions

-- Create table for doctor approval workflow
CREATE TABLE IF NOT EXISTS public.doctor_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  license_number TEXT,
  license_state TEXT,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Only one approval record per user
  UNIQUE(user_id)
);

-- Comments
COMMENT ON TABLE public.doctor_approvals IS 'Table for managing doctor account approval workflow';
COMMENT ON COLUMN public.doctor_approvals.status IS 'Status of the approval request (pending, approved, rejected)';
COMMENT ON COLUMN public.doctor_approvals.reviewer_id IS 'Admin user who processed the approval request';
COMMENT ON COLUMN public.doctor_approvals.license_number IS 'Doctor license number for verification';
COMMENT ON COLUMN public.doctor_approvals.license_state IS 'State where the doctor is licensed';

-- Function to automatically create approval record on registration
CREATE OR REPLACE FUNCTION public.handle_new_doctor_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a doctor registration by looking at the app_metadata
  IF NEW.raw_app_meta_data->>'role' = 'doctor' OR 
     NEW.raw_app_meta_data->>'requestRole' = 'doctor' OR
     NEW.raw_user_meta_data->>'doctorName' IS NOT NULL THEN
    
    -- Create approval record if one doesn't exist yet
    INSERT INTO public.doctor_approvals (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create approval record on new user insertion
DROP TRIGGER IF EXISTS on_doctor_registration ON auth.users;
CREATE TRIGGER on_doctor_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_doctor_registration();

-- Function to update user role when approved
CREATE OR REPLACE FUNCTION public.approve_doctor_account(
  p_user_id UUID,
  p_reviewer_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
  END IF;
  
  -- Update approval status
  UPDATE public.doctor_approvals
  SET status = 'approved',
      reviewer_id = p_reviewer_id,
      notes = p_notes,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Set role to doctor in auth.users
  UPDATE auth.users
  SET raw_app_meta_data = 
    jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"doctor"'
    )
  WHERE id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject doctor account
CREATE OR REPLACE FUNCTION public.reject_doctor_account(
  p_user_id UUID,
  p_reviewer_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
  END IF;
  
  -- Update approval status
  UPDATE public.doctor_approvals
  SET status = 'rejected',
      reviewer_id = p_reviewer_id,
      notes = p_notes,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE public.doctor_approvals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_doctor_approvals ON public.doctor_approvals;
DROP POLICY IF EXISTS user_view_own_approval ON public.doctor_approvals;

-- Admin can see and modify all approval records
CREATE POLICY admin_doctor_approvals ON public.doctor_approvals
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'))
  );

-- Users can view their own approval status
CREATE POLICY user_view_own_approval ON public.doctor_approvals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create a view to make approval management easier for admins
DROP VIEW IF EXISTS doctor_approval_requests;
CREATE VIEW doctor_approval_requests AS
SELECT
  da.id,
  da.user_id,
  da.status,
  da.created_at,
  da.updated_at,
  da.notes,
  da.license_number,
  da.license_state,
  da.specialty,
  da.reviewer_id,
  u.email,
  u.raw_user_meta_data->>'name' AS name,
  u.raw_user_meta_data->>'doctorName' AS doctor_name,
  u.raw_user_meta_data->>'phoneNumber' AS phone_number,
  u.raw_user_meta_data->>'address' AS address,
  u.raw_user_meta_data->>'specialty' AS user_specialty,
  r.email AS reviewer_email
FROM
  public.doctor_approvals da
JOIN
  auth.users u ON da.user_id = u.id
LEFT JOIN
  auth.users r ON da.reviewer_id = r.id;
