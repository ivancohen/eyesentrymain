-- Fix for ambiguous column reference in dropdown_options table

-- 1. First, let's check if there's a question_type column in the dropdown_options table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'dropdown_options' 
  AND column_name = 'question_type';

-- 2. If there is a question_type column in dropdown_options, rename it to avoid ambiguity
ALTER TABLE dropdown_options 
RENAME COLUMN question_type TO dropdown_question_type;

-- 3. Create a function to handle dropdown option creation without ambiguity
CREATE OR REPLACE FUNCTION create_dropdown_option(
  option_text TEXT,
  option_value TEXT,
  score INTEGER,
  question_id UUID
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
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
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to handle dropdown option updates without ambiguity
CREATE OR REPLACE FUNCTION update_dropdown_option(
  option_id UUID,
  option_text TEXT,
  option_value TEXT,
  score INTEGER
) RETURNS UUID AS $$
BEGIN
  UPDATE dropdown_options
  SET 
    option_text = update_dropdown_option.option_text,
    option_value = update_dropdown_option.option_value,
    score = update_dropdown_option.score
  WHERE id = option_id;
  
  RETURN option_id;
END;
$$ LANGUAGE plpgsql;