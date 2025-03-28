-- Standardize Question Categories
-- This script standardizes the page_category values in the questions table to ensure
-- they match the expected categories used in the application frontend

BEGIN;

-- Create a function to standardize category names
CREATE OR REPLACE FUNCTION standardize_category(category TEXT) 
RETURNS TEXT AS $$
DECLARE
  standardized TEXT;
BEGIN
  -- Convert to lowercase and trim whitespace
  standardized := LOWER(TRIM(category));
  
  -- Map to standard categories
  IF standardized LIKE '%patient%info%' OR standardized LIKE '%personal%' OR standardized LIKE '%basic%' THEN
    RETURN 'patient_info';
  ELSIF standardized LIKE '%medical%' OR standardized LIKE '%history%' OR standardized LIKE '%medication%' THEN
    RETURN 'medical_history';
  ELSIF standardized LIKE '%clinical%' OR standardized LIKE '%measurement%' THEN
    RETURN 'clinical_measurements';
  ELSE
    RETURN standardized;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Log current state before changes
SELECT 
  page_category, 
  COUNT(*) AS question_count
FROM 
  public.questions
GROUP BY 
  page_category
ORDER BY 
  page_category;

-- Update all questions with standardized categories
UPDATE public.questions
SET page_category = standardize_category(page_category)
WHERE page_category IS NOT NULL;

-- Log state after changes
SELECT 
  page_category, 
  COUNT(*) AS question_count
FROM 
  public.questions
GROUP BY 
  page_category
ORDER BY 
  page_category;

-- Drop the function as it's no longer needed
DROP FUNCTION IF EXISTS standardize_category;

COMMIT;