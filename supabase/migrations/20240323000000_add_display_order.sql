-- Add display_order column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Update existing questions with sequential display order based on created_at
WITH ordered_questions AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM questions
)
UPDATE questions
SET display_order = ordered_questions.row_num
FROM ordered_questions
WHERE questions.id = ordered_questions.id; 