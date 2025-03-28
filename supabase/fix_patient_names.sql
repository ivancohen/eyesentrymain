-- Fix patient names not being saved in the database

-- First, check if the metadata column exists in the patient_questionnaires table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_questionnaires'
        AND column_name = 'metadata'
    ) THEN
        -- Add metadata column if it doesn't exist
        ALTER TABLE public.patient_questionnaires
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added metadata column to patient_questionnaires table';
    ELSE
        RAISE NOTICE 'Metadata column already exists in patient_questionnaires table';
    END IF;
END $$;

-- Update the insert_patient_questionnaire function to handle metadata
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
  risk_level TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
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
    risk_level,
    metadata
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
    risk_level,
    metadata
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_patient_questionnaire TO authenticated;

-- Log the update
DO $$
BEGIN
  RAISE NOTICE 'Updated insert_patient_questionnaire function to handle metadata';
END $$;