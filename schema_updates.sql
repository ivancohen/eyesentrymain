-- Add missing columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conditional_parent_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_required_value TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_display_mode TEXT DEFAULT 'hide';

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_questions_display_order 
ON questions(page_category, display_order);

-- Add display_order column to dropdown_options
ALTER TABLE dropdown_options
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order 
ON dropdown_options(question_id, display_order);

-- Ensure risk_assessment_config has all needed columns
CREATE TABLE IF NOT EXISTS risk_assessment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  option_value TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, option_value)
);

-- Initialize display_order for existing questions
-- This sets the display_order based on the current order in the database
WITH ordered_questions AS (
  SELECT 
    id, 
    page_category,
    ROW_NUMBER() OVER (PARTITION BY page_category ORDER BY created_at) AS row_num
  FROM questions
)
UPDATE questions q
SET display_order = oq.row_num
FROM ordered_questions oq
WHERE q.id = oq.id
  AND (q.display_order IS NULL OR q.display_order = 0);

-- Initialize display_order for existing dropdown options
-- This sets the display_order based on the current order in the database
WITH ordered_options AS (
  SELECT 
    id, 
    question_id,
    ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at) AS row_num
  FROM dropdown_options
)
UPDATE dropdown_options o
SET display_order = oo.row_num
FROM ordered_options oo
WHERE o.id = oo.id
  AND (o.display_order IS NULL OR o.display_order = 0);

-- Initialize risk_assessment_config with existing scores from dropdown_options
INSERT INTO risk_assessment_config (question_id, option_value, score)
SELECT 
  question_id::text, 
  option_value, 
  COALESCE(score, 0)
FROM dropdown_options
WHERE score IS NOT NULL
ON CONFLICT (question_id, option_value) DO NOTHING;

-- Add specific entries for race
INSERT INTO risk_assessment_config (question_id, option_value, score)
VALUES 
('race', 'black', 2),
('race', 'hispanic', 1),
('race', 'asian', 1)
ON CONFLICT (question_id, option_value) DO UPDATE
SET score = EXCLUDED.score;

-- Add specific entries for other known risk factors
INSERT INTO risk_assessment_config (question_id, option_value, score)
VALUES 
('familyGlaucoma', 'yes', 2),
('ocularSteroid', 'yes', 2),
('intravitreal', 'yes', 2),
('systemicSteroid', 'yes', 2),
('iopBaseline', '22_and_above', 2),
('verticalAsymmetry', '0.2_and_above', 2),
('verticalRatio', '0.6_and_above', 2)
ON CONFLICT (question_id, option_value) DO UPDATE
SET score = EXCLUDED.score;