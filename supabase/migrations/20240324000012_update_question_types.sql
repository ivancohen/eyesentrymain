-- Drop the existing check constraint
ALTER TABLE specialist_questions
DROP CONSTRAINT IF EXISTS specialist_questions_question_type_check;

-- Add the new check constraint with all question types
ALTER TABLE specialist_questions
ADD CONSTRAINT specialist_questions_question_type_check
CHECK (question_type IN ('text', 'select', 'multiline', 'number')); 