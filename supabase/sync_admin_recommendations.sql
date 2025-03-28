-- SYNC ADMIN RECOMMENDATIONS TO HARDCODED DATABASE ENTRIES
-- This script creates a trigger that automatically updates the hardcoded 
-- risk_assessment_advice entries whenever admin changes recommendations
-- This ensures recommendations entered in admin panel appear in doctor view

-- First, identify which entries are hardcoded based on their IDs
-- We'll create a view to make this easier to reference
CREATE OR REPLACE VIEW vw_hardcoded_advice AS
SELECT * FROM risk_assessment_advice
WHERE risk_level IN ('Low', 'Moderate', 'High');

-- Create a function that will sync recommendations from admin input to hardcoded entries
-- This will be called by a trigger whenever recommendations are updated
CREATE OR REPLACE FUNCTION sync_admin_recommendations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the hardcoded entry for the same risk level
    -- Match based on normalized risk level text
    UPDATE risk_assessment_advice 
    SET 
        advice = NEW.advice,
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        LOWER(risk_level) = LOWER(NEW.risk_level) OR
        (LOWER(risk_level) = 'low' AND LOWER(NEW.risk_level) LIKE '%low%') OR
        (LOWER(risk_level) = 'moderate' AND (LOWER(NEW.risk_level) LIKE '%mod%' OR LOWER(NEW.risk_level) LIKE '%med%')) OR
        (LOWER(risk_level) = 'high' AND LOWER(NEW.risk_level) LIKE '%high%');
    
    -- Log the synchronization for debugging
    RAISE NOTICE 'Synced recommendation for % to hardcoded entry', NEW.risk_level;
    
    -- Continue with the original insert/update
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs after inserts or updates on risk_assessment_advice
-- This will automatically sync any changes made through the admin panel
DROP TRIGGER IF EXISTS sync_admin_recommendations_trigger ON risk_assessment_advice;

CREATE TRIGGER sync_admin_recommendations_trigger
AFTER INSERT OR UPDATE ON risk_assessment_advice
FOR EACH ROW
WHEN (NEW.risk_level IS NOT NULL)
EXECUTE FUNCTION sync_admin_recommendations();

-- One-time function to sync existing recommendations from admin entries to hardcoded entries
-- This catches up any existing recommendation text
CREATE OR REPLACE FUNCTION sync_all_recommendations()
RETURNS TEXT AS $$
DECLARE
    low_advice TEXT := NULL;
    moderate_advice TEXT := NULL;
    high_advice TEXT := NULL;
    records_updated INTEGER := 0;
BEGIN
    -- Get the latest advice for each risk level from non-hardcoded entries
    SELECT advice INTO low_advice FROM risk_assessment_advice
    WHERE LOWER(risk_level) LIKE '%low%'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    SELECT advice INTO moderate_advice FROM risk_assessment_advice
    WHERE LOWER(risk_level) LIKE '%mod%' OR LOWER(risk_level) LIKE '%med%'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    SELECT advice INTO high_advice FROM risk_assessment_advice
    WHERE LOWER(risk_level) LIKE '%high%'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Update hardcoded Low entry if we found advice
    IF low_advice IS NOT NULL THEN
        UPDATE risk_assessment_advice 
        SET advice = low_advice, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(risk_level) = 'low';
        records_updated := records_updated + 1;
    END IF;
    
    -- Update hardcoded Moderate entry if we found advice
    IF moderate_advice IS NOT NULL THEN
        UPDATE risk_assessment_advice 
        SET advice = moderate_advice, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(risk_level) = 'moderate';
        records_updated := records_updated + 1;
    END IF;
    
    -- Update hardcoded High entry if we found advice
    IF high_advice IS NOT NULL THEN
        UPDATE risk_assessment_advice 
        SET advice = high_advice, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(risk_level) = 'high';
        records_updated := records_updated + 1;
    END IF;
    
    RETURN 'Synchronized ' || records_updated || ' hardcoded recommendation entries.';
END;
$$ LANGUAGE plpgsql;

-- Execute the one-time sync to update existing recommendations
SELECT sync_all_recommendations();

-- Check the results
SELECT 
    risk_level,
    min_score,
    max_score,
    SUBSTRING(advice, 1, 50) || '...' AS advice_preview,
    updated_at
FROM 
    risk_assessment_advice
ORDER BY
    CASE 
        WHEN LOWER(risk_level) = 'low' THEN 1
        WHEN LOWER(risk_level) = 'moderate' THEN 2
        WHEN LOWER(risk_level) = 'high' THEN 3
        ELSE 4
    END;