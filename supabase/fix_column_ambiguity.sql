-- Fix for column ambiguity error in update_patient_questionnaire function

-- Drop existing function
DROP FUNCTION IF EXISTS public.update_patient_questionnaire(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, TEXT, BOOLEAN, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, TEXT, JSONB);

-- Create fixed version with qualified column references
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
  has_answers_column BOOLEAN;
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
  
  -- Check if answers column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'patient_questionnaires'
    AND column_name = 'answers'
  ) INTO has_answers_column;
  
  -- Perform the update based on column existence with explicit column qualification
  IF has_answers_column THEN
    -- Update with answers field and explicitly qualified column names
    UPDATE public.patient_questionnaires pq SET
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
      metadata = current_metadata,
      answers = COALESCE(current_metadata->'answers', '{}')::jsonb,
      updated_at = now()
    WHERE 
      pq.id = questionnaire_id
    RETURNING 1 INTO updated_count;
  ELSE
    -- Update without answers field and with explicitly qualified column names
    UPDATE public.patient_questionnaires pq SET
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
      metadata = current_metadata,
      updated_at = now()
    WHERE 
      pq.id = questionnaire_id
    RETURNING 1 INTO updated_count;
  END IF;
  
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_patient_questionnaire TO authenticated;