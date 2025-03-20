-- Add unique constraint to prevent duplicate questions
ALTER TABLE questions
ADD CONSTRAINT unique_question_text UNIQUE (question);

-- Update display_order to ensure no duplicates
WITH ordered_questions AS (
  SELECT 
    id,
    page_category,
    ROW_NUMBER() OVER (PARTITION BY page_category ORDER BY display_order, created_at) as new_order
  FROM questions
)
UPDATE questions
SET display_order = ordered_questions.new_order
FROM ordered_questions
WHERE questions.id = ordered_questions.id;

-- Add comment explaining the constraints
COMMENT ON CONSTRAINT unique_question_text ON questions IS 'Prevents duplicate questions in the system'; 