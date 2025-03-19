-- Fix for patient_questionnaires table structure
-- Adds the missing user_id, patient_id, and doctor_id columns needed for questionnaire submission

-- ATTEMPT A MORE DIRECT APPROACH TO FIX THE FOREIGN KEY CONSTRAINT
-- 1. First drop all existing foreign key constraints on the table
-- 2. Rebuild the table with the right structure
-- 3. Migrate any existing data

-- Check if table exists first
DO $$
DECLARE
  admin_user_id UUID;
  doctor_user_id UUID;
  constraint_rec RECORD;
BEGIN
  -- First find an admin user ID to use as a fallback for existing records
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE raw_app_meta_data->>'role' = 'admin' 
  LIMIT 1;
  
  -- If no admin found, get any user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  END IF;

  -- Make sure we have a user ID (otherwise the rest is pointless)
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No user accounts found to assign to existing questionnaires';
  END IF;
  
  -- Try to find a doctor user for doctor_id
  SELECT id INTO doctor_user_id 
  FROM auth.users 
  WHERE raw_app_meta_data->>'requestRole' = 'doctor' 
  LIMIT 1;
  
  -- If no doctor found, use admin user
  IF doctor_user_id IS NULL THEN
    doctor_user_id := admin_user_id;
  END IF;

  -- If the table exists, first drop ALL foreign key constraints on it
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patient_questionnaires') THEN
    -- Get all foreign key constraints on the patient_questionnaires table
    FOR constraint_rec IN
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'patient_questionnaires' 
      AND constraint_type = 'FOREIGN KEY'
    LOOP
      EXECUTE 'ALTER TABLE public.patient_questionnaires DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name || ' CASCADE';
      RAISE NOTICE 'Dropped foreign key constraint: %', constraint_rec.constraint_name;
    END LOOP;
    
    -- Direct attempt to drop constraints by name (in case the above approach misses any)
    BEGIN
      ALTER TABLE IF EXISTS public.patient_questionnaires DROP CONSTRAINT IF EXISTS patient_questionnaires_patient_id_fkey CASCADE;
      RAISE NOTICE 'Dropped constraint patient_questionnaires_patient_id_fkey (direct approach)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No constraint named patient_questionnaires_patient_id_fkey found';
    END;
    
    BEGIN
      ALTER TABLE IF EXISTS public.patient_questionnaires DROP CONSTRAINT IF EXISTS patient_questionnaires_doctor_id_fkey CASCADE;
      RAISE NOTICE 'Dropped constraint patient_questionnaires_doctor_id_fkey (direct approach)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'No constraint named patient_questionnaires_doctor_id_fkey found';
    END;
  
    -- Check if columns already exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patient_questionnaires' 
                  AND column_name = 'user_id') THEN
      -- Add the missing user_id column as NULLABLE first
      ALTER TABLE public.patient_questionnaires 
      ADD COLUMN user_id UUID REFERENCES auth.users(id);
      
      -- Update all existing records to have the admin user ID
      UPDATE public.patient_questionnaires 
      SET user_id = admin_user_id
      WHERE user_id IS NULL;
      
      -- Now make the column NOT NULL
      ALTER TABLE public.patient_questionnaires 
      ALTER COLUMN user_id SET NOT NULL;
      
      -- Add comment for documentation
      COMMENT ON COLUMN public.patient_questionnaires.user_id IS 'Reference to the Supabase auth.users table';
      
      -- Create index for performance
      CREATE INDEX IF NOT EXISTS idx_patient_questionnaires_user_id ON public.patient_questionnaires(user_id);

      RAISE NOTICE 'Successfully added user_id column to patient_questionnaires table';
    ELSE
      RAISE NOTICE 'user_id column already exists in patient_questionnaires table';
    END IF;

    -- Check if patient_id column exists (required by existing code)
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patient_questionnaires' 
                  AND column_name = 'patient_id') THEN
      -- Add patient_id column (no foreign key constraint)
      ALTER TABLE public.patient_questionnaires 
      ADD COLUMN patient_id UUID;
      
      -- Update existing records to use user_id as patient_id
      UPDATE public.patient_questionnaires 
      SET patient_id = user_id
      WHERE patient_id IS NULL;
      
      -- Make NOT NULL
      ALTER TABLE public.patient_questionnaires 
      ALTER COLUMN patient_id SET NOT NULL;
      
      RAISE NOTICE 'Successfully added patient_id column to patient_questionnaires table';
    ELSE
      -- Update patient_id to match user_id for any NULL values to ensure data integrity
      UPDATE public.patient_questionnaires 
      SET patient_id = user_id
      WHERE patient_id IS NULL;
      
      RAISE NOTICE 'patient_id column already exists in patient_questionnaires table';
    END IF;
    
    -- Check if doctor_id column exists (required by existing code)
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patient_questionnaires' 
                  AND column_name = 'doctor_id') THEN
      -- Add doctor_id column (no foreign key constraint)
      ALTER TABLE public.patient_questionnaires 
      ADD COLUMN doctor_id UUID;
      
      -- Update existing records to use the doctor_user_id
      UPDATE public.patient_questionnaires 
      SET doctor_id = doctor_user_id
      WHERE doctor_id IS NULL;
      
      -- Make NOT NULL
      ALTER TABLE public.patient_questionnaires 
      ALTER COLUMN doctor_id SET NOT NULL;
      
      RAISE NOTICE 'Successfully added doctor_id column to patient_questionnaires table';
    ELSE
      -- Make sure all records have a doctor_id
      UPDATE public.patient_questionnaires 
      SET doctor_id = doctor_user_id
      WHERE doctor_id IS NULL;
      
      RAISE NOTICE 'doctor_id column already exists in patient_questionnaires table';
    END IF;
    
    -- CRITICAL: Make sure there are NO foreign key constraints on patient_id column
    ALTER TABLE public.patient_questionnaires 
    ALTER COLUMN patient_id DROP NOT NULL;
    
    -- Then re-add NOT NULL constraint after data migration
    UPDATE public.patient_questionnaires 
    SET patient_id = user_id 
    WHERE patient_id IS NULL;
    
    ALTER TABLE public.patient_questionnaires 
    ALTER COLUMN patient_id SET NOT NULL;

    -- Update RLS policy to filter by user_id
    -- First, drop any existing RLS policies on this table
    DROP POLICY IF EXISTS patient_questionnaires_select_policy ON public.patient_questionnaires;
    DROP POLICY IF EXISTS patient_questionnaires_insert_policy ON public.patient_questionnaires;
    DROP POLICY IF EXISTS patient_questionnaires_update_policy ON public.patient_questionnaires;
    
    -- Create new policies that use user_id
    CREATE POLICY patient_questionnaires_select_policy ON public.patient_questionnaires 
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = doctor_id OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'));

    CREATE POLICY patient_questionnaires_insert_policy ON public.patient_questionnaires 
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY patient_questionnaires_update_policy ON public.patient_questionnaires 
      FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = doctor_id OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'));
      
    RAISE NOTICE 'Updated RLS policies to use user_id and doctor_id';
  ELSE
    -- Create the patient_questionnaires table if it doesn't exist (no foreign key constraints on patient_id or doctor_id)
    CREATE TABLE public.patient_questionnaires (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      patient_id UUID NOT NULL, -- Add without foreign key constraint
      doctor_id UUID NOT NULL, -- Add without foreign key constraint
      first_name TEXT,
      last_name TEXT,
      age TEXT,
      race TEXT,
      family_glaucoma BOOLEAN DEFAULT FALSE,
      ocular_steroid BOOLEAN DEFAULT FALSE,
      steroid_type TEXT,
      intravitreal BOOLEAN DEFAULT FALSE,
      intravitreal_type TEXT,
      systemic_steroid BOOLEAN DEFAULT FALSE,
      systemic_steroid_type TEXT,
      iop_baseline BOOLEAN DEFAULT FALSE,
      vertical_asymmetry BOOLEAN DEFAULT FALSE,
      vertical_ratio BOOLEAN DEFAULT FALSE,
      total_score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'Low',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Enable Row Level Security
    ALTER TABLE public.patient_questionnaires ENABLE ROW LEVEL SECURITY;

    -- Create the RLS policies
    CREATE POLICY patient_questionnaires_select_policy ON public.patient_questionnaires 
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = doctor_id OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'));

    CREATE POLICY patient_questionnaires_insert_policy ON public.patient_questionnaires 
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY patient_questionnaires_update_policy ON public.patient_questionnaires 
      FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = doctor_id OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'));

    -- Add indexes
    CREATE INDEX idx_patient_questionnaires_user_id ON public.patient_questionnaires(user_id);
    CREATE INDEX idx_patient_questionnaires_doctor_id ON public.patient_questionnaires(doctor_id);
    CREATE INDEX idx_patient_questionnaires_patient_id ON public.patient_questionnaires(patient_id);
    
    RAISE NOTICE 'Created patient_questionnaires table with proper structure';
  END IF;
END $$;

-- Now create or replace the RPC functions needed for submitting questionnaires

-- Function to insert a new questionnaire with the user_id set automatically
CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
  first_name TEXT,
  last_name TEXT,
  age TEXT,
  race TEXT,
  family_glaucoma BOOLEAN,
  ocular_steroid BOOLEAN,
  steroid_type TEXT,
  intravitreal BOOLEAN,
  intravitreal_type TEXT,
  systemic_steroid BOOLEAN,
  systemic_steroid_type TEXT,
  iop_baseline BOOLEAN,
  vertical_asymmetry BOOLEAN,
  vertical_ratio BOOLEAN,
  total_score INTEGER,
  risk_level TEXT
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  doctor_user_id UUID;
BEGIN
  -- Find a doctor user for doctor_id, or use the current user as fallback
  SELECT id INTO doctor_user_id 
  FROM auth.users 
  WHERE raw_app_meta_data->>'requestRole' = 'doctor' 
  LIMIT 1;
  
  -- If no doctor found, use the current user
  IF doctor_user_id IS NULL THEN
    doctor_user_id := auth.uid();
  END IF;

  -- Insert and capture the returned ID
  INSERT INTO public.patient_questionnaires (
    user_id,
    patient_id,
    doctor_id,
    first_name,
    last_name,
    age,
    race,
    family_glaucoma,
    ocular_steroid,
    steroid_type,
    intravitreal,
    intravitreal_type,
    systemic_steroid,
    systemic_steroid_type,
    iop_baseline,
    vertical_asymmetry,
    vertical_ratio,
    total_score,
    risk_level
  ) VALUES (
    auth.uid(),
    auth.uid(), -- Use current user ID for patient_id
    doctor_user_id, -- Use found doctor or current user for doctor_id
    first_name,
    last_name,
    age,
    race,
    family_glaucoma,
    ocular_steroid,
    steroid_type,
    intravitreal,
    intravitreal_type,
    systemic_steroid,
    systemic_steroid_type,
    iop_baseline,
    vertical_asymmetry,
    vertical_ratio,
    total_score,
    risk_level
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an existing questionnaire
CREATE OR REPLACE FUNCTION public.update_patient_questionnaire(
  questionnaire_id UUID,
  first_name TEXT,
  last_name TEXT,
  age TEXT,
  race TEXT,
  family_glaucoma BOOLEAN,
  ocular_steroid BOOLEAN,
  steroid_type TEXT,
  intravitreal BOOLEAN,
  intravitreal_type TEXT,
  systemic_steroid BOOLEAN,
  systemic_steroid_type TEXT,
  iop_baseline BOOLEAN,
  vertical_asymmetry BOOLEAN,
  vertical_ratio BOOLEAN,
  total_score INTEGER,
  risk_level TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
  current_doctor_id UUID;
BEGIN
  -- Get current doctor_id to preserve it
  SELECT doctor_id INTO current_doctor_id
  FROM public.patient_questionnaires
  WHERE id = questionnaire_id;
  
  -- Update the questionnaire record
  UPDATE public.patient_questionnaires SET
    patient_id = auth.uid(), 
    -- Keep existing doctor_id if found, otherwise use current user
    doctor_id = COALESCE(current_doctor_id, auth.uid()),
    first_name = update_patient_questionnaire.first_name,
    last_name = update_patient_questionnaire.last_name,
    age = update_patient_questionnaire.age,
    race = update_patient_questionnaire.race,
    family_glaucoma = update_patient_questionnaire.family_glaucoma,
    ocular_steroid = update_patient_questionnaire.ocular_steroid,
    steroid_type = update_patient_questionnaire.steroid_type,
    intravitreal = update_patient_questionnaire.intravitreal,
    intravitreal_type = update_patient_questionnaire.intravitreal_type,
    systemic_steroid = update_patient_questionnaire.systemic_steroid,
    systemic_steroid_type = update_patient_questionnaire.systemic_steroid_type,
    iop_baseline = update_patient_questionnaire.iop_baseline,
    vertical_asymmetry = update_patient_questionnaire.vertical_asymmetry,
    vertical_ratio = update_patient_questionnaire.vertical_ratio,
    total_score = update_patient_questionnaire.total_score,
    risk_level = update_patient_questionnaire.risk_level,
    updated_at = now()
  WHERE 
    id = questionnaire_id AND 
    user_id = auth.uid()
  RETURNING 1 INTO updated_count;

  -- Return true if a row was updated, false otherwise
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all questionnaires for the current user
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF public.patient_questionnaires AS $$
BEGIN
  -- Ensure the user requesting the data is either the owner, doctor, or an admin
  IF auth.uid() = user_id_param OR 
     EXISTS (SELECT 1 FROM public.patient_questionnaires WHERE doctor_id = auth.uid() AND user_id = user_id_param) OR
     auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin')
  THEN
    RETURN QUERY
    SELECT * FROM public.patient_questionnaires
    WHERE user_id = user_id_param
    ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied: Not authorized to view this data';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
