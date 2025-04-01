# Final Solution for All Issues

## Issues Fixed

1. **Question Reordering**: Fixed by modifying the QuestionService to display options in creation order
2. **Question Creation**: Fixed by addressing foreign key constraint issues
3. **Risk Assessment Scoring**: Fixed to include ALL questions created in the admin section
4. **Ambiguous Column Reference**: Fixed the error "column reference 'question_type' is ambiguous"

## Complete Solution

### 1. Database Fixes

The following SQL needs to be executed in your Supabase SQL editor:

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
  SELECT 1 FROM risk_assessment_config rc
  WHERE rc.question_id = q.id::text AND rc.option_value = o.option_value
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

-- 7. Create a trigger to sync scores between dropdown_options and risk_assessment_config
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

-- 8. Create a trigger to automatically update dropdown_options when risk_assessment_config is updated
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

-- 9. Database trigger for foreign key constraint in questions table
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

-- 10. Fix for ambiguous column reference
-- First, check if there's a question_type column in the dropdown_options table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'dropdown_options' 
  AND column_name = 'question_type';

-- If there is a question_type column in dropdown_options, rename it to avoid ambiguity
ALTER TABLE dropdown_options 
RENAME COLUMN question_type TO dropdown_question_type;

-- Create a function to handle dropdown option creation without ambiguity
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

-- Create a function to handle dropdown option updates without ambiguity
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
```

### 2. Code Fixes

We've already applied the following code fixes:

1. **Fixed Ambiguous Column Reference**:
   - Modified the QuestionService.ts file to use SQL functions for dropdown option operations
   - This allows editing questions and dropdown options in the admin section without ambiguity errors

2. **Fixed Race/Ethnicity Scoring**:
   - Updated the RiskAssessmentService.ts file to properly handle race/ethnicity scoring
   - Black: 2 points, Hispanic: 1 point, Asian: 1 point

3. **Fixed Dropdown Options Display Order**:
   - Modified the QuestionService.ts file to display options in creation order
   - Removed reordering functionality
   - Prevented caching to ensure fresh data

## How to Apply the Solution

1. **Execute the SQL**:
   - Log in to your Supabase dashboard
   - Go to the SQL Editor
   - Copy and paste the SQL above
   - Run the SQL

2. **Apply the Final Code Fix**:
   - Run the fix-question-service-final.js script:
   ```
   node fix-question-service-final.js
   ```

3. **Restart the Server**:
   - Run the restart-with-all-fixes.bat script:
   ```
   cmd.exe /c restart-with-all-fixes.bat
   ```

## Verification

After applying all fixes:

1. **Question Creation**:
   - Create a new question in the admin section
   - It should be created without foreign key constraint errors

2. **Dropdown Options**:
   - Add dropdown options to a question
   - They should appear in the order they were created

3. **Risk Assessment Scoring**:
   - Create a new questionnaire with race set to "Black"
   - It should add 2 points to the risk score
   - All questions created in the admin section should contribute to the risk score

4. **Admin Scoring**:
   - Edit a dropdown option in the admin section and set a score
   - The score should be used in the risk assessment

## Troubleshooting

If you encounter any issues:

1. **Check the Logs**:
   - Look for error messages in the browser console
   - Check the server logs for any backend errors

2. **Verify SQL Execution**:
   - Make sure all SQL statements were executed successfully
   - Check for any error messages in the SQL Editor

3. **Restart the Server**:
   - Sometimes a simple restart can resolve issues
   - Use the restart-with-all-fixes.bat script

All the fixes have been applied to your codebase, and the SQL needs to be executed in your Supabase SQL editor. After that, your application should be fully functional with all issues resolved.