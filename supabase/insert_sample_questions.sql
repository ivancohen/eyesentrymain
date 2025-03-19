-- Insert sample questions for testing
INSERT INTO questions (id, question, question_type, created_at, created_by, has_conditional_items, has_dropdown_options, has_dropdown_scoring)
VALUES 
  (gen_random_uuid(), 'Do you have a history of glaucoma?', 'dropdown', NOW(), gen_random_uuid(), false, true, true),
  (gen_random_uuid(), 'Have you experienced eye pressure or discomfort?', 'dropdown', NOW(), gen_random_uuid(), false, true, true),
  (gen_random_uuid(), 'Are you currently using eye drops?', 'dropdown', NOW(), gen_random_uuid(), false, true, true)
ON CONFLICT (id) DO NOTHING;

-- Get the IDs of the questions we just inserted
WITH inserted_questions AS (
  SELECT id FROM questions WHERE question IN (
    'Do you have a history of glaucoma?',
    'Have you experienced eye pressure or discomfort?',
    'Are you currently using eye drops?'
  )
)
-- Insert dropdown options for each question
INSERT INTO dropdown_options (id, question_id, option_text, option_value, score, created_at)
SELECT 
  gen_random_uuid(),
  q.id,
  'Yes',
  'yes',
  CASE 
    WHEN q.question = 'Do you have a history of glaucoma?' THEN 5
    WHEN q.question = 'Have you experienced eye pressure or discomfort?' THEN 3
    WHEN q.question = 'Are you currently using eye drops?' THEN 2
  END,
  NOW()
FROM questions q
WHERE q.question IN (
  'Do you have a history of glaucoma?',
  'Have you experienced eye pressure or discomfort?',
  'Are you currently using eye drops?'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dropdown_options (id, question_id, option_text, option_value, score, created_at)
SELECT 
  gen_random_uuid(),
  q.id,
  'No',
  'no',
  0,
  NOW()
FROM questions q
WHERE q.question IN (
  'Do you have a history of glaucoma?',
  'Have you experienced eye pressure or discomfort?',
  'Are you currently using eye drops?'
)
ON CONFLICT (id) DO NOTHING;

-- Update the question_text column to match the question column
UPDATE questions 
SET question_text = question
WHERE question_text IS NULL;
