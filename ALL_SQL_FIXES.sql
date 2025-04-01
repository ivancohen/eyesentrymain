-- Comprehensive SQL Fixes for EyeSentry Patient Questionnaire System
-- Execute this entire script in your Supabase SQL Editor.

-- Step 1: Schema Updates
-- Add missing columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conditional_parent_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_required_value TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_display_mode TEXT DEFAULT 'hide';

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_questions_display_order 
ON questions(page_category, display_order);

-- Add display_order column to dropdown_options
ALTER TABLE dropdown_options
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order 
ON dropdown_options(question_id, display_order);

-- Ensure risk_assessment_config has all needed columns
CREATE TABLE IF NOT EXISTS risk_assessment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  option_value TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, option_value)
);

-- Initialize display_order for existing questions
WITH ordered_questions AS (
  SELECT 
    id, 
    page_category,
    ROW_NUMBER() OVER (PARTITION BY page_category ORDER BY created_at) AS row_num
  FROM questions
)
UPDATE questions q
SET display_order = oq.row_num
FROM ordered_questions oq
WHERE q.id = oq.id
  AND (q.display_order IS NULL OR q.display_order = 0);

-- Initialize display_order for existing dropdown options
WITH ordered_options AS (
  SELECT 
    id, 
    question_id,
    ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at) AS row_num
  FROM dropdown_options
)
UPDATE dropdown_options o
SET display_order = oo.row_num
FROM ordered_options oo
WHERE o.id = oo.id
  AND (o.display_order IS NULL OR o.display_order = 0);

-- Initialize risk_assessment_config with existing scores from dropdown_options
INSERT INTO risk_assessment_config (question_id, option_value, score)
SELECT 
  question_id::text, 
  option_value, 
  COALESCE(score, 0)
FROM dropdown_options
WHERE score IS NOT NULL
ON CONFLICT (question_id, option_value) DO NOTHING;

-- Add specific entries for race (Admin can edit these later)
INSERT INTO risk_assessment_config (question_id, option_value, score)
VALUES 
('race', 'black', 2),
('race', 'hispanic', 1),
('race', 'asian', 1)
ON CONFLICT (question_id, option_value) DO UPDATE
SET score = EXCLUDED.score;

-- Add specific entries for other known risk factors (Admin can edit these later)
INSERT INTO risk_assessment_config (question_id, option_value, score)
VALUES 
('familyGlaucoma', 'yes', 2),
('ocularSteroid', 'yes', 2),
('intravitreal', 'yes', 2),
('systemicSteroid', 'yes', 2),
('iopBaseline', '22_and_above', 2),
('verticalAsymmetry', '0.2_and_above', 2),
('verticalRatio', '0.6_and_above', 2)
ON CONFLICT (question_id, option_value) DO UPDATE
SET score = EXCLUDED.score;

-- Step 2: Functions and Triggers
-- Function to update question order
-- Drop the function first to allow parameter name changes if necessary
DROP FUNCTION IF EXISTS update_question_order(uuid, integer, text, integer);
CREATE OR REPLACE FUNCTION update_question_order(
  p_question_id UUID,
  p_new_order INTEGER,
  p_category TEXT,
  p_current_order INTEGER
) RETURNS VOID AS $$
BEGIN
  -- If moving down (increasing order)
  IF p_new_order > p_current_order THEN
    -- Shift questions in between down
    UPDATE questions
    SET display_order = display_order - 1
    WHERE page_category = p_category
      AND display_order > p_current_order
      AND display_order <= p_new_order;
  -- If moving up (decreasing order)
  ELSIF p_new_order < p_current_order THEN
    -- Shift questions in between up
    UPDATE questions
    SET display_order = display_order + 1
    WHERE page_category = p_category
      AND display_order >= p_new_order
      AND display_order < p_current_order;
  END IF;
  
  -- Set the new order for the question
  UPDATE questions
  SET display_order = p_new_order
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update dropdown option order
-- Drop the function first to allow parameter name changes if necessary
DROP FUNCTION IF EXISTS update_dropdown_option_order(uuid, integer, uuid, integer);
CREATE OR REPLACE FUNCTION update_dropdown_option_order(
  p_option_id UUID,
  p_new_order INTEGER,
  p_question_id UUID,
  p_current_order INTEGER
) RETURNS VOID AS $$
BEGIN
  -- If moving down (increasing order)
  IF p_new_order > p_current_order THEN
    -- Shift options in between down
    UPDATE dropdown_options
    SET display_order = display_order - 1
    WHERE question_id = p_question_id
      AND display_order > p_current_order
      AND display_order <= p_new_order;
  -- If moving up (decreasing order)
  ELSIF p_new_order < p_current_order THEN
    -- Shift options in between up
    UPDATE dropdown_options
    SET display_order = display_order + 1
    WHERE question_id = p_question_id
      AND display_order >= p_new_order
      AND display_order < p_current_order;
  END IF;
  
  -- Set the new order for the option
  UPDATE dropdown_options
  SET display_order = p_new_order
  WHERE id = p_option_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync risk_assessment_config with dropdown_options (Prevents Recursion)
CREATE OR REPLACE FUNCTION sync_dropdown_option_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If score is updated in dropdown_options, update risk_assessment_config
  -- Only update if the score actually changed
  IF NEW.score IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.score IS DISTINCT FROM OLD.score) THEN
    INSERT INTO risk_assessment_config (question_id, option_value, score)
    VALUES (NEW.question_id::text, NEW.option_value, NEW.score)
    ON CONFLICT (question_id, option_value) 
    DO UPDATE SET score = EXCLUDED.score
    -- Add a condition to prevent updating if the score is already the same
    WHERE risk_assessment_config.score IS DISTINCT FROM EXCLUDED.score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_dropdown_score_trigger ON dropdown_options;
