-- Script to fix risk assessment configuration and ensure scores are calculated correctly

-- First, check if the risk_assessment_config table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'risk_assessment_config'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.risk_assessment_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id TEXT NOT NULL,
      option_value TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(question_id, option_value)
    );
    
    -- Enable RLS
    ALTER TABLE public.risk_assessment_config ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY risk_assessment_config_select_policy ON public.risk_assessment_config
      FOR SELECT USING (true);
  END IF;
END $$;

-- Ensure the risk_assessment_advice table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'risk_assessment_advice'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.risk_assessment_advice (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      min_score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      advice TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.risk_assessment_advice ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY risk_assessment_advice_select_policy ON public.risk_assessment_advice
      FOR SELECT USING (true);
  END IF;
END $$;

-- Insert default risk assessment configs if none exist
INSERT INTO public.risk_assessment_config (question_id, option_value, score)
SELECT * FROM (
  VALUES 
    -- Race-related scores
    ('race', 'black', 2),
    ('race', 'hispanic', 1),
    -- Family glaucoma
    ('familyGlaucoma', 'yes', 2),
    -- Medication-related scores
    ('ocularSteroid', 'yes', 2),
    ('intravitreal', 'yes', 2),
    ('systemicSteroid', 'yes', 2),
    -- Measurements
    ('iopBaseline', '22_and_above', 2),
    ('verticalAsymmetry', '0.2_and_above', 2),
    ('verticalRatio', '0.6_and_above', 2)
) AS v(question_id, option_value, score)
WHERE NOT EXISTS (
  SELECT 1 FROM public.risk_assessment_config
);

-- Insert default risk assessment advice if none exist
INSERT INTO public.risk_assessment_advice (min_score, max_score, advice, risk_level)
SELECT * FROM (
  VALUES 
    (0, 2, 'Your risk assessment score indicates a low risk. Continue with regular eye exams.', 'Low'),
    (3, 5, 'Your risk assessment score indicates a moderate risk. Consider more frequent eye exams.', 'Moderate'),
    (6, 99, 'Your risk assessment score indicates a high risk. Consult with an ophthalmologist for specialized care.', 'High')
) AS v(min_score, max_score, advice, risk_level)
WHERE NOT EXISTS (
  SELECT 1 FROM public.risk_assessment_advice
);

-- Add a function to manually calculate risk score for testing
CREATE OR REPLACE FUNCTION calculate_risk_score(answers JSONB)
RETURNS JSONB AS $$
DECLARE
  total_score INTEGER := 0;
  contributing_factors JSONB := '[]'::JSONB;
  matched_advice RECORD;
  answer_value TEXT;
  config_score INTEGER;
  answer_keys TEXT[];
BEGIN
  -- Get all the keys from the answers object
  SELECT array_agg(key) INTO answer_keys
  FROM jsonb_object_keys(answers) AS key;
  
  -- Loop through each answer
  FOREACH answer_value IN ARRAY answer_keys
  LOOP
    -- Get the answer value
    SELECT answers->>answer_value INTO answer_value;
    
    -- Find the corresponding score in risk_assessment_config
    SELECT score INTO config_score
    FROM risk_assessment_config
    WHERE question_id = answer_value 
      AND option_value = answer_value;
    
    -- If we found a score, add it to the total
    IF config_score IS NOT NULL THEN
      total_score := total_score + config_score;
      
      -- Add to contributing factors
      contributing_factors := contributing_factors || jsonb_build_object(
        'question', answer_value,
        'answer', answer_value,
        'score', config_score
      );
    END IF;
  END LOOP;
  
  -- Find the appropriate advice
  SELECT * INTO matched_advice
  FROM risk_assessment_advice
  WHERE total_score BETWEEN min_score AND max_score
  LIMIT 1;
  
  -- Return the complete result
  RETURN jsonb_build_object(
    'total_score', total_score,
    'contributing_factors', contributing_factors,
    'advice', COALESCE(matched_advice.advice, 'No advice available for this score'),
    'risk_level', COALESCE(matched_advice.risk_level, 'Unknown')
  );
END;
$$ LANGUAGE plpgsql;