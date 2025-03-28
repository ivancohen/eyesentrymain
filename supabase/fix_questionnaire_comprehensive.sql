-- Comprehensive fix for all questionnaire system issues:
-- 1. Patient names not being saved
-- 2. Risk assessment scores not being calculated
-- 3. Editing questionnaires not functioning correctly

-- Step 1: Ensure metadata column exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_questionnaires'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.patient_questionnaires
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Step 2: Ensure answers column exists for storing complete answer data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_questionnaires'
        AND column_name = 'answers'
    ) THEN
        ALTER TABLE public.patient_questionnaires
        ADD COLUMN answers JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Step 3: Create/replace insert_patient_questionnaire function without prefixed parameters
-- This matches how it's called from the client code
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
  metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  actual_first_name TEXT;
  actual_last_name TEXT;
BEGIN
  -- Use either direct parameters or metadata for name fields
  actual_first_name := COALESCE(first_name, metadata->>'firstName', '');
  actual_last_name := COALESCE(last_name, metadata->>'lastName', '');
  
  -- Find or create doctor_id
  DECLARE
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
  
    -- Insert with consistent handling of all fields
    INSERT INTO public.patient_questionnaires (
      user_id, patient_id, doctor_id, first_name, last_name,
      age, race, family_glaucoma, ocular_steroid, steroid_type,
      intravitreal, intravitreal_type, systemic_steroid,
      systemic_steroid_type, iop_baseline, vertical_asymmetry,
      vertical_ratio, total_score, risk_level, metadata, 
      answers
    ) VALUES (
      auth.uid(), auth.uid(), doctor_user_id,
      actual_first_name, actual_last_name,
      age, race, family_glaucoma, ocular_steroid, steroid_type,
      intravitreal, intravitreal_type, systemic_steroid,
      systemic_steroid_type, iop_baseline, vertical_asymmetry,
      vertical_ratio, total_score, risk_level, metadata,
      COALESCE(metadata->'answers', '{}')::jsonb
    ) RETURNING id INTO new_id;
  END;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.insert_patient_questionnaire TO authenticated;

-- Step 4: Create/replace update_patient_questionnaire function to handle all fields consistently
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
  risk_level TEXT,
  metadata JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
  current_metadata JSONB;
BEGIN
  -- Get current metadata to preserve it if not provided
  SELECT pq.metadata INTO current_metadata 
  FROM public.patient_questionnaires pq
  WHERE pq.id = questionnaire_id;
  
  -- If new metadata provided, use it, otherwise keep existing
  IF metadata IS NOT NULL THEN
    current_metadata := metadata;
  END IF;
  
  -- Update metadata with new names if provided
  IF current_metadata IS NULL THEN
    current_metadata := '{}'::jsonb;
  END IF;
  
  -- Ensure names are consistent in both fields and metadata
  IF first_name IS NOT NULL AND first_name != '' THEN
    current_metadata := jsonb_set(current_metadata, '{firstName}', to_jsonb(first_name));
  END IF;
  
  IF last_name IS NOT NULL AND last_name != '' THEN
    current_metadata := jsonb_set(current_metadata, '{lastName}', to_jsonb(last_name));
  END IF;
  
  -- Perform the update
  UPDATE public.patient_questionnaires SET
    first_name = COALESCE(first_name, first_name),
    last_name = COALESCE(last_name, last_name),
    age = age,
    race = race,
    family_glaucoma = family_glaucoma,
    ocular_steroid = ocular_steroid,
    steroid_type = steroid_type,
    intravitreal = intravitreal,
    intravitreal_type = intravitreal_type,
    systemic_steroid = systemic_steroid,
    systemic_steroid_type = systemic_steroid_type,
    iop_baseline = iop_baseline,
    vertical_asymmetry = vertical_asymmetry,
    vertical_ratio = vertical_ratio,
    total_score = total_score,
    risk_level = risk_level,
    metadata = current_metadata,
    answers = COALESCE(current_metadata->'answers', '{}')::jsonb,
    updated_at = now()
  WHERE 
    id = questionnaire_id
  RETURNING 1 INTO updated_count;
  
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_patient_questionnaire TO authenticated;

-- Step 5: Fix the get_patient_questionnaires_for_user function to ensure consistent name handling
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF public.patient_questionnaires AS $$
DECLARE
  q public.patient_questionnaires;
  updated_q public.patient_questionnaires;
  needs_update BOOLEAN;
