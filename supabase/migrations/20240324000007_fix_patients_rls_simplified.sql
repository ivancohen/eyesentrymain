-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can manage their patients" ON patients;
DROP POLICY IF EXISTS "Anyone can view patient records with valid access" ON patients;
DROP POLICY IF EXISTS "View patient records" ON patients;
DROP POLICY IF EXISTS "Manage patient records" ON patients;

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for selecting patients
CREATE POLICY "Select patients"
    ON patients
    FOR SELECT
    TO authenticated
    USING (true);  -- Allow any authenticated user to select from patients table

-- Create a policy for managing patients (insert, update, delete)
CREATE POLICY "Manage patients"
    ON patients
    FOR ALL
    TO authenticated
    USING (
        doctor_id = auth.uid() OR
        (SELECT (auth.jwt() ->> 'role')::text = 'admin')
    );

-- Grant necessary permissions
GRANT SELECT ON patients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON patients TO authenticated;

-- Add comment explaining the changes
COMMENT ON TABLE patients IS 'Stores patient records with simplified RLS policies'; 