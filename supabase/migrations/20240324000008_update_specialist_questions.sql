-- First, deactivate all existing questions
UPDATE specialist_questions
SET is_active = false;

-- Insert new questions with proper ordering
INSERT INTO specialist_questions (
    question,
    question_type,
    display_order,
    required,
    is_active,
    dropdown_options
) VALUES
(
    'Physician Name',
    'text',
    1,
    true,
    true,
    NULL
),
(
    'What is your assessment of the patient''s condition?',
    'multiline',
    2,
    true,
    true,
    NULL
),
(
    'What are your recommendations for treatment or follow-up?',
    'multiline',
    3,
    true,
    true,
    NULL
),
(
    'Are there any additional concerns or observations you would like to share?',
    'multiline',
    4,
    false,
    true,
    NULL
);

-- Add comment explaining the changes
COMMENT ON TABLE specialist_questions IS 'Updated specialist questions to match current admin dashboard questions'; 