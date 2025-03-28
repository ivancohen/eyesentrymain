-- Update existing patient questionnaires to set first_name and last_name from metadata
-- This script will update questionnaires that have empty first_name or last_name fields
-- but have the corresponding values in the metadata JSONB field

-- First, check if there are questionnaires with empty names but metadata
DO $$
DECLARE
    count_to_update INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_to_update
    FROM patient_questionnaires
    WHERE (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '')
    AND metadata IS NOT NULL
    AND (metadata->>'firstName' IS NOT NULL OR metadata->>'lastName' IS NOT NULL);
    
    RAISE NOTICE 'Found % questionnaires with empty names but metadata', count_to_update;
END $$;

-- Update first_name from metadata.firstName if first_name is empty
UPDATE patient_questionnaires
SET first_name = metadata->>'firstName'
WHERE (first_name IS NULL OR first_name = '')
AND metadata IS NOT NULL
AND metadata->>'firstName' IS NOT NULL;

-- Update last_name from metadata.lastName if last_name is empty
UPDATE patient_questionnaires
SET last_name = metadata->>'lastName'
WHERE (last_name IS NULL OR last_name = '')
AND metadata IS NOT NULL
AND metadata->>'lastName' IS NOT NULL;

-- Log the number of updated records
DO $$
DECLARE
    count_updated INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_updated
    FROM patient_questionnaires
    WHERE first_name IS NOT NULL AND first_name != ''
    AND last_name IS NOT NULL AND last_name != '';
    
    RAISE NOTICE 'Updated patient questionnaires. Total with names: %', count_updated;
END $$;

-- Create a function to update patient names from metadata
CREATE OR REPLACE FUNCTION update_patient_names_from_metadata()
RETURNS void AS $$
BEGIN
    -- Update first_name from metadata.firstName if first_name is empty
    UPDATE patient_questionnaires
    SET first_name = metadata->>'firstName'
    WHERE (first_name IS NULL OR first_name = '')
    AND metadata IS NOT NULL
    AND metadata->>'firstName' IS NOT NULL;

    -- Update last_name from metadata.lastName if last_name is empty
    UPDATE patient_questionnaires
    SET last_name = metadata->>'lastName'
    WHERE (last_name IS NULL OR last_name = '')
    AND metadata IS NOT NULL
    AND metadata->>'lastName' IS NOT NULL;
    
    RAISE NOTICE 'Patient names updated from metadata';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update patient names from metadata when a new questionnaire is inserted
CREATE OR REPLACE FUNCTION update_patient_names_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- If first_name is empty but metadata.firstName exists, use that
    IF (NEW.first_name IS NULL OR NEW.first_name = '') AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'firstName' IS NOT NULL THEN
        NEW.first_name := NEW.metadata->>'firstName';
    END IF;
    
    -- If last_name is empty but metadata.lastName exists, use that
    IF (NEW.last_name IS NULL OR NEW.last_name = '') AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'lastName' IS NOT NULL THEN
        NEW.last_name := NEW.metadata->>'lastName';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS patient_names_trigger ON patient_questionnaires;

-- Create the trigger
CREATE TRIGGER patient_names_trigger
BEFORE INSERT OR UPDATE ON patient_questionnaires
FOR EACH ROW
EXECUTE FUNCTION update_patient_names_trigger();

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Patient names update script completed successfully';
END $$;