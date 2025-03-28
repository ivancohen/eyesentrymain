-- Fix the risk_assessment_advice table to include required min_score column
-- First, drop and recreate the table with the proper structure

-- Drop the table if it exists (careful with this in production!)
DROP TABLE IF EXISTS public.risk_assessment_advice;

-- Create the table with all required columns
CREATE TABLE public.risk_assessment_advice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT UNIQUE NOT NULL,
  advice TEXT NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default advice values with appropriate score ranges
-- Low risk (0-1 points)
INSERT INTO public.risk_assessment_advice (risk_level, advice, min_score, max_score)
VALUES ('Low', 'Low risk of glaucoma. Regular eye exams recommended every 2 years.', 0, 1);

-- Moderate risk (2-3 points)
INSERT INTO public.risk_assessment_advice (risk_level, advice, min_score, max_score)
VALUES ('Moderate', 'Moderate risk of glaucoma. Regular eye exams recommended every year.', 2, 3);

-- High risk (4+ points)
INSERT INTO public.risk_assessment_advice (risk_level, advice, min_score, max_score)
VALUES ('High', 'High risk of glaucoma. Regular eye exams recommended every 6 months.', 4, NULL);

-- Grant access to authenticated users
ALTER TABLE public.risk_assessment_advice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read risk_assessment_advice" 
ON public.risk_assessment_advice 
FOR SELECT 
USING (true);

-- Function to get advice by risk level
CREATE OR REPLACE FUNCTION get_risk_advice(risk_level_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  advice_text TEXT;
BEGIN
  SELECT advice INTO advice_text
  FROM public.risk_assessment_advice
  WHERE risk_level = risk_level_param;
  
  -- Return default advice if none found
  IF advice_text IS NULL THEN
    CASE 
      WHEN risk_level_param = 'High' THEN
        RETURN 'High risk of glaucoma. Regular eye exams recommended every 6 months.';
      WHEN risk_level_param = 'Moderate' THEN
        RETURN 'Moderate risk of glaucoma. Regular eye exams recommended every year.';
      ELSE
        RETURN 'Low risk of glaucoma. Regular eye exams recommended every 2 years.';
    END CASE;
  END IF;
  
  RETURN advice_text;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_risk_advice TO authenticated;