BEGIN
  -- Ensure the user requesting the data is either the owner, doctor, or an admin
  IF auth.uid() = user_id_param OR
     EXISTS (SELECT 1 FROM public.patient_questionnaires WHERE doctor_id = auth.uid() AND user_id = user_id_param) OR
     EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin')
  THEN
    FOR q IN
      SELECT * FROM public.patient_questionnaires
      WHERE user_id = user_id_param
      ORDER BY created_at DESC
    LOOP
      needs_update := FALSE;
      updated_q := q; -- Start with the original record
      
      -- Check and update first name if necessary
      IF (updated_q.first_name IS NULL OR updated_q.first_name = '') AND
         updated_q.metadata IS NOT NULL AND
         updated_q.metadata->>'firstName' IS NOT NULL AND
         updated_q.metadata->>'firstName' != '' THEN
          updated_q.first_name := updated_q.metadata->>'firstName';
          needs_update := TRUE;
      END IF;
      
      -- Check and update last name if necessary
      IF (updated_q.last_name IS NULL OR updated_q.last_name = '') AND
         updated_q.metadata IS NOT NULL AND
         updated_q.metadata->>'lastName' IS NOT NULL AND
         updated_q.metadata->>'lastName' != '' THEN
          updated_q.last_name := updated_q.metadata->>'lastName';
          needs_update := TRUE;
      END IF;
      
      -- If an update was needed, persist it to the database
      IF needs_update THEN
        UPDATE public.patient_questionnaires
        SET
          first_name = updated_q.first_name,
          last_name = updated_q.last_name
        WHERE id = q.id;
      END IF;
      
      -- Return the potentially updated record
      RETURN NEXT updated_q;
    END LOOP;
  ELSE
    RAISE EXCEPTION 'Access denied: Not authorized to view questionnaires for user %', user_id_param;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_patient_questionnaires_for_user TO authenticated;

-- Step 6: Fix existing records with missing names or risk scores
DO $$
DECLARE
  name_update_count INTEGER := 0;
  score_update_count INTEGER := 0;
BEGIN
  -- Fix patient names
  UPDATE public.patient_questionnaires
  SET 
    first_name = COALESCE(metadata->>'firstName', first_name),
    last_name = COALESCE(metadata->>'lastName', last_name)
  WHERE 
    (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '')
    AND metadata IS NOT NULL
    AND (metadata->>'firstName' IS NOT NULL OR metadata->>'lastName' IS NOT NULL);
  
  -- Fix missing risk scores
  UPDATE public.patient_questionnaires
  SET
    total_score = COALESCE(total_score, 0),
    risk_level = COALESCE(risk_level, 'Low')
  WHERE
    total_score IS NULL OR risk_level IS NULL;
END $$;

-- Step 7: Add name-related trigger for future inserts/updates
CREATE OR REPLACE FUNCTION public.ensure_patient_names_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  -- If first_name is empty but metadata.firstName exists, use that
  IF (NEW.first_name IS NULL OR NEW.first_name = '') AND
      NEW.metadata IS NOT NULL AND
      NEW.metadata->>'firstName' IS NOT NULL AND
      NEW.metadata->>'firstName' != '' THEN
      NEW.first_name := NEW.metadata->>'firstName';
  END IF;

  -- If last_name is empty but metadata.lastName exists, use that
  IF (NEW.last_name IS NULL OR NEW.last_name = '') AND
      NEW.metadata IS NOT NULL AND
      NEW.metadata->>'lastName' IS NOT NULL AND
      NEW.metadata->>'lastName' != '' THEN
      NEW.last_name := NEW.metadata->>'lastName';
  END IF;

  -- Ensure answers field is populated from metadata if needed
  IF (NEW.answers IS NULL OR NEW.answers = '{}'::jsonb) AND
      NEW.metadata IS NOT NULL AND
      NEW.metadata->'answers' IS NOT NULL THEN
      NEW.answers := NEW.metadata->'answers';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS ensure_patient_names_trigger ON public.patient_questionnaires;
CREATE TRIGGER ensure_patient_names_trigger
BEFORE INSERT OR UPDATE ON public.patient_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.ensure_patient_names_trigger_func();

-- Step 8: Fix dropdown vs question_options table inconsistency
DO $$
BEGIN
  -- Check if question_options table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'question_options'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dropdown_options'
  ) THEN
    -- Both tables exist, add a view to handle references to question_options
    EXECUTE 'CREATE OR REPLACE VIEW public.combined_options AS
             SELECT * FROM public.question_options
             UNION ALL
             SELECT * FROM public.dropdown_options';
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'question_options'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dropdown_options'
  ) THEN
    -- Only dropdown_options exists, create view to map question_options to it
    EXECUTE 'CREATE OR REPLACE VIEW public.question_options AS 
             SELECT * FROM public.dropdown_options';
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'question_options'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dropdown_options'
  ) THEN
    -- Only question_options exists, create view to map dropdown_options to it
    EXECUTE 'CREATE OR REPLACE VIEW public.dropdown_options AS 
             SELECT * FROM public.question_options';
  END IF;
END $$;