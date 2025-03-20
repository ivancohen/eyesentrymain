-- Delete all entries from the specialist_questions table
DELETE FROM specialist_questions;

-- Reset the sequence if it exists (in case the table uses a sequence for IDs)
ALTER SEQUENCE IF EXISTS specialist_questions_id_seq RESTART; 