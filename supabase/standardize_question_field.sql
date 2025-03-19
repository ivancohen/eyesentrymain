-- standardize_question_field.sql
-- This script fixes the error "Error fetching question scores: column questions.question_text does not exist"
-- by standardizing the question field name in the questions table.

-- First check if question_text column exists
SELECT EXISTS (
   SELECT 1
   FROM information_schema.columns
   WHERE table_name = 'questions'
   AND column_name = 'question_text'
) as question_text_exists;

-- If question_text exists but question doesn't, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question_text'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question'
    ) THEN
        ALTER TABLE questions RENAME COLUMN question_text TO question;
        RAISE NOTICE 'Renamed column question_text to question';
    END IF;
END $$;

-- If both columns exist, copy data from question_text to question where question is null
-- and then drop question_text
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question_text'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question'
    ) THEN
        -- Update any null questions with data from question_text
        UPDATE questions
        SET question = question_text
        WHERE question IS NULL AND question_text IS NOT NULL;
        
        -- Drop the redundant column
        ALTER TABLE questions DROP COLUMN question_text;
        RAISE NOTICE 'Merged question_text into question and dropped question_text column';
    END IF;
END $$;

-- If only question exists, we're good, but make sure it's NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question_text'
    ) THEN
        -- See if the column is already NOT NULL
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'questions'
            AND column_name = 'question'
            AND is_nullable = 'NO'
        ) THEN
            RAISE NOTICE 'Column question already exists and is NOT NULL';
        ELSE
            -- First fill any NULL values
            UPDATE questions
            SET question = 'Untitled Question'
            WHERE question IS NULL;
            
            -- Then set NOT NULL constraint
            ALTER TABLE questions ALTER COLUMN question SET NOT NULL;
            RAISE NOTICE 'Set question column to NOT NULL';
        END IF;
    END IF;
END $$;

-- If neither column exists, we need to add the question column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question_text'
    ) THEN
        -- Add the question column
        ALTER TABLE questions ADD COLUMN question TEXT NOT NULL DEFAULT 'Untitled Question';
        RAISE NOTICE 'Added missing question column';
    END IF;
END $$;

-- Now add a page_category column if it doesn't exist yet
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'page_category'
    ) THEN
        -- Add the page_category column
        ALTER TABLE questions ADD COLUMN page_category TEXT;
        RAISE NOTICE 'Added page_category column';
    END IF;
END $$;

-- Report current schema to verify changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;
