-- Option 1: Add the missing question_text column to match the code
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'question_text'
    ) THEN
        -- Add the question_text column and populate it with values from the question column
        ALTER TABLE questions ADD COLUMN question_text TEXT;
        UPDATE questions SET question_text = question;
        
        -- Create a trigger to keep both fields in sync
        CREATE OR REPLACE FUNCTION sync_question_fields()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                IF NEW.question IS NULL AND NEW.question_text IS NOT NULL THEN
                    NEW.question := NEW.question_text;
                ELSIF NEW.question_text IS NULL AND NEW.question IS NOT NULL THEN
                    NEW.question_text := NEW.question;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER questions_sync_fields
        BEFORE INSERT OR UPDATE ON questions
        FOR EACH ROW
        EXECUTE FUNCTION sync_question_fields();
    END IF;
END $$;

-- Grant permissions to service_role
GRANT SELECT, UPDATE, INSERT, DELETE ON questions TO service_role;

-- Option 2: Create a view that aliases the question column as question_text
-- This is an alternative if you don't want to modify the database schema
CREATE OR REPLACE VIEW admin_questions_view AS
SELECT 
    id,
    question AS question_text,
    created_at,
    created_by,
    question_type,
    has_conditional_items,
    has_dropdown_options,
    has_dropdown_scoring
FROM 
    questions;

-- Grant permissions on the view
GRANT SELECT ON admin_questions_view TO service_role;

-- Create a function to update the questions table via the view
CREATE OR REPLACE FUNCTION update_admin_question()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO questions (
            id, 
            question,
            created_at, 
            created_by, 
            question_type, 
            has_conditional_items, 
            has_dropdown_options, 
            has_dropdown_scoring
        ) VALUES (
            COALESCE(NEW.id, gen_random_uuid()), 
            NEW.question_text,
            COALESCE(NEW.created_at, now()), 
            NEW.created_by, 
            NEW.question_type, 
            NEW.has_conditional_items, 
            NEW.has_dropdown_options, 
            NEW.has_dropdown_scoring
        )
        RETURNING * INTO NEW;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE questions SET
            question = NEW.question_text,
            created_at = NEW.created_at,
            created_by = NEW.created_by,
            question_type = NEW.question_type,
            has_conditional_items = NEW.has_conditional_items,
            has_dropdown_options = NEW.has_dropdown_options,
            has_dropdown_scoring = NEW.has_dropdown_scoring
        WHERE id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM questions WHERE id = OLD.id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on the view
DROP TRIGGER IF EXISTS admin_questions_insert_trigger ON admin_questions_view;
DROP TRIGGER IF EXISTS admin_questions_update_trigger ON admin_questions_view;
DROP TRIGGER IF EXISTS admin_questions_delete_trigger ON admin_questions_view;

CREATE TRIGGER admin_questions_insert_trigger
INSTEAD OF INSERT ON admin_questions_view
FOR EACH ROW
EXECUTE FUNCTION update_admin_question();

CREATE TRIGGER admin_questions_update_trigger
INSTEAD OF UPDATE ON admin_questions_view
FOR EACH ROW
EXECUTE FUNCTION update_admin_question();

CREATE TRIGGER admin_questions_delete_trigger
INSTEAD OF DELETE ON admin_questions_view
FOR EACH ROW
EXECUTE FUNCTION update_admin_question();
