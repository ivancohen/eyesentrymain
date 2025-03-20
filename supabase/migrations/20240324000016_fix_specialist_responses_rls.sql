-- Drop existing policies
DROP POLICY IF EXISTS "Select specialist responses" ON specialist_responses;
DROP POLICY IF EXISTS "Manage specialist responses" ON specialist_responses;
DROP POLICY IF EXISTS "Anyone can view specialist responses" ON specialist_responses;
DROP POLICY IF EXISTS "Admins can manage specialist responses" ON specialist_responses;

-- Policy to allow anyone to insert responses (including anonymous users)
CREATE POLICY "Insert specialist responses"
ON specialist_responses
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy to allow authenticated users to view responses
CREATE POLICY "View specialist responses"
ON specialist_responses
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to manage responses
CREATE POLICY "Manage specialist responses"
ON specialist_responses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON specialist_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON specialist_responses TO authenticated; 