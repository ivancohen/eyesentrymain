-- Add risk_score column to questions table if it doesn't exist

-- Check if the risk_score column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'questions' 
                 AND column_name = 'risk_score') THEN
    ALTER TABLE public.questions ADD COLUMN risk_score INTEGER DEFAULT 1;
  END IF;
END $$;

-- Update the test question to have a risk score of 2
UPDATE public.questions
SET risk_score = 2
WHERE question = 'This is a test question'
OR id = 'a17b97e1-2f77-4a33-babe-8763c7bdd4ca';

-- Add comments to explain the risk_score field
COMMENT ON COLUMN public.questions.risk_score IS 'The number of points this question adds to the risk assessment score when answered "yes". Default is 1.';

-- Updated example script to create a high-risk question
INSERT INTO public.questions (
  question, 
  question_type, 
  page_category, 
  tooltip, 
  risk_score
)
VALUES (
  'High Risk Test Question', 
  'boolean',
  'patient_info',
  'This is a high risk test question with a risk score of 3. add_to_form',
  3
)
ON CONFLICT (question) DO UPDATE
SET 
  question_type = EXCLUDED.question_type,
  page_category = EXCLUDED.page_category,
  tooltip = EXCLUDED.tooltip,
  risk_score = EXCLUDED.risk_score;

-- Update the test question tooltip if not already updated
UPDATE public.questions
SET tooltip = 'This is a test question with risk score of 2. add_to_form',
    page_category = 'patient_info'
WHERE question = 'This is a test question'
AND (tooltip IS NULL OR NOT tooltip LIKE '%add_to_form%');