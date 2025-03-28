-- Script to synchronize dropdown_options to question_options
-- This ensures that the data in both tables is consistent for the patient form

-- First, check if question_options table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'question_options'
    ) THEN
        -- Create the question_options table if it doesn't exist
        CREATE TABLE public.question_options (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            question_id UUID NOT NULL,
            option_value TEXT NOT NULL,
            option_text TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            display_order INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
        );
        
        RAISE NOTICE 'Created question_options table';
    ELSE
        RAISE NOTICE 'question_options table already exists';
    END IF;
END
$$;

-- Next, check if we need to add display_order column to question_options
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'question_options' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.question_options ADD COLUMN display_order INTEGER;
        RAISE NOTICE 'Added display_order column to question_options table';
    END IF;
END
$$;

-- Create a function to sync the dropdown_options to question_options
CREATE OR REPLACE FUNCTION sync_dropdown_options_to_question_options()
RETURNS INTEGER AS $$
DECLARE
    counter INTEGER := 0;
    option_exists BOOLEAN;
BEGIN
    -- First, clear out question_options that don't exist in dropdown_options
    DELETE FROM public.question_options
    WHERE NOT EXISTS (
        SELECT 1 FROM public.dropdown_options
        WHERE dropdown_options.question_id = question_options.question_id
        AND dropdown_options.option_value = question_options.option_value
    );
    
    -- Now insert or update from dropdown_options to question_options
    FOR option_record IN
        SELECT * FROM public.dropdown_options
    LOOP
        -- Check if this option already exists in question_options
        SELECT EXISTS (
            SELECT 1 FROM public.question_options
            WHERE question_id = option_record.question_id
            AND option_value = option_record.option_value
        ) INTO option_exists;
        
        IF option_exists THEN
            -- Update the existing record
            UPDATE public.question_options
            SET option_text = option_record.option_text,
                score = option_record.score,
                display_order = option_record.display_order,
                updated_at = NOW()
            WHERE question_id = option_record.question_id
            AND option_value = option_record.option_value;
        ELSE
            -- Insert a new record
            INSERT INTO public.question_options
            (question_id, option_value, option_text, score, display_order)
            VALUES
            (option_record.question_id, option_record.option_value, option_record.option_text, option_record.score, option_record.display_order);
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN counter;
END;
$$ LANGUAGE plpgsql;

-- Run the sync function
DO $$
DECLARE
    synced_count INTEGER;
BEGIN
    SELECT sync_dropdown_options_to_question_options() INTO synced_count;
    RAISE NOTICE 'Synchronized % dropdown options to question_options table', synced_count;
END
$$;

-- Create a trigger to keep the tables in sync automatically
CREATE OR REPLACE FUNCTION sync_dropdown_option_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- For insert or update, upsert the record in question_options
        INSERT INTO public.question_options
        (question_id, option_value, option_text, score, display_order)
        VALUES
        (NEW.question_id, NEW.option_value, NEW.option_text, NEW.score, NEW.display_order)
        ON CONFLICT (id)
        DO UPDATE SET
            option_text = EXCLUDED.option_text,
            score = EXCLUDED.score,
            display_order = EXCLUDED.display_order,
            updated_at = NOW();
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- For delete, remove the corresponding record from question_options
        DELETE FROM public.question_options
        WHERE question_id = OLD.question_id
        AND option_value = OLD.option_value;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers if they don't exist
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS dropdown_options_sync_trigger ON public.dropdown_options;
    
    -- Create new trigger
    CREATE TRIGGER dropdown_options_sync_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.dropdown_options
    FOR EACH ROW
    EXECUTE FUNCTION sync_dropdown_option_changes();
    
    RAISE NOTICE 'Created trigger to automatically sync dropdown_options changes to question_options';
END
$$;

-- Finally, update the PatientQuestionnaireService API to use the correct tables
-- Create a view that merges both tables for compatibility
CREATE OR REPLACE VIEW combined_question_options AS
SELECT
    qo.id,
    qo.question_id,
    qo.option_value,
    qo.option_text,
    qo.score,
    qo.display_order,
    qo.created_at,
    qo.updated_at
FROM
    public.question_options qo
UNION ALL
SELECT
    do.id,
    do.question_id,
    do.option_value,
    do.option_text,
    do.score,
    do.display_order,
    do.created_at,
    do.updated_at
FROM
    public.dropdown_options do
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.question_options
        WHERE question_id = do.question_id
        AND option_value = do.option_value
    );

-- Output summary
SELECT 
    (SELECT COUNT(*) FROM public.dropdown_options) AS dropdown_options_count,
    (SELECT COUNT(*) FROM public.question_options) AS question_options_count,
    (SELECT COUNT(*) FROM combined_question_options) AS combined_options_count;