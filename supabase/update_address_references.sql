-- =========================================================
-- UPDATE REFERENCES TO OLD FUNCTION
-- =========================================================
-- This script updates references to get_pending_doctors() to use get_pending_doctors_new()
-- Run this after add_address_fields.sql

-- First check if the old function exists and needs to be recreated as a wrapper
DO $$
BEGIN
  -- Check if get_pending_doctors_new exists but get_pending_doctors doesn't
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'get_pending_doctors_new'
  ) AND NOT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'get_pending_doctors'
  ) THEN
    -- Create a wrapper function that calls the new function
    EXECUTE $WRAPPER$
      CREATE OR REPLACE FUNCTION get_pending_doctors()
      RETURNS TABLE (
        id uuid,
        email text,
        name text,
        is_approved boolean,
        created_at timestamp with time zone,
        specialty text,
        phone_number text,
        address text,
        location text,
        state text,
        zip_code text,
        street_address text,
        city text
      ) 
      LANGUAGE sql
      SECURITY DEFINER
      AS $WRAPPER_INNER$
        SELECT
          p.id,
          p.email,
          p.name,
          p.is_approved,
          p.created_at,
          p.specialty,
          p.phone_number,
          p.address,
          p.location,
          p.state,
          p.zip_code,
          p.street_address,
          p.city
        FROM pending_doctor_approvals_no_role p;
      $WRAPPER_INNER$;
    $WRAPPER$;
    
    RAISE NOTICE 'Created wrapper function get_pending_doctors() that uses the view';
  END IF;
END $$;

-- List all objects that might be using the get_pending_doctors function
DO $$
DECLARE
  referencing_object RECORD;
BEGIN
  RAISE NOTICE 'Objects that might reference get_pending_doctors():';
  
  FOR referencing_object IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE 
      n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND pg_get_functiondef(p.oid) LIKE '%get_pending_doctors%'
      AND p.proname != 'get_pending_doctors'
      AND p.proname != 'get_pending_doctors_new'
  LOOP
    RAISE NOTICE 'Found reference in function %.%', 
      referencing_object.schema_name, 
      referencing_object.function_name;
  END LOOP;
END $$;

-- Reminder notice
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'IMPORTANT: Update any code that calls get_pending_doctors()';
  RAISE NOTICE 'Either use get_pending_doctors_new() directly or use the wrapper';
  RAISE NOTICE 'The wrapper is less efficient as it goes through the view';
  RAISE NOTICE '==========================================';
END $$;
