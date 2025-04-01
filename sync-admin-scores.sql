-- Sync admin-configured scores with risk_assessment_config table

-- 1. Create a trigger to automatically update risk_assessment_config when dropdown options are updated
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

-- 2. Create a trigger to automatically update dropdown_options when risk_assessment_config is updated
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

-- 3. Sync existing scores from dropdown_options to risk_assessment_config
INSERT INTO risk_assessment_config (question_id, option_value, score)
SELECT question_id::text, option_value, score
FROM dropdown_options
WHERE score IS NOT NULL
ON CONFLICT (question_id, option_value) 
DO UPDATE SET score = EXCLUDED.score;

-- 4. Sync existing scores from risk_assessment_config to dropdown_options
UPDATE dropdown_options
SET score = rc.score
FROM risk_assessment_config rc
WHERE dropdown_options.question_id::text = rc.question_id 
  AND dropdown_options.option_value = rc.option_value
  AND (dropdown_options.score IS NULL OR dropdown_options.score != rc.score);
