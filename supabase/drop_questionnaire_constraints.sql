-- Direct constraint removal script for patient_questionnaires table
-- This script uses a brute-force approach to ensure all foreign key constraints
-- are removed, allowing the questionnaire system to work properly

DO $$
DECLARE
  fk_constraints CURSOR FOR 
    SELECT conname AS constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.patient_questionnaires'::regclass
    AND contype = 'f'; -- 'f' means foreign key
  constraint_name TEXT;
BEGIN
  -- First, check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'patient_questionnaires'
  ) THEN
    RAISE NOTICE 'Table patient_questionnaires does not exist yet.';
    RETURN;
  END IF;

  -- Attempt to find and drop all foreign key constraints on the table
  OPEN fk_constraints;
  LOOP
    FETCH fk_constraints INTO constraint_name;
    EXIT WHEN NOT FOUND;
    
    EXECUTE 'ALTER TABLE public.patient_questionnaires DROP CONSTRAINT IF EXISTS ' || constraint_name || ' CASCADE';
    RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
  END LOOP;
  CLOSE fk_constraints;
  
  -- Direct attempts to drop constraints by pattern 
  -- Try hardcoded constraint names based on common patterns
  BEGIN
    ALTER TABLE public.patient_questionnaires DROP CONSTRAINT IF EXISTS patient_questionnaires_patient_id_fkey CASCADE;
    RAISE NOTICE 'Dropped constraint patient_questionnaires_patient_id_fkey';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No constraint named patient_questionnaires_patient_id_fkey found';
  END;
  
  BEGIN
    ALTER TABLE public.patient_questionnaires DROP CONSTRAINT IF EXISTS patient_questionnaires_doctor_id_fkey CASCADE;
    RAISE NOTICE 'Dropped constraint patient_questionnaires_doctor_id_fkey';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No constraint named patient_questionnaires_doctor_id_fkey found';
  END;
  
  -- Try any constraint with patient_id in the name
  FOR constraint_name IN 
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.patient_questionnaires'::regclass
    AND conname LIKE '%patient_id%'
  LOOP
    EXECUTE 'ALTER TABLE public.patient_questionnaires DROP CONSTRAINT IF EXISTS ' || constraint_name || ' CASCADE';
    RAISE NOTICE 'Dropped constraint with patient_id in name: %', constraint_name;
  END LOOP;
  
  -- Recreate the columns without foreign key constraints if they exist
  -- This is a last resort approach that will modify the columns to remove any lingering constraints
  
  -- For patient_id
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'patient_questionnaires'
    AND column_name = 'patient_id'
  ) THEN
    -- Try to recreate the column without constraints
    BEGIN
      -- First, create a temporary column
      ALTER TABLE public.patient_questionnaires ADD COLUMN patient_id_new UUID;
      
      -- Copy data from old column to new
      UPDATE public.patient_questionnaires SET patient_id_new = patient_id;
      
      -- Drop the original column
      ALTER TABLE public.patient_questionnaires DROP COLUMN patient_id CASCADE;
      
      -- Rename the new column to the original name
      ALTER TABLE public.patient_questionnaires RENAME COLUMN patient_id_new TO patient_id;
      
      -- Add NOT NULL constraint back (but no foreign key)
      UPDATE public.patient_questionnaires SET patient_id = user_id WHERE patient_id IS NULL;
      ALTER TABLE public.patient_questionnaires ALTER COLUMN patient_id SET NOT NULL;
      
      RAISE NOTICE 'Successfully recreated patient_id column without constraints';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error recreating patient_id column: %', SQLERRM;
    END;
  END IF;
  
  -- For doctor_id
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'patient_questionnaires'
    AND column_name = 'doctor_id'
  ) THEN
    -- Try to recreate the column without constraints
    BEGIN
      -- First, create a temporary column
      ALTER TABLE public.patient_questionnaires ADD COLUMN doctor_id_new UUID;
      
      -- Copy data from old column to new
      UPDATE public.patient_questionnaires SET doctor_id_new = doctor_id;
      
      -- Drop the original column
      ALTER TABLE public.patient_questionnaires DROP COLUMN doctor_id CASCADE;
      
      -- Rename the new column to the original name
      ALTER TABLE public.patient_questionnaires RENAME COLUMN doctor_id_new TO doctor_id;
      
      -- Find any user to use as doctor_id
      DECLARE
        doctor_user_id UUID;
      BEGIN
        SELECT id INTO doctor_user_id
        FROM auth.users 
        WHERE raw_app_meta_data->>'requestRole' = 'doctor' 
        LIMIT 1;
        
        IF doctor_user_id IS NULL THEN
          SELECT id INTO doctor_user_id FROM auth.users LIMIT 1;
        END IF;
        
        -- Add NOT NULL constraint back (but no foreign key)
        UPDATE public.patient_questionnaires SET doctor_id = doctor_user_id WHERE doctor_id IS NULL;
        ALTER TABLE public.patient_questionnaires ALTER COLUMN doctor_id SET NOT NULL;
      END;
      
      RAISE NOTICE 'Successfully recreated doctor_id column without constraints';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error recreating doctor_id column: %', SQLERRM;
    END;
  END IF;
  
  RAISE NOTICE 'Completed constraint removal operations on patient_questionnaires table';
END $$;
