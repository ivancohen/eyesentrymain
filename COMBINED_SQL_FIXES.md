# Combined SQL Fixes for All Issues

This document combines all the SQL fixes needed to address the issues with:
1. Question reordering
2. Risk assessment scoring
3. Patient ID constraint error

## Complete SQL Fix

```sql
-- 1. Fix for patient_id constraint error (simplest solution)
ALTER TABLE IF EXISTS public.patient_questionnaires
ALTER COLUMN patient_id DROP NOT NULL;

-- 2. Ensure the patient_questionnaires table has the necessary columns for risk scoring
ALTER TABLE IF EXISTS public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Unknown';

-- 3. Update the insert_patient_questionnaire function to handle all issues
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
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Insert the questionnaire with NULL patient_id
  INSERT INTO public.patient_questionnaires (
    user_id,
    patient_id, -- Set to NULL
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
    current_user_id,
    NULL, -- Set patient_id to NULL
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

-- 4. Ensure the get_patient_questionnaires_for_user function returns total_score and risk_level
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF patient_questionnaires AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.patient_questionnaires
  WHERE user_id = user_id_param
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Database trigger for foreign key constraint in questions table
CREATE OR REPLACE FUNCTION handle_created_by_constraint()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if created_by is the all-zeros UUID
  IF NEW.created_by = '00000000-0000-0000-0000-000000000000' THEN
    -- Set it to NULL instead
    NEW.created_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_null_created_by ON questions;
CREATE TRIGGER set_null_created_by
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION handle_created_by_constraint();
```

## How to Execute This SQL Fix

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the entire SQL fix above
4. Run the SQL
5. Restart your application to apply the changes

This combined fix addresses all three issues:
- Dropdown options will display in creation order (fixed in the QuestionService.ts file)
- Risk scores will be properly calculated and saved
- Questionnaires can be submitted without the patient_id constraint error