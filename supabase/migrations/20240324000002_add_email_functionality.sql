-- Create a table to store email notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Function to send specialist access email
CREATE OR REPLACE FUNCTION public.send_specialist_access_email(
  p_recipient_email TEXT,
  p_access_code TEXT,
  p_patient_name TEXT,
  p_doctor_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_email_id UUID;
  v_access_url TEXT;
BEGIN
  -- Get the application URL from environment variable or use a default
  v_access_url := current_setting('app.settings.url', true) || '/specialist/' || p_access_code;
  
  -- Create email notification record
  INSERT INTO email_notifications (
    type,
    recipient,
    subject,
    content,
    metadata
  ) VALUES (
    'specialist_access',
    p_recipient_email,
    'Access Link for Patient ' || p_patient_name,
    '
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="color: #4a6ee0;">EyeSentry Specialist Access</h2>
        <p>Hello,</p>
        <p>Dr. ' || p_doctor_name || ' has requested your specialist opinion for patient ' || p_patient_name || '.</p>
        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4a6ee0;">
          <p><strong>Access Link:</strong></p>
          <p><a href="' || v_access_url || '" style="color: #4a6ee0; text-decoration: none;">' || v_access_url || '</a></p>
        </div>
        <p>This link will give you access to the patient''s questionnaire and allow you to provide your specialist response.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">This is an automated message from the EyeSentry system. Please do not reply to this email.</p>
      </div>
    </div>
    ',
    jsonb_build_object(
      'access_code', p_access_code,
      'patient_name', p_patient_name,
      'doctor_name', p_doctor_name,
      'access_url', v_access_url
    )
  )
  RETURNING id INTO v_email_id;
  
  -- Notify the application to send the email
  PERFORM pg_notify(
    'email_notifications',
    json_build_object(
      'id', v_email_id,
      'type', 'specialist_access',
      'recipient', p_recipient_email,
      'metadata', jsonb_build_object(
        'access_code', p_access_code,
        'patient_name', p_patient_name,
        'doctor_name', p_doctor_name,
        'access_url', v_access_url
      )
    )::text
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in send_specialist_access_email: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_specialist_access_email(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.send_specialist_access_email IS 
'Sends an email to a specialist with an access link for a patient questionnaire'; 