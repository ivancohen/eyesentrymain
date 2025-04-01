# SQL Fixes to Copy to Supabase

Below are the SQL fixes that need to be executed in your Supabase SQL editor. You can copy and paste these directly.

## 1. Risk Assessment Scoring Fix

```sql
-- Ensure the patient_questionnaires table has the necessary columns
ALTER TABLE IF EXISTS public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Unknown';

-- Update the insert_patient_questionnaire function to properly handle risk scores
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
  
  -- Insert the questionnaire
  INSERT INTO public.patient_questionnaires (
    user_id,
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

-- Ensure the get_patient_questionnaires_for_user function returns total_score and risk_level
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
```

## 2. Database Trigger for Foreign Key Constraint

```sql
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

## How to Execute These SQL Fixes

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste each SQL fix separately
4. Run the SQL
5. Restart your application to apply the changes

These fixes will address both the risk assessment scoring issue and the foreign key constraint issue with question creation.