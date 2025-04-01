# SQL Functions and Triggers

Below is the SQL script for creating the necessary functions and triggers to support the new features:

```sql
-- Function to update question order
CREATE OR REPLACE FUNCTION update_question_order(
  question_id UUID,
  new_order INTEGER,
  category TEXT,
  current_order INTEGER
) RETURNS VOID AS $$
BEGIN
  -- If moving down (increasing order)
  IF new_order > current_order THEN
    -- Shift questions in between down
    UPDATE questions
    SET display_order = display_order - 1
    WHERE page_category = category
      AND display_order > current_order
      AND display_order <= new_order;
  -- If moving up (decreasing order)
  ELSIF new_order < current_order THEN
    -- Shift questions in between up
    UPDATE questions
    SET display_order = display_order + 1
    WHERE page_category = category
      AND display_order >= new_order
      AND display_order < current_order;
  END IF;
  
  -- Set the new order for the question
  UPDATE questions
  SET display_order = new_order
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update dropdown option order
CREATE OR REPLACE FUNCTION update_dropdown_option_order(
  option_id UUID,
  new_order INTEGER,
  question_id UUID,
  current_order INTEGER
) RETURNS VOID AS $$
BEGIN
  -- If moving down (increasing order)
  IF new_order > current_order THEN
    -- Shift options in between down
    UPDATE dropdown_options
    SET display_order = display_order - 1
    WHERE question_id = update_dropdown_option_order.question_id
      AND display_order > current_order
      AND display_order <= new_order;
  -- If moving up (decreasing order)
  ELSIF new_order < current_order THEN
    -- Shift options in between up
    UPDATE dropdown_options
    SET display_order = display_order + 1
    WHERE question_id = update_dropdown_option_order.question_id
      AND display_order >= new_order
      AND display_order < current_order;
  END IF;
  
  -- Set the new order for the option
  UPDATE dropdown_options
  SET display_order = new_order
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync risk_assessment_config with dropdown_options
CREATE OR REPLACE FUNCTION sync_dropdown_option_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If score is updated in dropdown_options, update risk_assessment_config
  IF NEW.score IS NOT NULL THEN
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

-- Trigger to sync dropdown_options with risk_assessment_config
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
```

## How to Execute

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL above
4. Run the SQL

This script will:
1. Create functions for updating question and option order
2. Create triggers for syncing risk scores between tables
3. Create triggers for automatically setting display order for new questions and options

After running this script, your database will have the necessary logic to support the new features.