CREATE TRIGGER sync_dropdown_score_trigger
AFTER INSERT OR UPDATE ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION sync_dropdown_option_score();

-- Trigger to sync dropdown_options with risk_assessment_config (Prevents Recursion)
CREATE OR REPLACE FUNCTION sync_risk_config_score()
RETURNS TRIGGER AS $$
DECLARE
  dropdown_id UUID;
  current_score INTEGER;
BEGIN
  -- Find the corresponding dropdown option and its current score
  SELECT id, score INTO dropdown_id, current_score
  FROM dropdown_options
  WHERE question_id::text = NEW.question_id AND option_value = NEW.option_value
  LIMIT 1;
  
  -- If found and the score is different, update the score
  IF dropdown_id IS NOT NULL AND NEW.score IS DISTINCT FROM current_score THEN
    UPDATE dropdown_options
    SET score = NEW.score
    WHERE id = dropdown_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_risk_config_trigger ON risk_assessment_config;
CREATE TRIGGER sync_risk_config_trigger
AFTER INSERT OR UPDATE ON risk_assessment_config
FOR EACH ROW
EXECUTE FUNCTION sync_risk_config_score();

-- Trigger to set display_order for new questions
CREATE OR REPLACE FUNCTION set_question_display_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- If display_order is not set, set it to max + 1
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM questions
    WHERE page_category = NEW.page_category;
    
    NEW.display_order := max_order + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_question_display_order_trigger ON questions;
CREATE TRIGGER set_question_display_order_trigger
BEFORE INSERT ON questions
FOR EACH ROW
EXECUTE FUNCTION set_question_display_order();

-- Trigger to set display_order for new dropdown options
CREATE OR REPLACE FUNCTION set_dropdown_option_display_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- If display_order is not set, set it to max + 1
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM dropdown_options
    WHERE question_id = NEW.question_id;
    
    NEW.display_order := max_order + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_dropdown_option_display_order_trigger ON dropdown_options;
CREATE TRIGGER set_dropdown_option_display_order_trigger
BEFORE INSERT ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION set_dropdown_option_display_order();

-- Step 3: Fix Update Dropdown Function
-- Drop the existing function first (handle potential parameter name change error)
DROP FUNCTION IF EXISTS update_dropdown_option(uuid, text, text, integer);

-- Update the function to handle dropdown option updates without ambiguity
CREATE OR REPLACE FUNCTION update_dropdown_option(
  p_option_id UUID,
  p_option_text TEXT,
  p_option_value TEXT,
  p_score INTEGER
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE dropdown_options
  SET 
    option_text = p_option_text,
    option_value = p_option_value,
    score = p_score
  WHERE id = p_option_id;
  
  -- Return the updated row as JSONB
  SELECT row_to_json(d)::jsonb INTO result
  FROM (SELECT * FROM dropdown_options WHERE id = p_option_id) d;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Fix Create Dropdown Function (Optional, but good practice)
-- Drop the existing function if it exists with old signature
DROP FUNCTION IF EXISTS create_dropdown_option(text, text, integer, uuid);

-- Create function to handle dropdown option creation without ambiguity
CREATE OR REPLACE FUNCTION create_dropdown_option(
  p_option_text TEXT,
  p_option_value TEXT,
  p_score INTEGER,
  p_question_id UUID
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
    p_option_text,
    p_option_value,
    p_score,
    p_question_id
  ) RETURNING id INTO new_id;
  
  -- Return the created row as JSONB
  SELECT row_to_json(d)::jsonb INTO result
  FROM (SELECT * FROM dropdown_options WHERE id = new_id) d;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Fix handle_created_by_constraint trigger (if needed, included for completeness)
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

-- Step 6: Fix insert_patient_questionnaire function (if needed, included for completeness)
-- Drop existing function if signature changed
DROP FUNCTION IF EXISTS public.insert_patient_questionnaire(text, text, text, text, boolean, boolean, text, boolean, text, boolean, text, boolean, boolean, boolean, integer, text, jsonb);

CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
  p_first_name TEXT,
  p_last_name TEXT,
  p_age TEXT,
  p_race TEXT,
  p_family_glaucoma BOOLEAN,
  p_ocular_steroid BOOLEAN,
  p_steroid_type TEXT,
  p_intravitreal BOOLEAN,
  p_intravitreal_type TEXT,
  p_systemic_steroid BOOLEAN,
  p_systemic_steroid_type TEXT,
  p_iop_baseline BOOLEAN,
  p_vertical_asymmetry BOOLEAN,
  p_vertical_ratio BOOLEAN,
  p_total_score INTEGER,
  p_risk_level TEXT,
  p_metadata JSONB DEFAULT NULL
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
    p_first_name,
    p_last_name,
    p_age,
    p_race,
    p_family_glaucoma,
    p_ocular_steroid,
    p_steroid_type,
    p_intravitreal,
    p_intravitreal_type,
    p_systemic_steroid,
    p_systemic_steroid_type,
    p_iop_baseline,
    p_vertical_asymmetry,
    p_vertical_ratio,
    p_total_score,
    p_risk_level,
    p_metadata
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Fix get_patient_questionnaires_for_user function (if needed, included for completeness)
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

-- Final check: Ensure question_type column exists in questions table
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