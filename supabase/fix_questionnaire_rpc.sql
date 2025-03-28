-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_patient_questionnaire;

-- Create the improved version that properly updates all fields
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
  iop_baseline TEXT,
  vertical_asymmetry TEXT,
  vertical_ratio TEXT,
  total_score INTEGER,
  risk_level TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  questionnaire_owner_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If not authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the questionnaire exists and get the owner_id
  SELECT owner_id INTO questionnaire_owner_id
  FROM patient_questionnaires
  WHERE id = questionnaire_id;
  
  -- If questionnaire doesn't exist or user is not the owner, return false
  IF questionnaire_owner_id IS NULL OR questionnaire_owner_id != current_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Update the questionnaire
  UPDATE patient_questionnaires
  SET 
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
    updated_at = NOW()
  WHERE 
    id = questionnaire_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_patient_questionnaire TO authenticated;

-- Create a new version of the function that accepts a custom_data JSON parameter
CREATE OR REPLACE FUNCTION public.update_patient_questionnaire_with_data(
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
  iop_baseline TEXT,
  vertical_asymmetry TEXT,
  vertical_ratio TEXT,
  total_score INTEGER,
  risk_level TEXT,
  custom_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  questionnaire_owner_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If not authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the questionnaire exists and get the owner_id
  SELECT owner_id INTO questionnaire_owner_id
  FROM patient_questionnaires
  WHERE id = questionnaire_id;
  
  -- If questionnaire doesn't exist or user is not the owner, return false
  IF questionnaire_owner_id IS NULL OR questionnaire_owner_id != current_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Update the questionnaire
  UPDATE patient_questionnaires
  SET 
    first_name = update_patient_questionnaire_with_data.first_name,
    last_name = update_patient_questionnaire_with_data.last_name,
    age = update_patient_questionnaire_with_data.age,
    race = update_patient_questionnaire_with_data.race,
    family_glaucoma = update_patient_questionnaire_with_data.family_glaucoma,
    ocular_steroid = update_patient_questionnaire_with_data.ocular_steroid,
    steroid_type = update_patient_questionnaire_with_data.steroid_type,
    intravitreal = update_patient_questionnaire_with_data.intravitreal,
    intravitreal_type = update_patient_questionnaire_with_data.intravitreal_type,
    systemic_steroid = update_patient_questionnaire_with_data.systemic_steroid,
    systemic_steroid_type = update_patient_questionnaire_with_data.systemic_steroid_type,
    iop_baseline = update_patient_questionnaire_with_data.iop_baseline,
    vertical_asymmetry = update_patient_questionnaire_with_data.vertical_asymmetry,
    vertical_ratio = update_patient_questionnaire_with_data.vertical_ratio,
    total_score = update_patient_questionnaire_with_data.total_score,
    risk_level = update_patient_questionnaire_with_data.risk_level,
    metadata = update_patient_questionnaire_with_data.custom_data,
    updated_at = NOW()
  WHERE 
    id = questionnaire_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_patient_questionnaire_with_data TO authenticated;

-- Create a risk assessment advice table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.risk_assessment_advice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT NOT NULL,
  advice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default advice if none exists
INSERT INTO public.risk_assessment_advice (risk_level, advice)
SELECT 'Low', 'Low risk of glaucoma. Regular eye exams recommended every 2 years.'
WHERE NOT EXISTS (SELECT 1 FROM public.risk_assessment_advice WHERE risk_level = 'Low');

INSERT INTO public.risk_assessment_advice (risk_level, advice)
SELECT 'Moderate', 'Moderate risk of glaucoma. Regular eye exams recommended every year.'
WHERE NOT EXISTS (SELECT 1 FROM public.risk_assessment_advice WHERE risk_level = 'Moderate');

INSERT INTO public.risk_assessment_advice (risk_level, advice)
SELECT 'High', 'High risk of glaucoma. Regular eye exams recommended every 6 months.'
WHERE NOT EXISTS (SELECT 1 FROM public.risk_assessment_advice WHERE risk_level = 'High');

-- Grant access to authenticated users
ALTER TABLE public.risk_assessment_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read risk_assessment_advice" 
ON public.risk_assessment_advice 
FOR SELECT 
USING (true);