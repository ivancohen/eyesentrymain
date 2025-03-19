-- Function to check a doctor's approval status
-- This function will check a user's approval status in the doctor_approvals table
-- and return a status (pending, approved, rejected, or null if not found)

-- Drop existing function if it exists to avoid ambiguity
DROP FUNCTION IF EXISTS public.check_doctor_approval_status(UUID);

CREATE FUNCTION public.check_doctor_approval_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_status TEXT;
  v_is_doctor BOOLEAN;
BEGIN
  -- First check if the user exists in the doctor_approvals table
  SELECT status INTO v_status
  FROM public.doctor_approvals
  WHERE user_id = p_user_id;
  
  -- If no record found, check if they might be a doctor based on metadata
  IF v_status IS NULL THEN
    -- Check if the user has any doctor-related metadata
    SELECT 
      (raw_app_meta_data->>'role' = 'doctor' OR raw_app_meta_data->>'requestRole' = 'doctor') 
      OR (raw_user_meta_data->>'doctorName' IS NOT NULL)
    INTO v_is_doctor
    FROM auth.users
    WHERE id = p_user_id;
    
    -- If they appear to be a doctor but don't have an approval record,
    -- assume they're in a pending state and create a record
    IF v_is_doctor THEN
      INSERT INTO public.doctor_approvals (user_id, status)
      VALUES (p_user_id, 'pending')
      ON CONFLICT (user_id) DO NOTHING;
      
      v_status := 'pending';
    END IF;
  END IF;
  
  RETURN jsonb_build_object('status', v_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.check_doctor_approval_status(UUID) IS 
'Checks if a user is a doctor and their approval status (pending, approved, rejected)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_doctor_approval_status(UUID) TO authenticated;

-- Create functions to approve/reject doctors without needing direct table access
-- This is used by the FixedAdminService on the frontend

DROP FUNCTION IF EXISTS public.approve_doctor(UUID);

CREATE FUNCTION public.approve_doctor(doctor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ) INTO v_is_admin;
  
  -- Only admins can approve doctors
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can approve doctor accounts';
  END IF;
  
  -- Update the doctor_approvals record
  UPDATE public.doctor_approvals
  SET 
    status = 'approved',
    reviewer_id = auth.uid(),
    updated_at = now()
  WHERE user_id = doctor_id;
  
  -- Update the profiles table to mark doctor as approved
  UPDATE public.profiles
  SET is_approved = true
  WHERE id = doctor_id;
  
  -- Also update the auth metadata if needed
  UPDATE auth.users
  SET 
    raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"doctor"'
    )
  WHERE id = doctor_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject doctor applications
DROP FUNCTION IF EXISTS public.reject_doctor(UUID);

CREATE FUNCTION public.reject_doctor(doctor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ) INTO v_is_admin;
  
  -- Only admins can reject doctors
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can reject doctor accounts';
  END IF;
  
  -- Update the doctor_approvals record
  UPDATE public.doctor_approvals
  SET 
    status = 'rejected',
    reviewer_id = auth.uid(),
    updated_at = now()
  WHERE user_id = doctor_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to notify admins about new doctor registrations
DROP FUNCTION IF EXISTS public.notify_admins_new_doctor(UUID, TEXT, TEXT, TEXT[]);

CREATE FUNCTION public.notify_admins_new_doctor(
  p_doctor_id UUID,
  p_doctor_name TEXT,
  p_doctor_email TEXT,
  p_admin_emails TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_email TEXT;
  v_admin_notification_id UUID;
BEGIN
  -- Create a notification record in admin_notifications table if it exists
  BEGIN
    INSERT INTO admin_notifications (
      type,
      content,
      related_id,
      is_read
    ) VALUES (
      'new_doctor_registration',
      jsonb_build_object(
        'doctor_id', p_doctor_id,
        'doctor_name', p_doctor_name,
        'doctor_email', p_doctor_email
      ),
      p_doctor_id,
      false
    )
    RETURNING id INTO v_admin_notification_id;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, skip this step
      NULL;
  END;
  
  -- For each admin email, send a notification
  -- This is just a placeholder - in a real implementation, 
  -- you would call an email service or webhook here
  FOREACH v_email IN ARRAY p_admin_emails
  LOOP
    -- Log a record of the notification for debugging
    RAISE NOTICE 'Would send email to admin % about new doctor registration for %', 
      v_email, p_doctor_name;
      
    -- Future implementation would send actual emails here
  END LOOP;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.notify_admins_new_doctor(UUID, TEXT, TEXT, TEXT[]) IS 
'Notifies admin users about new doctor registration requests';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.notify_admins_new_doctor(UUID, TEXT, TEXT, TEXT[]) TO authenticated;
