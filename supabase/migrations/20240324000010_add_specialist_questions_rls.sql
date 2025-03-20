-- Enable RLS on specialist_questions table
ALTER TABLE specialist_questions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Select specialist questions" ON specialist_questions;
DROP POLICY IF EXISTS "Manage specialist questions" ON specialist_questions;

-- Policy to allow any authenticated user to view questions
CREATE POLICY "Select specialist questions"
ON specialist_questions
FOR SELECT
TO authenticated
USING (true);  -- Allow viewing all questions, active status checked in application

-- Policy to allow authenticated users to manage questions
CREATE POLICY "Manage specialist questions"
ON specialist_questions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON specialist_questions TO authenticated; 