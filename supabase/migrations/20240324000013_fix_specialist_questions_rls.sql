-- Drop existing policies
DROP POLICY IF EXISTS "Select specialist questions" ON specialist_questions;
DROP POLICY IF EXISTS "Manage specialist questions" ON specialist_questions;

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

-- Policy to allow authenticated users with admin role to manage questions
CREATE POLICY "Manage specialist questions"
ON specialist_questions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON specialist_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON specialist_questions TO authenticated; 