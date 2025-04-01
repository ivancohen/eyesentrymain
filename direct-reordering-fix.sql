-- Script to fix dropdown option reordering and standardize table usage
-- This unifies all dropdown-related operations to use the dropdown_options table with proper ordering

-- 1. Ensure dropdown_options table has display_order column
DO $$
BEGIN
    -- Check if display_order column exists in dropdown_options
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dropdown_options' AND column_name = 'display_order'
    ) THEN
        -- Add display_order column if it doesn't exist
        EXECUTE 'ALTER TABLE dropdown_options ADD COLUMN display_order INT DEFAULT 999';
        RAISE NOTICE 'Added display_order column to dropdown_options table';
    ELSE
        RAISE NOTICE 'display_order column already exists in dropdown_options table';
    END IF;
END $$;

-- 2. Migrate data from question_options to dropdown_options if needed
-- First check if question_options table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'question_options'
    ) THEN
        -- Migrate any data from question_options to dropdown_options
        INSERT INTO dropdown_options (question_id, option_value, option_text, score, display_order)
        SELECT 
            question_id, 
            option_value,
            option_text,
            COALESCE(score, 0),
            999 -- Default display_order
        FROM question_options qo
        WHERE NOT EXISTS (
            -- Avoid duplicates by checking if this option already exists
            SELECT 1 FROM dropdown_options
            WHERE question_id = qo.question_id AND option_value = qo.option_value
        );
        
        RAISE NOTICE 'Migrated data from question_options to dropdown_options';
    ELSE
        RAISE NOTICE 'question_options table does not exist, no migration needed';
    END IF;
END $$;

-- 3. Create consistent RLS policies for dropdown_options
-- First, enable RLS on dropdown_options
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS dropdown_options_select_policy ON dropdown_options;

-- Create policy to allow all authenticated users to read dropdown options
CREATE POLICY dropdown_options_select_policy ON dropdown_options
    FOR SELECT
    TO authenticated
    USING (true);

-- Set appropriate permissions
GRANT SELECT ON dropdown_options TO authenticated;

-- 4. Create stored procedures for secure access to questions and options

-- Function to get dropdown options for a specific question
DROP FUNCTION IF EXISTS get_dropdown_options_for_question(UUID);
CREATE OR REPLACE FUNCTION get_dropdown_options_for_question(question_id_param UUID)
RETURNS SETOF dropdown_options
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM dropdown_options
    WHERE question_id = question_id_param
    ORDER BY display_order ASC;
END;
$$;

-- Function to update dropdown option order
DROP FUNCTION IF EXISTS update_dropdown_option_order(UUID, INT, UUID, INT);
CREATE OR REPLACE FUNCTION update_dropdown_option_order(
    option_id_param UUID,
    new_order_param INT,
    question_id_param UUID,
    current_order_param INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If moving up in the list (e.g., from 3 to 1)
    IF new_order_param < current_order_param THEN
        -- Shift options down to make room
        UPDATE dropdown_options
        SET display_order = display_order + 1
        WHERE question_id = question_id_param
        AND display_order >= new_order_param
        AND display_order < current_order_param
        AND id != option_id_param;
    -- If moving down in the list (e.g., from 1 to 3)
    ELSIF new_order_param > current_order_param THEN
        -- Shift options up
        UPDATE dropdown_options
        SET display_order = display_order - 1
        WHERE question_id = question_id_param
        AND display_order <= new_order_param
        AND display_order > current_order_param
        AND id != option_id_param;
    END IF;

    -- Update the option's position
    UPDATE dropdown_options
    SET display_order = new_order_param
    WHERE id = option_id_param;
END;
$$;

-- Function to create a dropdown option with automatic ordering
DROP FUNCTION IF EXISTS create_dropdown_option(TEXT, TEXT, INT, UUID);
CREATE OR REPLACE FUNCTION create_dropdown_option(
    option_text TEXT,
    option_value TEXT,
    score INT,
    question_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_order INT;
    new_option dropdown_options;
BEGIN
    -- Get the next display_order value
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO new_order
    FROM dropdown_options
    WHERE question_id = create_dropdown_option.question_id;
    
    -- Insert the new option with the calculated display_order
    INSERT INTO dropdown_options (
        question_id,
        option_text,
        option_value,
        score,
        display_order
    )
    VALUES (
        create_dropdown_option.question_id,
        create_dropdown_option.option_text,
        create_dropdown_option.option_value,
        create_dropdown_option.score,
        new_order
    )
    RETURNING * INTO new_option;
    
    -- Return the new option as JSON
    RETURN row_to_json(new_option);
END;
$$;

-- Assign next sequential display_order to any existing options that have NULL or 0
DO $$
DECLARE
    q_id UUID;
    next_order INT;
    opt RECORD;
    counter INT;
BEGIN
    -- Get distinct question IDs
    FOR q_id IN (SELECT DISTINCT question_id FROM dropdown_options)
    LOOP
        -- Find the next order value for this question
        SELECT COALESCE(MAX(display_order), 0) + 1 INTO next_order
        FROM dropdown_options
        WHERE question_id = q_id AND display_order IS NOT NULL AND display_order > 0;
        
        -- Initialize counter for sequential ordering
        counter := 0;
        
        -- Update options with missing or zero display_order one by one
        FOR opt IN
            SELECT id
            FROM dropdown_options
            WHERE question_id = q_id AND (display_order IS NULL OR display_order <= 0)
            ORDER BY option_text
        LOOP
            UPDATE dropdown_options
            SET display_order = next_order + counter
            WHERE id = opt.id;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Optional: Drop question_options table if it exists and all data is migrated
-- Uncomment this section if you want to remove the duplicate table
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'question_options'
    ) THEN
        DROP TABLE question_options;
        RAISE NOTICE 'Dropped question_options table';
    END IF;
END $$;
*/