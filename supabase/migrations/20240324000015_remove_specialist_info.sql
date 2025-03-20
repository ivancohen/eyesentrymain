-- Remove specialist information columns from specialist_responses table
ALTER TABLE specialist_responses
DROP COLUMN IF EXISTS specialist_name,
DROP COLUMN IF EXISTS specialist_credentials,
DROP COLUMN IF EXISTS specialty; 