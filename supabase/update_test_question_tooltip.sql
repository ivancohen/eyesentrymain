-- Update test question to flag it to appear in the questionnaire form

-- First, let's identify the test question by its text
SELECT id, question, tooltip, page_category
FROM public.questions
WHERE question = 'This is a test question';

-- Update the test question to add the flag to its tooltip AND ensure correct page_category
UPDATE public.questions
SET
  tooltip = CASE
    WHEN tooltip IS NULL THEN 'add_to_form'
    WHEN tooltip NOT LIKE '%add_to_form%' THEN tooltip || ' add_to_form'
    ELSE tooltip
  END,
  page_category = 'patient_info'  -- Set to patient_info to appear on first page only
WHERE question = 'This is a test question';

-- Verify the update
SELECT id, question, tooltip, page_category
FROM public.questions
WHERE question = 'This is a test question';