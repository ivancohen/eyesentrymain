-- Add the missing question_text column to match the code
-- First check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'question_text'
    ) THEN
        -- Add the question_text column and populate it with values from the question column
        ALTER TABLE questions ADD COLUMN question_text TEXT;
        UPDATE questions SET question_text = question;
    END IF;
END $$;

-- Grant permissions to service_role
GRANT SELECT, UPDATE, INSERT, DELETE ON questions TO service_role;

-- Create a view that aliases the question column as question_text
-- This is a fallback in case direct column access doesn't work
CREATE OR REPLACE VIEW admin_questions_view AS
SELECT 
    id,
    question,
    question AS question_text,
    created_at,
    created_by,
    question_type,
    has_conditional_items,
    has_dropdown_options,
    has_dropdown_scoring
FROM 
    questions;

-- Grant permissions on the view
GRANT SELECT ON admin_questions_view TO service_role;
