-- Set is_active to true for all existing questions that don't have it set
UPDATE specialist_questions
SET is_active = true
WHERE is_active IS NULL; 