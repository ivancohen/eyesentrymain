-- question_text_fix.sql
-- Simple script to check and fix the missing question_text column problem
-- This is a simpler version of standardize_question_field.sql focusing only on the column name issue

-- Check if question column exists
SELECT EXISTS (
   SELECT 1
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'questions'
   AND column_name = 'question'
) as question_exists;

-- Check if question_text column exists
SELECT EXISTS (
   SELECT 1
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'questions'
   AND column_name = 'question_text'
) as question_text_exists;

-- Rename question_text to question if needed
DO $$
BEGIN
  -- If the question_text column exists but question doesn't, rename it
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'question_text'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'question'
  ) THEN
    ALTER TABLE public.questions RENAME COLUMN question_text TO question;
    RAISE NOTICE 'Renamed column question_text to question';
  ELSE
    RAISE NOTICE 'No column rename needed';
  END IF;
END $$;

-- Add a question column if neither exists
DO $$
BEGIN
  -- If neither column exists, add question column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'question'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'question_text'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN question TEXT NOT NULL DEFAULT 'Untitled Question';
    RAISE NOTICE 'Added question column';
  END IF;
END $$;

-- Show the current schema of the questions table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public'
  AND table_name = 'questions'
ORDER BY 
  ordinal_position;
