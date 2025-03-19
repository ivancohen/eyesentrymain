-- Create a function to add the page_category column if it doesn't exist
-- This function can be called from JS
CREATE OR REPLACE FUNCTION alter_question_table_add_category()
RETURNS void AS $$
BEGIN
  -- Check if page_category column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'questions'
      AND column_name = 'page_category'
  ) THEN
    -- Add the page_category column if it doesn't exist
    EXECUTE 'ALTER TABLE questions ADD COLUMN page_category TEXT';
    
    -- Add default category for existing questions
    EXECUTE 'UPDATE questions SET page_category = ''uncategorized'' WHERE page_category IS NULL';
    
    -- Add comment to document the field
    EXECUTE 'COMMENT ON COLUMN questions.page_category IS ''The page/category this question belongs to in the questionnaire''';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION alter_question_table_add_category() TO authenticated;
GRANT EXECUTE ON FUNCTION alter_question_table_add_category() TO service_role;
