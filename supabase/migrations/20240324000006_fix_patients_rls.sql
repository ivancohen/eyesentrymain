-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can manage their patients" ON patients;
DROP POLICY IF EXISTS "Anyone can view patient records with valid access" ON patients;

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create a function to check for valid access code
CREATE OR REPLACE FUNCTION has_valid_access_code(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM patient_access_codes
        WHERE patient_id = p_patient_id
        AND is_active = true
        AND expires_at > TIMEZONE('utc'::text, NOW())
    );
$$;

-- Create a function to check user access rights
CREATE OR REPLACE FUNCTION can_access_patient(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        EXISTS (
            SELECT 1 FROM patients 
            WHERE id = p_patient_id 
            AND (
                doctor_id = auth.uid() 
                OR (auth.jwt() ->> 'role')::text = 'admin'
            )
        )
        OR has_valid_access_code(p_patient_id);
$$;

-- Policy for viewing patients
CREATE POLICY "View patient records"
    ON patients
    FOR SELECT
    TO authenticated
    USING (
        doctor_id = auth.uid() 
        OR (auth.jwt() ->> 'role')::text = 'admin'
        OR has_valid_access_code(id)
    );

-- Policy for managing patients
CREATE POLICY "Manage patient records"
    ON patients
    FOR ALL
    TO authenticated
    USING (
        doctor_id = auth.uid() 
        OR (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Update specialist_responses policy to use the new function
DROP POLICY IF EXISTS "Doctors can view responses for their patients" ON specialist_responses;
CREATE POLICY "View specialist responses"
    ON specialist_responses
    FOR SELECT
    TO authenticated
    USING (can_access_patient(patient_id));

-- Grant necessary permissions
GRANT SELECT ON patients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT EXECUTE ON FUNCTION has_valid_access_code TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_patient TO authenticated;

-- Add comment explaining the changes
COMMENT ON TABLE patients IS 'Stores patient records with RLS policies for doctor access and specialist viewing'; 