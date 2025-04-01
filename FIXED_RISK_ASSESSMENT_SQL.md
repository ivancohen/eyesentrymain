# Fixed Risk Assessment SQL

## Error Fixed

The previous SQL had a type mismatch error:
```
ERROR: 42883: operator does not exist: text = uuid
LINE 7: WHERE c.question_id = q.id AND c.option_value = o.option_value
```

This indicates that `question_id` in the `risk_assessment_config` table is a text type, while `id` in the `questions` table is a UUID type.

## Fixed SQL

```sql
-- 1. Fix for patient_id and doctor_id constraint errors
ALTER TABLE IF EXISTS public.patient_questionnaires
ALTER COLUMN patient_id DROP NOT NULL,
ALTER COLUMN doctor_id DROP NOT NULL;

-- 2. Ensure the patient_questionnaires table has the necessary columns for risk scoring
ALTER TABLE IF EXISTS public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Unknown';

-- 3. Create a trigger to automatically add entries to risk_assessment_config when new questions are created
CREATE OR REPLACE FUNCTION add_risk_config_for_new_question()
RETURNS TRIGGER AS $$
BEGIN
  -- For dropdown/select questions, add entries for each option
  IF NEW.question_type = 'select' OR NEW.question_type = 'dropdown' THEN
    -- We'll add the entries when options are created
    NULL;
  ELSE
    -- For other question types, add a default entry
    INSERT INTO risk_assessment_config (question_id, option_value, score)
    VALUES (NEW.id::text, 'yes', 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS add_risk_config_trigger ON questions;
CREATE TRIGGER add_risk_config_trigger
AFTER INSERT ON questions
FOR EACH ROW
EXECUTE FUNCTION add_risk_config_for_new_question();

-- 4. Create a trigger to automatically add entries to risk_assessment_config when new dropdown options are created
CREATE OR REPLACE FUNCTION add_risk_config_for_new_option()
RETURNS TRIGGER AS $$
DECLARE
  question_type TEXT;
BEGIN
  -- Get the question type
  SELECT question_type INTO question_type
  FROM questions
  WHERE id = NEW.question_id;
  
  -- Only add entries for dropdown/select questions
  IF question_type = 'select' OR question_type = 'dropdown' THEN
    -- Add an entry for this option with a default score of 1
    INSERT INTO risk_assessment_config (question_id, option_value, score)
    VALUES (NEW.question_id::text, NEW.option_value, 1)
    ON CONFLICT (question_id, option_value) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS add_risk_config_option_trigger ON dropdown_options;
CREATE TRIGGER add_risk_config_option_trigger
AFTER INSERT ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION add_risk_config_for_new_option();

-- 5. Add missing entries to risk_assessment_config for existing questions and options
INSERT INTO risk_assessment_config (question_id, option_value, score)
SELECT q.id::text, o.option_value, 1
FROM questions q
JOIN dropdown_options o ON q.id = o.question_id
WHERE NOT EXISTS (
  SELECT 1 FROM risk_assessment_config c
  WHERE c.question_id = q.id::text AND c.option_value = o.option_value
)
AND (q.question_type = 'select' OR q.question_type = 'dropdown');

-- 6. Add specific entries for race
INSERT INTO risk_assessment_config (question_id, option_value, score)
VALUES 
('race', 'black', 2),
('race', 'hispanic', 1),
('race', 'asian', 1)
ON CONFLICT (question_id, option_value) DO UPDATE
SET score = EXCLUDED.score;

-- 7. Update the insert_patient_questionnaire function to handle all issues
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
  
  -- Insert the questionnaire with NULL patient_id and doctor_id
  INSERT INTO public.patient_questionnaires (
    user_id,
    patient_id, -- Set to NULL
    doctor_id,  -- Set to NULL
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
    NULL, -- Set doctor_id to NULL
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

-- 8. Database trigger for foreign key constraint in questions table
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

## Changes Made

I've added explicit type casts (`::text`) to convert UUID values to text when comparing with the `question_id` column in the `risk_assessment_config` table:

1. In the `add_risk_config_for_new_question` function:
   ```sql
   VALUES (NEW.id::text, 'yes', 1);
   ```

2. In the `add_risk_config_for_new_option` function:
   ```sql
   VALUES (NEW.question_id::text, NEW.option_value, 1)
   ```

3. In the query to add missing entries:
   ```sql
   SELECT q.id::text, o.option_value, 1
   ...
   WHERE c.question_id = q.id::text AND c.option_value = o.option_value
   ```

These type casts ensure that UUID values are properly converted to text when interacting with the `risk_assessment_config` table.

## How to Apply This Fix

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the entire SQL fix above
4. Run the SQL
5. Restart your application

After applying this fix, all questions created in the admin section will automatically be included in the risk assessment score calculation.