-- Add page_category field to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS page_category TEXT;

-- Add default category for existing questions
UPDATE questions 
SET page_category = 'Uncategorized'
WHERE page_category IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN questions.page_category IS 'The page/category this question belongs to in the questionnaire';

-- Grant permissions
GRANT SELECT, UPDATE, INSERT, DELETE ON questions TO service_role;
