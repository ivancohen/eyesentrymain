-- Create a restore point before making changes
CREATE SCHEMA IF NOT EXISTS restore_points;

-- Create restore point function
CREATE OR REPLACE FUNCTION public.create_questionnaire_restore_point()
RETURNS void AS $$
DECLARE
  timestamp_suffix TEXT;
BEGIN
  -- Generate timestamp suffix
  SELECT TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') INTO timestamp_suffix;
  
  -- Create backup tables with timestamp
  EXECUTE 'CREATE TABLE IF NOT EXISTS restore_points.questions_' || timestamp_suffix || ' AS SELECT * FROM public.questions';
  EXECUTE 'CREATE TABLE IF NOT EXISTS restore_points.dropdown_options_' || timestamp_suffix || ' AS SELECT * FROM public.dropdown_options';
  EXECUTE 'CREATE TABLE IF NOT EXISTS restore_points.patient_questionnaires_' || timestamp_suffix || ' AS SELECT * FROM public.patient_questionnaires';
  
  RAISE NOTICE 'Questionnaire system restore point created with timestamp: %', timestamp_suffix;
  
  -- Return the timestamp for reference
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_questionnaire_restore_point() TO authenticated;

-- Create the restore point
SELECT public.create_questionnaire_restore_point();

-- Add metadata column to patient_questionnaires table if it doesn't exist
ALTER TABLE public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

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

-- Create a function to calculate scores from dropdown options
CREATE OR REPLACE FUNCTION public.calculate_question_score(
  question_id UUID,
  selected_option TEXT
) RETURNS INTEGER AS $$
DECLARE
  score_value INTEGER;
BEGIN
  -- Get the score for the selected option
  SELECT score INTO score_value
  FROM public.dropdown_options
  WHERE question_id = calculate_question_score.question_id
    AND option_value = selected_option;
  
  -- Return 0 if no score found
  RETURN COALESCE(score_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_question_score TO authenticated;

-- Create restore function
CREATE OR REPLACE FUNCTION public.restore_questionnaire_system()
RETURNS void AS $$
DECLARE
  latest_backup RECORD;
BEGIN
  -- Find the latest backup tables
  SELECT table_name INTO latest_backup
  FROM information_schema.tables
  WHERE table_schema = 'restore_points'
    AND table_name LIKE 'questions_%'
  ORDER BY table_name DESC
  LIMIT 1;
  
  IF latest_backup IS NULL THEN
    RAISE EXCEPTION 'No restore points found';
    RETURN;
  END IF;
  
  -- Extract timestamp suffix
  DECLARE
    timestamp_suffix TEXT;
  BEGIN
    timestamp_suffix := SUBSTRING(latest_backup.table_name FROM 'questions_(.*)');
    
    -- Disable triggers temporarily
    ALTER TABLE public.questions DISABLE TRIGGER ALL;
    ALTER TABLE public.dropdown_options DISABLE TRIGGER ALL;
    ALTER TABLE public.patient_questionnaires DISABLE TRIGGER ALL;
    
    -- Clear existing data
    DELETE FROM public.questions;
    DELETE FROM public.dropdown_options;
    
    -- Restore data
    EXECUTE 'INSERT INTO public.questions SELECT * FROM restore_points.questions_' || timestamp_suffix;
    EXECUTE 'INSERT INTO public.dropdown_options SELECT * FROM restore_points.dropdown_options_' || timestamp_suffix;
    
    -- Re-enable triggers
    ALTER TABLE public.questions ENABLE TRIGGER ALL;
    ALTER TABLE public.dropdown_options ENABLE TRIGGER ALL;
    ALTER TABLE public.patient_questionnaires ENABLE TRIGGER ALL;
    
    RAISE NOTICE 'Questionnaire system restored from timestamp: %', timestamp_suffix;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.restore_questionnaire_system() TO authenticated;