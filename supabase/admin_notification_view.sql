-- Create a view for the admin dashboard to show pending notifications
-- Requires admin_notification_table.sql to be run first

-- First check if the table exists before creating the view
DO $$
DECLARE
  v_table_exists BOOLEAN;
BEGIN
  -- Check if the admin_notifications table exists
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
  ) INTO v_table_exists;

  -- Only create view if the table exists
  IF v_table_exists THEN
    -- Drop the view if it exists to avoid errors
    EXECUTE 'DROP VIEW IF EXISTS admin_notification_view';
    
    -- Create the view with safe string concatenation using concat() instead of ||
    EXECUTE '
    CREATE VIEW admin_notification_view AS
    SELECT 
      an.id,
      an.type,
      an.content,
      an.related_id,
      an.is_read,
      an.created_at,
      CASE 
        WHEN an.type = ''new_doctor_registration'' THEN 
          concat(''New doctor registration: '', an.content->>''doctor_name'')
        ELSE 
          concat(''Notification: '', an.id::text)
      END AS title,
      CASE 
        WHEN an.type = ''new_doctor_registration'' THEN 
          concat(''Doctor '', an.content->>''doctor_name'', '' ('', an.content->>''doctor_email'', '') has registered'')
        ELSE 
          an.content::text
      END AS message
    FROM 
      admin_notifications an
    ORDER BY 
      an.created_at DESC';
    
    RAISE NOTICE 'admin_notification_view created successfully';
  ELSE
    RAISE WARNING 'admin_notifications table does not exist, view creation skipped';
  END IF;
END
$$;

-- Helper function to get notifications safely
CREATE OR REPLACE FUNCTION public.get_admin_notifications(limit_count INTEGER DEFAULT 10)
RETURNS SETOF jsonb AS $$
DECLARE
  v_result jsonb;
  v_view_exists BOOLEAN;
  v_table_exists BOOLEAN;
BEGIN
  -- Check if the view exists
  SELECT EXISTS (
    SELECT FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'admin_notification_view'
  ) INTO v_view_exists;
  
  -- Check if the table exists
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
  ) INTO v_table_exists;
  
  -- Use view if it exists
  IF v_view_exists THEN
    FOR v_result IN
      EXECUTE 'SELECT jsonb_build_object(
        ''id'', id,
        ''type'', type,
        ''title'', title,
        ''message'', message,
        ''content'', content,
        ''related_id'', related_id,
        ''is_read'', is_read,
        ''created_at'', created_at
      ) FROM admin_notification_view
      ORDER BY created_at DESC
      LIMIT ' || limit_count
    LOOP
      RETURN NEXT v_result;
    END LOOP;
  -- Fall back to table if view doesn't exist but table does
  ELSIF v_table_exists THEN
    FOR v_result IN
      EXECUTE 'SELECT jsonb_build_object(
        ''id'', id,
        ''type'', type,
        ''content'', content,
        ''related_id'', related_id,
        ''is_read'', is_read,
        ''created_at'', created_at,
        ''title'', CASE 
                    WHEN type = ''new_doctor_registration'' THEN 
                      concat(''New doctor registration: '', content->>''doctor_name'')
                    ELSE 
                      concat(''Notification: '', id::text)
                  END,
        ''message'', CASE 
                      WHEN type = ''new_doctor_registration'' THEN 
                        concat(''Doctor '', content->>''doctor_name'', '' ('', content->>''doctor_email'', '') has registered'')
                      ELSE 
                        content::text
                    END
      ) FROM admin_notifications
      ORDER BY created_at DESC
      LIMIT ' || limit_count
    LOOP
      RETURN NEXT v_result;
    END LOOP;
  ELSE
    -- Neither table nor view exists, return empty set
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS boolean AS $$
DECLARE
  v_table_exists BOOLEAN;
BEGIN
  -- Check if the table exists
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'admin_notifications'
  ) INTO v_table_exists;
  
  -- Only try to update if the table exists
  IF v_table_exists THEN
    -- Update notification status
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
    RAISE NOTICE 'Error marking notification as read: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_admin_notifications IS 'Safely get formatted admin notifications';
COMMENT ON FUNCTION public.mark_notification_read IS 'Mark a notification as read';
