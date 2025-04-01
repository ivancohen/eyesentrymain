# Final SQL Fix

The following SQL has been updated to fix the "column 'question_type' does not exist" error:

```sql
-- 1. Fix for patient_id and doctor_id constraint errors
ALTER TABLE IF EXISTS public.patient_questionnaires
ALTER COLUMN patient_id DROP NOT NULL,
ALTER COLUMN doctor_id DROP NOT NULL;

-- 2. Ensure the patient_questionnaires table has the necessary columns for risk scoring
ALTER TABLE IF EXISTS public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Unknown';

-- 3. Check if question_type column exists in questions table
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'questions'
    AND column_name = 'question_type'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    -- Add question_type column if it doesn't exist
    EXECUTE 'ALTER TABLE questions ADD COLUMN question_type TEXT DEFAULT ''text''';
  END IF;
END $$;

-- 4. Create a trigger to automatically add entries to risk_assessment_config when new questions are created
CREATE OR REPLACE FUNCTION add_risk_config_for_new_question()
RETURNS TRIGGER AS $$
DECLARE
  q_type TEXT;
BEGIN
  -- Get the question type safely
  SELECT COALESCE(question_type, 'text') INTO q_type FROM questions WHERE id = NEW.id;
  
  -- For dropdown/select questions, add entries for each option
  IF q_type = 'select' OR q_type = 'dropdown' THEN
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

-- 5. Create a trigger to automatically add entries to risk_assessment_config when new dropdown options are created
CREATE OR REPLACE FUNCTION add_risk_config_for_new_option()
RETURNS TRIGGER AS $$
DECLARE
  q_type TEXT;
BEGIN
  -- Get the question type safely
  SELECT COALESCE(question_type, 'text') INTO q_type FROM questions WHERE id = NEW.question_id;
  
  -- Only add entries for dropdown/select questions
  IF q_type = 'select' OR q_type = 'dropdown' THEN
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

-- 6. Add missing entries to risk_assessment_config for existing questions and options
INSERT INTO risk_assessment_config (question_id, option_value, score)
SELECT q.id::text, o.option_value, 1
FROM questions q
JOIN dropdown_options o ON q.id = o.question_id
WHERE NOT EXISTS (
  SELECT 1 FROM risk_assessment_config rc
  WHERE rc.question_id = q.id::text AND rc.option_value = o.option_value
);

-- 7. Add specific entries for race
INSERT INTO risk_assessment_config (question_id, option_value, score)
VALUES 
('race', 'black', 2),
('race', 'hispanic', 1),
('race', 'asian', 1)
ON CONFLICT (question_id, option_value) DO UPDATE
SET score = EXCLUDED.score;

-- 8. Create a trigger to sync scores between dropdown_options and risk_assessment_config
CREATE OR REPLACE FUNCTION sync_dropdown_option_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If score is updated in dropdown_options, update risk_assessment_config
  IF NEW.score IS NOT NULL AND (OLD.score IS NULL OR NEW.score != OLD.score) THEN
    INSERT INTO risk_assessment_config (question_id, option_value, score)
    VALUES (NEW.question_id::text, NEW.option_value, NEW.score)
    ON CONFLICT (question_id, option_value) 
    DO UPDATE SET score = EXCLUDED.score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_dropdown_score_trigger ON dropdown_options;
CREATE TRIGGER sync_dropdown_score_trigger
AFTER INSERT OR UPDATE ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION sync_dropdown_option_score();

-- 9. Create a trigger to automatically update dropdown_options when risk_assessment_config is updated
CREATE OR REPLACE FUNCTION sync_risk_config_score()
RETURNS TRIGGER AS $$
DECLARE
  dropdown_id UUID;
BEGIN
  -- Find the corresponding dropdown option
  SELECT id INTO dropdown_id
  FROM dropdown_options
  WHERE question_id::text = NEW.question_id AND option_value = NEW.option_value
  LIMIT 1;
  
  -- If found, update the score
  IF dropdown_id IS NOT NULL THEN
    UPDATE dropdown_options
    SET score = NEW.score
    WHERE id = dropdown_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_risk_config_trigger ON risk_assessment_config;
CREATE TRIGGER sync_risk_config_trigger
AFTER INSERT OR UPDATE ON risk_assessment_config
FOR EACH ROW
EXECUTE FUNCTION sync_risk_config_score();

-- 10. Database trigger for foreign key constraint in questions table
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

-- 11. Create functions to handle dropdown option operations without ambiguity
CREATE OR REPLACE FUNCTION create_dropdown_option(
  option_text TEXT,
  option_value TEXT,
  score INTEGER,
  question_id UUID
) RETURNS JSONB AS $$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  INSERT INTO dropdown_options (
    option_text,
    option_value,
    score,
    question_id
  ) VALUES (
    option_text,
    option_value,
    score,
    question_id
  ) RETURNING id INTO new_id;
  
  SELECT row_to_json(d)::jsonb INTO result
  FROM (SELECT * FROM dropdown_options WHERE id = new_id) d;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle dropdown option updates without ambiguity
CREATE OR REPLACE FUNCTION update_dropdown_option(
  option_id UUID,
  option_text TEXT,
  option_value TEXT,
  score INTEGER
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE dropdown_options
  SET 
    option_text = update_dropdown_option.option_text,
    option_value = update_dropdown_option.option_value,
    score = update_dropdown_option.score
  WHERE id = option_id;
  
  SELECT row_to_json(d)::jsonb INTO result
  FROM (SELECT * FROM dropdown_options WHERE id = option_id) d;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Changes Made

1. Added a check to see if the `question_type` column exists in the `questions` table
2. Added code to create the column if it doesn't exist
3. Modified the triggers to safely get the question type
4. Updated the functions to return JSONB instead of UUID for better compatibility
5. Removed the condition on question_type in the INSERT statement for risk_assessment_config

## How to Apply This Fix

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL above
4. Run the SQL
5. Restart your application

This updated SQL should fix the "column 'question_type' does not exist" error and ensure that all the other fixes work correctly.