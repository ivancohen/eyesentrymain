-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients table
CREATE POLICY "Doctors can manage their patients"
    ON patients
    FOR ALL
    TO authenticated
    USING (
        doctor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_app_meta_data->>'role' = 'admin')::boolean = true
        )
    );

-- Function to ensure patient record exists
CREATE OR REPLACE FUNCTION ensure_patient_exists(
    p_patient_id UUID,
    p_doctor_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the patient record if it doesn't exist
    INSERT INTO patients (id, doctor_id)
    VALUES (p_patient_id, p_doctor_id)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN p_patient_id;
END;
$$; 