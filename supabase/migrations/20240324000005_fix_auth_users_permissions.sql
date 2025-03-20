-- Grant necessary permissions for auth.users table
GRANT SELECT ON auth.users TO authenticated;

-- Update specialist_responses RLS policy to avoid direct auth.users access
DROP POLICY IF EXISTS "Doctors can view responses for their patients" ON specialist_responses;
CREATE POLICY "Doctors can view responses for their patients"
    ON specialist_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = specialist_responses.patient_id
            AND (
                patients.doctor_id = auth.uid() OR
                (auth.jwt() ->> 'role')::text = 'admin'
            )
        )
    );

-- Update specialist_questions RLS policy to avoid direct auth.users access
DROP POLICY IF EXISTS "Admins can manage specialist questions" ON specialist_questions;
CREATE POLICY "Admins can manage specialist questions"
    ON specialist_questions
    FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Add function to check admin status without accessing auth.users directly
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() ->> 'role')::text = 'admin';
$$; 