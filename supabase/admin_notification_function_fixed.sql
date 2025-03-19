-- Function to notify admins about new doctor registrations
-- This will send an email to all admin users when a new doctor registers

-- First, create the notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Now create the notification function
CREATE OR REPLACE FUNCTION public.notify_admins_new_doctor(
  p_doctor_id UUID,
  p_doctor_name TEXT,
  p_doctor_email TEXT,
  p_admin_emails TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_email TEXT;
  v_admin_notification_id UUID;
  v_email_subject TEXT;
  v_email_content TEXT;
  v_dashboard_url TEXT := 'https://eyesentry.com/new-admin'; -- Replace with your actual URL
BEGIN
  -- Insert notification into admin_notifications table
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
      'doctor_email', p_doctor_email,
      'timestamp', now()
    ),
    p_doctor_id,
    false
  )
  RETURNING id INTO v_admin_notification_id;
  
  -- Create email subject and content
  v_email_subject := 'New Doctor Registration: ' || p_doctor_name;
  v_email_content := '
  <html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #4a6ee0;">New Doctor Registration Requires Approval</h2>
      <p>A new doctor has registered and is awaiting your approval:</p>
      <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4a6ee0;">
        <p><strong>Name:</strong> ' || p_doctor_name || '</p>
        <p><strong>Email:</strong> ' || p_doctor_email || '</p>
        <p><strong>Registration Time:</strong> ' || to_char(now(), 'YYYY-MM-DD HH:MI:SS AM') || '</p>
      </div>
      <p>Please review and approve or reject this registration at your earliest convenience.</p>
      <p><a href="' || v_dashboard_url || '" style="display: inline-block; background-color: #4a6ee0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Dashboard</a></p>
      <p style="margin-top: 20px; font-size: 12px; color: #777;">This is an automated message from the EyeSentry system.</p>
    </div>
  </body>
  </html>';
  
  -- For each admin email, send a notification
  FOREACH v_email IN ARRAY p_admin_emails
  LOOP
    -- Log a record of the notification for debugging
    RAISE NOTICE 'Sending email to admin % about new doctor registration for %', 
      v_email, p_doctor_name;
    
    -- Send actual email using net/http_post in real implementation
    -- In this case, we'll use pg_notify to signal the application to send an email
    PERFORM pg_notify(
      'admin_notifications',
      json_build_object(
        'type', 'new_doctor_email',
        'recipient', v_email,
        'subject', v_email_subject,
        'body', v_email_content,
        'notification_id', v_admin_notification_id
      )::text
    );
  END LOOP;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in notify_admins_new_doctor: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.notify_admins_new_doctor IS 
'Notifies admin users about new doctor registration requests';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.notify_admins_new_doctor(UUID, TEXT, TEXT, TEXT[]) TO authenticated;

-- Create a view for the admin dashboard to show pending notifications
DROP VIEW IF EXISTS admin_notification_view;
CREATE VIEW admin_notification_view AS
SELECT 
  an.id,
  an.type,
  an.content,
  an.related_id,
  an.is_read,
  an.created_at,
  CASE 
    WHEN an.type = 'new_doctor_registration' THEN 
      'New doctor registration: ' || an.content->>'doctor_name'
    ELSE 
      'Notification: ' || an.id::text
  END AS title,
  CASE 
    WHEN an.type = 'new_doctor_registration' THEN 
      'Doctor ' || an.content->>'doctor_name' || ' (' || an.content->>'doctor_email' || ') has registered'
    ELSE 
      an.content::text
  END AS message
FROM 
  admin_notifications an
ORDER BY 
  an.created_at DESC;
