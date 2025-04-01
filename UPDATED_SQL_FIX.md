# Updated SQL Fix for Patient Questionnaires

Based on the error logs, we need to update our SQL fix to handle the `patient_id` column in the `patient_questionnaires` table. The error is:

```
Error: null value in column "patient_id" of relation "patient_questionnaires" violates not-null constraint
```

## Updated SQL Fix

```sql
-- First, let's check the structure of the patient_questionnaires table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_questionnaires';

-- Update the insert_patient_questionnaire function to handle patient_id
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
  metadata JSONB DEFAULT NULL,
  patient_id UUID DEFAULT NULL -- Add patient_id parameter with default NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  current_user_id UUID;
  actual_patient_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- If patient_id is not provided, try to find a patient with matching name
  IF patient_id IS NULL THEN
    -- Try to find a patient with matching first and last name
    SELECT id INTO actual_patient_id
    FROM patients
    WHERE user_id = current_user_id
      AND first_name = first_name
      AND last_name = last_name
    LIMIT 1;
    
    -- If no patient found, create a new one
    IF actual_patient_id IS NULL THEN
      INSERT INTO patients (
        user_id,
        first_name,
        last_name,
        created_at
      ) VALUES (
        current_user_id,
        first_name,
        last_name,
        NOW()
      ) RETURNING id INTO actual_patient_id;
    END IF;
  ELSE
    actual_patient_id := patient_id;
  END IF;
  
  -- Insert the questionnaire
  INSERT INTO public.patient_questionnaires (
    user_id,
    patient_id, -- Add patient_id
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
    actual_patient_id, -- Use the determined patient_id
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

-- Alternative simpler fix if the above doesn't work:
-- This version modifies the table to make patient_id nullable
ALTER TABLE public.patient_questionnaires
ALTER COLUMN patient_id DROP NOT NULL;

-- Then update the function to handle the nullable patient_id
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
```

## Instructions

1. First, try the first solution that attempts to find or create a patient record
2. If that doesn't work, try the alternative solution that makes the patient_id column nullable
3. After applying either fix, restart your application

This should resolve the "null value in column patient_id" error when submitting questionnaires.