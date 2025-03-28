-- Fix for questions table
-- Addresses the "null value in column "id" of relation "questions" violates not-null constraint" error

-- Make sure the uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Part 1: Fix table structure
DO $$
BEGIN
  -- First check if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'questions') THEN
    -- Check if the id column has a default value
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'id' 
      AND column_default IS NOT NULL
    ) THEN
      -- Add a default UUID generator to the id column
      ALTER TABLE public.questions 
      ALTER COLUMN id SET DEFAULT uuid_generate_v4();
      
      RAISE NOTICE 'Added default uuid_generate_v4() to id column in questions table';
    ELSE
      RAISE NOTICE 'id column in questions table already has a default value';
    END IF;
    
    -- Check if display_order column exists, add it if it doesn't
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'display_order'
    ) THEN
      ALTER TABLE public.questions 
      ADD COLUMN display_order INTEGER;
      
      -- Update existing records to have sequential display_order values
      WITH ordered_questions AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY page_category ORDER BY created_at) as row_num
        FROM public.questions
      )
      UPDATE public.questions q
      SET display_order = oq.row_num
      FROM ordered_questions oq
      WHERE q.id = oq.id;
      
      RAISE NOTICE 'Added display_order column to questions table';
    ELSE
      RAISE NOTICE 'display_order column already exists in questions table';
    END IF;
    
    -- Check if has_dropdown_options column exists, add it if it doesn't
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'questions' 
      AND column_name = 'has_dropdown_options'
    ) THEN
      ALTER TABLE public.questions 
      ADD COLUMN has_dropdown_options BOOLEAN DEFAULT FALSE;
      
      -- Update existing records based on question_type
      UPDATE public.questions
      SET has_dropdown_options = (question_type = 'dropdown' OR question_type = 'select')
      WHERE has_dropdown_options IS NULL;
      
      RAISE NOTICE 'Added has_dropdown_options column to questions table';
    ELSE
      RAISE NOTICE 'has_dropdown_options column already exists in questions table';
    END IF;
    
    -- Check if question_type column exists, add it if it doesn't
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'questions'
      AND column_name = 'question_type'
    ) THEN
      ALTER TABLE public.questions
      ADD COLUMN question_type TEXT DEFAULT 'text';
      
      RAISE NOTICE 'Added question_type column to questions table';
    ELSE
      RAISE NOTICE 'question_type column already exists in questions table';
    END IF;
    
    -- Check if created_by column is NOT NULL and make it nullable if it is
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'questions'
      AND column_name = 'created_by'
      AND is_nullable = 'NO'
    ) THEN
      -- Make created_by column nullable and add a default value
      ALTER TABLE public.questions
      ALTER COLUMN created_by DROP NOT NULL;
      
      -- Add a default value for created_by
      ALTER TABLE public.questions
      ALTER COLUMN created_by SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
      
      -- Update any existing NULL values
      UPDATE public.questions
      SET created_by = '00000000-0000-0000-0000-000000000000'::uuid
      WHERE created_by IS NULL;
      
      RAISE NOTICE 'Made created_by column nullable, added default value, and updated NULL values in questions table';
    ELSE
      RAISE NOTICE 'created_by column is already nullable or does not exist';
    END IF;
    
    RAISE NOTICE 'Completed table structure fixes for questions table';
  ELSE
    RAISE NOTICE 'questions table does not exist, no fixes needed';
  END IF;
END $$;

-- Part 2: Create function outside of DO block
-- Create or replace function to insert a question with proper ID handling
CREATE OR REPLACE FUNCTION public.insert_question(
  p_question TEXT,
  p_tooltip TEXT,
  p_question_type TEXT,
  p_page_category TEXT,
  p_has_dropdown_options BOOLEAN,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  max_order INTEGER;
BEGIN
  -- Get the maximum display_order for the page category
  SELECT COALESCE(MAX(display_order), 0) INTO max_order
  FROM public.questions
  WHERE page_category = p_page_category;
  
  -- Insert the new question with a generated ID
  INSERT INTO public.questions (
    id,
    question,
    tooltip,
    question_type,
    page_category,
    has_dropdown_options,
    created_by,
    display_order
  ) VALUES (
    uuid_generate_v4(),
    p_question,
    p_tooltip,
    p_question_type,
    p_page_category,
    p_has_dropdown_options,
    COALESCE(p_created_by, '00000000-0000-0000-0000-000000000000'::uuid), -- Use provided ID or fallback UUID
    max_order + 1
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_question TO authenticated;

-- Create a trigger to automatically set the ID if it's NULL
CREATE OR REPLACE FUNCTION public.set_question_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := uuid_generate_v4();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_question_id_trigger ON public.questions;

-- Create the trigger
CREATE TRIGGER set_question_id_trigger
BEFORE INSERT ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.set_question_id();

-- Create a direct RPC function to insert a question
CREATE OR REPLACE FUNCTION public.insert_question_rpc(
  p_question TEXT,
  p_tooltip TEXT DEFAULT NULL,
  p_question_type TEXT DEFAULT 'text',
  p_page_category TEXT DEFAULT 'general',
  p_has_dropdown_options BOOLEAN DEFAULT FALSE,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Insert the question with a generated ID
  INSERT INTO public.questions (
    id,
    question,
    tooltip,
    question_type,
    page_category,
    has_dropdown_options,
    created_by
  ) VALUES (
    uuid_generate_v4(),
    p_question,
    p_tooltip,
    p_question_type,
    p_page_category,
    p_has_dropdown_options,
    COALESCE(p_created_by, '00000000-0000-0000-0000-000000000000'::uuid)
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_question_rpc TO authenticated;