-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active specialist questions" ON specialist_questions;
DROP POLICY IF EXISTS "Admins can manage specialist questions" ON specialist_questions;

-- Enable RLS
ALTER TABLE specialist_questions ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to view active questions
CREATE POLICY "Anyone can view active specialist questions"
    ON specialist_questions
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policy for admins to manage questions
CREATE POLICY "Admins can manage specialist questions"
    ON specialist_questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_app_meta_data->>'role' = 'admin')::boolean = true
        )
    );

-- Grant necessary permissions
GRANT SELECT ON specialist_questions TO authenticated;

-- Add comment explaining the changes
COMMENT ON TABLE specialist_questions IS 'Stores specialist questions with RLS policies for viewing and admin management'; 