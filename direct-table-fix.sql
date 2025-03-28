-- DIRECT TABLE FIX FOR RISK ASSESSMENT RECOMMENDATIONS
-- This script directly updates the hardcoded entries in the risk_assessment_advice table
-- to match admin-entered recommendations without using RPC functions

-- Step 1: First, identify the current recommendations in the table
SELECT 
  id, 
  risk_level, 
  min_score, 
  max_score, 
  LEFT(advice, 50) || '...' as advice_preview
FROM 
  risk_assessment_advice
ORDER BY 
  min_score ASC;

-- Step 2: Create a simple function to update hardcoded entries from admin inputs
-- This function doesn't use RPC, just direct table operations
CREATE OR REPLACE FUNCTION sync_recommendations()
RETURNS TEXT AS $$
DECLARE
  rec_count INTEGER := 0;
  low_advice TEXT;
  moderate_advice TEXT;
  high_advice TEXT;
BEGIN
  -- Find the most recent admin entries by risk level
  SELECT advice INTO low_advice 
  FROM risk_assessment_advice 
  WHERE LOWER(risk_level) LIKE '%low%'
  ORDER BY updated_at DESC LIMIT 1;
  
  SELECT advice INTO moderate_advice 
  FROM risk_assessment_advice 
  WHERE LOWER(risk_level) LIKE '%mod%' OR LOWER(risk_level) LIKE '%med%'
  ORDER BY updated_at DESC LIMIT 1;
  
  SELECT advice INTO high_advice 
  FROM risk_assessment_advice 
  WHERE LOWER(risk_level) LIKE '%high%'
  ORDER BY updated_at DESC LIMIT 1;
  
  -- Update the standard "Low" entry with admin-entered advice
  IF low_advice IS NOT NULL THEN
    UPDATE risk_assessment_advice 
    SET advice = low_advice
    WHERE risk_level = 'Low';
    rec_count := rec_count + 1;
  END IF;
  
  -- Update the standard "Moderate" entry with admin-entered advice
  IF moderate_advice IS NOT NULL THEN
    UPDATE risk_assessment_advice 
    SET advice = moderate_advice
    WHERE risk_level = 'Moderate';
    rec_count := rec_count + 1;
  END IF;
  
  -- Update the standard "High" entry with admin-entered advice
  IF high_advice IS NOT NULL THEN
    UPDATE risk_assessment_advice 
    SET advice = high_advice
    WHERE risk_level = 'High';
    rec_count := rec_count + 1;
  END IF;
  
  RETURN 'Updated ' || rec_count || ' standard risk assessment entries.';
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the function to sync current recommendations
SELECT sync_recommendations();

-- Step 4: Verify the updated recommendations
SELECT 
  id, 
  risk_level, 
  min_score, 
  max_score, 
  LEFT(advice, 50) || '...' as advice_preview
FROM 
  risk_assessment_advice
ORDER BY 
  min_score ASC;

-- Step 5: Create a trigger to automatically sync recommendations when updated
CREATE OR REPLACE FUNCTION sync_recommendation_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't run for the standard entries to avoid infinite loops
  IF NEW.risk_level IN ('Low', 'Moderate', 'High') THEN
    RETURN NEW;
  END IF;
  
  -- Sync based on the risk level being updated
  IF LOWER(NEW.risk_level) LIKE '%low%' THEN
    UPDATE risk_assessment_advice 
    SET advice = NEW.advice
    WHERE risk_level = 'Low';
  ELSIF LOWER(NEW.risk_level) LIKE '%mod%' OR LOWER(NEW.risk_level) LIKE '%med%' THEN
    UPDATE risk_assessment_advice 
    SET advice = NEW.advice
    WHERE risk_level = 'Moderate';
  ELSIF LOWER(NEW.risk_level) LIKE '%high%' THEN
    UPDATE risk_assessment_advice 
    SET advice = NEW.advice
    WHERE risk_level = 'High';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_recommendation_trigger ON risk_assessment_advice;
CREATE TRIGGER sync_recommendation_trigger
AFTER INSERT OR UPDATE ON risk_assessment_advice
FOR EACH ROW
EXECUTE FUNCTION sync_recommendation_trigger();

-- Final message
DO $$
BEGIN
  RAISE NOTICE 'DIRECT TABLE FIX COMPLETED: The system will now copy admin-entered recommendations to hardcoded entries.';
END $$;