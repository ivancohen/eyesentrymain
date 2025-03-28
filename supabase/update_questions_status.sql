-- Script to update questions status and types

-- Add required columns if they don't exist
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'select';

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS has_dropdown_options BOOLEAN DEFAULT false;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS has_conditional_items BOOLEAN DEFAULT false;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS has_dropdown_scoring BOOLEAN DEFAULT false;

-- Set all questions to active initially
UPDATE public.questions 
SET status = 'Active' 
WHERE status IS NULL;

-- Do NOT force question types - respect admin settings
-- Only update has_dropdown_options flag for name fields if they have dropdown options
UPDATE public.questions q
SET has_dropdown_options = true
WHERE (question LIKE '%First Name%' OR question LIKE '%Last Name%')
AND EXISTS (
  SELECT 1 FROM dropdown_options
  WHERE question_id = q.id
);

-- Set display order for test question to be last on its page
UPDATE public.questions
SET display_order = 1000
WHERE question LIKE '%Test Question%' OR question LIKE '%test question%';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_question 
ON public.questions(question);

CREATE INDEX IF NOT EXISTS idx_questions_created_by 
ON public.questions(created_by);

CREATE INDEX IF NOT EXISTS idx_questions_page_category 
ON public.questions(page_category);

CREATE INDEX IF NOT EXISTS idx_questions_status 
ON public.questions(status);

CREATE INDEX IF NOT EXISTS idx_questions_question_type 
ON public.questions(question_type);

-- Standardize category names
UPDATE public.questions
SET page_category = 'patient_info'
WHERE page_category LIKE '%patient%info%';

UPDATE public.questions
SET page_category = 'medical_history'
WHERE page_category LIKE '%medical%history%';

UPDATE public.questions
SET page_category = 'clinical_measurements'
WHERE page_category LIKE '%clinical%measurement%';

-- Add risk_score column if it doesn't exist
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 1;

-- Set default risk scores
UPDATE public.questions 
SET risk_score = 1 
WHERE risk_score IS NULL OR risk_score = 0;

-- Set specific risk scores for known questions
UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%Family History of Glaucoma%';

UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%IOP Baseline%' AND question LIKE '%22%';

UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%Vertical Asymmetry%' AND question LIKE '%0.2%';

UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%Vertical Ratio%' AND question LIKE '%0.6%';

-- Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_questions AS
WITH ranked_questions AS (
  SELECT 
    id,
    question,
    created_at,
    created_by,
    ROW_NUMBER() OVER (
      PARTITION BY question 
      ORDER BY 
        CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM public.questions
)
SELECT id
FROM ranked_questions
WHERE rn > 1;

-- Deactivate duplicates
UPDATE public.questions
SET status = 'Inactive'
WHERE id IN (SELECT id FROM duplicate_questions);

-- Drop the temporary table
DROP TABLE duplicate_questions;

-- Update has_dropdown_options flag for questions that have options
UPDATE public.questions q
SET has_dropdown_options = true
WHERE EXISTS (
  SELECT 1 FROM dropdown_options
  WHERE question_id = q.id
);

-- Update has_conditional_items flag for questions that have conditional items
UPDATE public.questions q
SET has_conditional_items = true
WHERE EXISTS (
  SELECT 1 FROM conditional_items
  WHERE question_id = q.id
);

-- Update has_dropdown_scoring flag for questions that have options with scores
UPDATE public.questions q
SET has_dropdown_scoring = true
WHERE EXISTS (
  SELECT 1 FROM dropdown_options
  WHERE question_id = q.id AND score IS NOT NULL AND score != 0
);

-- Verify changes
SELECT
  question,
  status,
  question_type,
  risk_score,
  page_category,
  has_dropdown_options,
  has_conditional_items,
  has_dropdown_scoring
FROM public.questions
ORDER BY page_category, display_order, question;