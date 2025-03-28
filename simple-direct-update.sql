-- SIMPLE DIRECT UPDATE FOR RISK ASSESSMENT RECOMMENDATIONS
-- This script directly updates hardcoded entries without creating any functions or triggers
-- Avoids potential conflicts with existing database functions

-- Step 1: View current recommendations
SELECT id, risk_level, min_score, max_score, LEFT(advice, 50) || '...' as advice_preview
FROM risk_assessment_advice
ORDER BY min_score ASC;

-- Step 2: Find admin-entered recommendations for each risk level
WITH admin_recommendations AS (
  SELECT 
    CASE 
      WHEN LOWER(risk_level) LIKE '%low%' THEN 'Low'
      WHEN LOWER(risk_level) LIKE '%mod%' OR LOWER(risk_level) LIKE '%med%' THEN 'Moderate'
      WHEN LOWER(risk_level) LIKE '%high%' THEN 'High'
      ELSE risk_level
    END AS normalized_risk_level,
    advice,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        CASE 
          WHEN LOWER(risk_level) LIKE '%low%' THEN 'Low'
          WHEN LOWER(risk_level) LIKE '%mod%' OR LOWER(risk_level) LIKE '%med%' THEN 'Moderate'
          WHEN LOWER(risk_level) LIKE '%high%' THEN 'High'
          ELSE risk_level
        END
      ORDER BY updated_at DESC
    ) AS rank
  FROM 
    risk_assessment_advice
  WHERE 
    advice IS NOT NULL AND advice != ''
)
SELECT normalized_risk_level, advice
FROM admin_recommendations
WHERE rank = 1;

-- Step 3: Update Low risk entry with admin-entered recommendation
UPDATE risk_assessment_advice AS target
SET advice = source.advice
FROM (
  SELECT advice
  FROM risk_assessment_advice
  WHERE LOWER(risk_level) LIKE '%low%'
  ORDER BY updated_at DESC
  LIMIT 1
) AS source
WHERE target.risk_level = 'Low'
  AND source.advice IS NOT NULL
  AND source.advice != '';

-- Step 4: Update Moderate risk entry with admin-entered recommendation
UPDATE risk_assessment_advice AS target
SET advice = source.advice
FROM (
  SELECT advice
  FROM risk_assessment_advice
  WHERE LOWER(risk_level) LIKE '%mod%' OR LOWER(risk_level) LIKE '%med%'
  ORDER BY updated_at DESC
  LIMIT 1
) AS source
WHERE target.risk_level = 'Moderate'
  AND source.advice IS NOT NULL
  AND source.advice != '';

-- Step 5: Update High risk entry with admin-entered recommendation
UPDATE risk_assessment_advice AS target
SET advice = source.advice
FROM (
  SELECT advice
  FROM risk_assessment_advice
  WHERE LOWER(risk_level) LIKE '%high%'
  ORDER BY updated_at DESC
  LIMIT 1
) AS source
WHERE target.risk_level = 'High'
  AND source.advice IS NOT NULL
  AND source.advice != '';

-- Step 6: View updated recommendations
SELECT id, risk_level, min_score, max_score, LEFT(advice, 50) || '...' as advice_preview
FROM risk_assessment_advice
ORDER BY min_score ASC;

-- Message about ongoing updates
COMMENT ON TABLE risk_assessment_advice IS 'Contains risk assessment advice. For admin-entered recommendations to appear in doctor view, run the simple-direct-update.sql script after making changes.';