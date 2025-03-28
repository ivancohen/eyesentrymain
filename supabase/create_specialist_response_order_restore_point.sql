-- Create a restore point for the specialist response order fix
-- This script creates a backup of the current state of the database tables related to specialist responses

-- Create a backup table for specialist_responses if it doesn't exist
CREATE TABLE IF NOT EXISTS specialist_responses_backup_20240326 (LIKE specialist_responses INCLUDING ALL);

-- Copy data from specialist_responses to the backup table
INSERT INTO specialist_responses_backup_20240326
SELECT * FROM specialist_responses
ON CONFLICT DO NOTHING;

-- Create a backup table for specialist_questions if it doesn't exist
CREATE TABLE IF NOT EXISTS specialist_questions_backup_20240326 (LIKE specialist_questions INCLUDING ALL);

-- Copy data from specialist_questions to the backup table
INSERT INTO specialist_questions_backup_20240326
SELECT * FROM specialist_questions
ON CONFLICT DO NOTHING;

-- Create a function to restore the specialist response system
CREATE OR REPLACE FUNCTION restore_specialist_response_system()
RETURNS void AS $$
BEGIN
    -- Restore specialist_responses table
    TRUNCATE specialist_responses;
    INSERT INTO specialist_responses
    SELECT * FROM specialist_responses_backup_20240326;
    
    -- Restore specialist_questions table
    TRUNCATE specialist_questions;
    INSERT INTO specialist_questions
    SELECT * FROM specialist_questions_backup_20240326;
    
    RAISE NOTICE 'Specialist response system restored to backup from 2024-03-26';
END;
$$ LANGUAGE plpgsql;

-- Log the creation of the restore point
DO $$
BEGIN
    RAISE NOTICE 'Restore point created for specialist response system (2024-03-26)';
    RAISE NOTICE 'To restore, run: SELECT restore_specialist_response_system();';
END $$;