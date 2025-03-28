-- SQL script to fix risk assessment advice permissions
-- This script updates the Row Level Security (RLS) policies for the risk_assessment_advice table
-- to allow both authenticated users and admins to insert and update records

-- First, check if the table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'risk_assessment_advice') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.risk_assessment_advice (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      min_score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      advice TEXT NOT NULL,
      risk_level TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add comment
    COMMENT ON TABLE public.risk_assessment_advice IS 'Table for storing risk assessment advice based on score ranges';
  END IF;
END
$$;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.risk_assessment_advice;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.risk_assessment_advice;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.risk_assessment_advice;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.risk_assessment_advice;

-- Enable Row Level Security
ALTER TABLE public.risk_assessment_advice ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Allow reading for all authenticated users
CREATE POLICY "Enable read access for all users" 
ON public.risk_assessment_advice
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 2. Allow insert for authenticated users
CREATE POLICY "Enable insert for authenticated users only" 
ON public.risk_assessment_advice
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow update for authenticated users
CREATE POLICY "Enable update for authenticated users only" 
ON public.risk_assessment_advice
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 4. Allow delete for admins only
CREATE POLICY "Enable delete for admins only" 
ON public.risk_assessment_advice
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Insert default advice data if not exists
INSERT INTO public.risk_assessment_advice (min_score, max_score, advice, risk_level)
VALUES 
  (0, 2, 'Low risk. Regular eye exams as recommended by your optometrist are sufficient.', 'Low'),
  (3, 5, 'Moderate risk. Consider more frequent eye exams and discuss with your doctor about potential preventive measures.', 'Moderate'),
  (6, 100, 'High risk. Regular monitoring is strongly recommended. Discuss with your specialist about comprehensive eye exams and treatment options.', 'High')
ON CONFLICT (risk_level) DO 
  UPDATE SET advice = EXCLUDED.advice, min_score = EXCLUDED.min_score, max_score = EXCLUDED.max_score, updated_at = now();