-- Admin notification helper functions to handle notifications safely
-- These functions avoid issues with non-existent tables or views

-- Helper function to get notifications safely
CREATE OR REPLACE FUNCTION public.get_admin_notifications(limit_count INTEGER DEFAULT 10)
RETURNS SETOF jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
  ) THEN
    -- Table exists, return formatted notifications
    FOR v_result IN
      SELECT jsonb_build_object(
        'id', id,
        'type', type,
        'content', content,
        'related_id', related_id,
        'is_read', is_read,
        'created_at', created_at,
        'title', CASE 
                  WHEN type = 'new_doctor_registration' THEN 
                    concat('New doctor registration: ', content->>'doctor_name')
                  ELSE 
                    concat('Notification: ', id::text)
                END,
        'message', CASE 
                    WHEN type = 'new_doctor_registration' THEN 
                      concat('Doctor ', content->>'doctor_name', ' (', content->>'doctor_email', ') has registered')
                    ELSE 
                      content::text
                  END
      )
      FROM admin_notifications
      ORDER BY created_at DESC
      LIMIT limit_count
    LOOP
      RETURN NEXT v_result;
    END LOOP;
  ELSE
    -- Table doesn't exist, return empty set
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS boolean AS $$
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
  ) THEN
    -- Table exists, mark notification as read
    UPDATE admin_notifications
    SET is_read = TRUE
    WHERE id = notification_id;
    
    RETURN TRUE;
  ELSE
    -- Table doesn't exist
    RETURN FALSE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_admin_notifications IS 'Safely get formatted admin notifications';
COMMENT ON FUNCTION public.mark_notification_read IS 'Mark a notification as read';
