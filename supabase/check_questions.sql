-- Check if questions exist
SELECT COUNT(*) AS question_count FROM questions;

-- Check questions with their columns
SELECT id, question, question_text, question_type FROM questions;

-- Check dropdown options
SELECT 
    q.id, 
    q.question, 
    o.id AS option_id, 
    o.option_text, 
    o.score
FROM 
    questions q
JOIN 
    dropdown_options o ON q.id = o.question_id
ORDER BY 
    q.question, o.option_text;

-- Check if there's an update_question_score RPC function
SELECT 
    routine_name, 
    routine_type,
    data_type AS return_type
FROM 
    information_schema.routines
WHERE 
    routine_name = 'update_question_score' 
    AND routine_schema = 'public';
