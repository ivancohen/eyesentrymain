-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Doctors can view responses for their patients" ON specialist_responses;
DROP POLICY IF EXISTS "Allow response creation with valid access code" ON specialist_responses;

-- Enable RLS
ALTER TABLE specialist_responses ENABLE ROW LEVEL SECURITY;

-- Policy for doctors to view responses for their patients
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
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND (auth.users.raw_app_meta_data->>'role' = 'admin')::boolean = true
                )
            )
        )
    );

-- Policy for specialists to create responses with valid access code
CREATE POLICY "Allow response creation with valid access code"
    ON specialist_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM patient_access_codes
            WHERE patient_access_codes.patient_id = specialist_responses.patient_id
            AND patient_access_codes.is_active = true
            AND patient_access_codes.expires_at > TIMEZONE('utc'::text, NOW())
        )
    );

-- Grant necessary permissions
GRANT SELECT ON specialist_responses TO authenticated;
GRANT INSERT ON specialist_responses TO authenticated;

-- Grant permissions to reference tables
GRANT SELECT ON patient_access_codes TO authenticated;
GRANT SELECT ON patients TO authenticated;

-- Add comment explaining the changes
COMMENT ON TABLE specialist_responses IS 'Stores specialist responses with RLS policies for doctor access and specialist submission'; 