-- Drop existing check constraint
ALTER TABLE specialist_questions
DROP CONSTRAINT IF EXISTS specialist_questions_question_type_check;

-- Add the new check constraint with all question types
ALTER TABLE specialist_questions
ADD CONSTRAINT specialist_questions_question_type_check
CHECK (question_type IN ('text', 'select', 'multiline', 'number'));

-- Drop existing policies
DROP POLICY IF EXISTS "Select specialist questions" ON specialist_questions;
DROP POLICY IF EXISTS "Manage specialist questions" ON specialist_questions;
DROP POLICY IF EXISTS "Anyone can view active specialist questions" ON specialist_questions;
DROP POLICY IF EXISTS "Admins can manage specialist questions" ON specialist_questions;

-- Policy to allow anyone to view active questions (including anonymous users)
CREATE POLICY "Select specialist questions"
ON specialist_questions
FOR SELECT
TO anon
USING (is_active = true);

-- Policy to allow authenticated users to view active questions
CREATE POLICY "Authenticated users can view active questions"
ON specialist_questions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy to allow authenticated users to manage questions
CREATE POLICY "Manage specialist questions"
ON specialist_questions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON specialist_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON specialist_questions TO authenticated;

-- Ensure all existing questions are active
UPDATE specialist_questions
SET is_active = true
WHERE is_active IS NULL; 