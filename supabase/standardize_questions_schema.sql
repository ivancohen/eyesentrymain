-- Standardize questions schema for database-driven approach
-- This script ensures the questions table has all necessary columns and constraints

-- Make sure the uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Ensure required columns exist
DO $$
BEGIN
  -- Check if the questions table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
    -- Ensure id column with default
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'id'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
      RAISE NOTICE 'Added id column to questions table';
    END IF;
    
    -- Ensure question column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'question'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN question TEXT NOT NULL;
      RAISE NOTICE 'Added question column to questions table';
    END IF;
    
    -- Ensure tooltip column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'tooltip'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN tooltip TEXT;
      RAISE NOTICE 'Added tooltip column to questions table';
    END IF;
    
    -- Ensure question_type column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'question_type'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN question_type TEXT DEFAULT 'select';
      RAISE NOTICE 'Added question_type column to questions table';
    END IF;
    
    -- Ensure page_category column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'page_category'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN page_category TEXT;
      RAISE NOTICE 'Added page_category column to questions table';
    END IF;
    
    -- Ensure display_order column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'display_order'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN display_order INTEGER;
      RAISE NOTICE 'Added display_order column to questions table';
    END IF;
    
    -- Ensure risk_score column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'risk_score'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN risk_score INTEGER DEFAULT 1;
      RAISE NOTICE 'Added risk_score column to questions table';
    END IF;
    
    -- Ensure created_by column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'created_by'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN created_by UUID;
      RAISE NOTICE 'Added created_by column to questions table';
    END IF;
    
    -- Ensure created_at column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
      RAISE NOTICE 'Added created_at column to questions table';
    END IF;
    
    -- Ensure updated_at column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
      RAISE NOTICE 'Added updated_at column to questions table';
    END IF;
    
    -- Ensure has_dropdown_options column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'has_dropdown_options'
    ) THEN
      ALTER TABLE public.questions ADD COLUMN has_dropdown_options BOOLEAN DEFAULT FALSE;
      RAISE NOTICE 'Added has_dropdown_options column to questions table';
    END IF;
    
    RAISE NOTICE 'Successfully standardized questions table structure';
  ELSE
    -- Create questions table if it doesn't exist
    CREATE TABLE public.questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question TEXT NOT NULL,
      tooltip TEXT,
      question_type TEXT DEFAULT 'select',
      page_category TEXT,
      display_order INTEGER,
      risk_score INTEGER DEFAULT 1,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      has_dropdown_options BOOLEAN DEFAULT FALSE
    );
    
    RAISE NOTICE 'Created questions table with standard structure';
  END IF;
  
  -- Step 2: Ensure question_options table exists with proper structure
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'question_options') THEN
    CREATE TABLE public.question_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
      option_value TEXT NOT NULL,
      option_text TEXT NOT NULL,
      tooltip TEXT,
      score INTEGER DEFAULT 0,
      display_order INTEGER,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    RAISE NOTICE 'Created question_options table with standard structure';
  ELSE
    -- Ensure question_id column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'question_options' 
      AND column_name = 'question_id'
    ) THEN
      ALTER TABLE public.question_options ADD COLUMN question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added question_id column to question_options table';
    END IF;
    
    -- Ensure option_value column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'question_options' 
      AND column_name = 'option_value'
    ) THEN
      ALTER TABLE public.question_options ADD COLUMN option_value TEXT;
      RAISE NOTICE 'Added option_value column to question_options table';
    END IF;
    
    -- Ensure option_text column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'question_options' 
      AND column_name = 'option_text'
    ) THEN
      ALTER TABLE public.question_options ADD COLUMN option_text TEXT;
      RAISE NOTICE 'Added option_text column to question_options table';
    END IF;
    
    -- Ensure score column
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'question_options' 
      AND column_name = 'score'
    ) THEN
      ALTER TABLE public.question_options ADD COLUMN score INTEGER DEFAULT 0;
      RAISE NOTICE 'Added score column to question_options table';
    END IF;
    
    RAISE NOTICE 'Successfully standardized question_options table structure';
  END IF;
  
  -- Step 3: Ensure risk_assessment_advice table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'risk_assessment_advice') THEN
    CREATE TABLE public.risk_assessment_advice (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      risk_level TEXT NOT NULL UNIQUE,
      advice TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Insert default advice values
    INSERT INTO public.risk_assessment_advice (risk_level, advice)
    VALUES 
      ('Low', 'Low risk of glaucoma. Regular eye exams recommended every 2 years.'),
      ('Moderate', 'Moderate risk of glaucoma. Regular eye exams recommended every year.'),
      ('High', 'High risk of glaucoma. Regular eye exams recommended every 6 months.')
    ON CONFLICT (risk_level) DO NOTHING;
    
    RAISE NOTICE 'Created risk_assessment_advice table with standard values';
  END IF;
  
  -- Step 4: Update question categories for consistency
  UPDATE public.questions
  SET page_category = 'patient_info'
  WHERE page_category IN ('Patient_Info', 'patient info', 'Patient Info', 'patientInfo')
  AND page_category IS NOT NULL;
  
  UPDATE public.questions
  SET page_category = 'medical_history'
  WHERE page_category IN ('Medical_History', 'medical history', 'Medical History', 'medicalHistory')
  AND page_category IS NOT NULL;
  
  UPDATE public.questions
  SET page_category = 'clinical_measurements'
  WHERE page_category IN ('Clinical_Measurements', 'clinical measurements', 'Clinical Measurements', 'clinicalMeasurements')
  AND page_category IS NOT NULL;
  
  -- Step 5: Ensure unknown page categories have a valid value
  UPDATE public.questions
  SET page_category = 'patient_info'
  WHERE page_category IS NULL OR page_category = '';
  
  -- Step 6: Update has_dropdown_options based on question_type
  UPDATE public.questions
  SET has_dropdown_options = (question_type = 'select' OR question_type = 'dropdown')
  WHERE has_dropdown_options IS NULL;
  
  -- Step 7: Update display_order for questions without one
  WITH ordered_questions AS (
    SELECT id, page_category, ROW_NUMBER() OVER (PARTITION BY page_category ORDER BY created_at) as row_num
    FROM public.questions
    WHERE display_order IS NULL
  )
  UPDATE public.questions q
  SET display_order = oq.row_num
  FROM ordered_questions oq
  WHERE q.id = oq.id;
  
  RAISE NOTICE 'Database schema standardization completed successfully';
END $$;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to questions table
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to question_options table
DROP TRIGGER IF EXISTS update_question_options_updated_at ON public.question_options;
CREATE TRIGGER update_question_options_updated_at
BEFORE UPDATE ON public.question_options
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create an index on question.page_category for faster filtering
CREATE INDEX IF NOT EXISTS questions_page_category_idx ON public.questions(page_category);

-- Analyze tables to update statistics for the query planner
ANALYZE public.questions;
ANALYZE public.question_options;