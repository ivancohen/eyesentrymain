-- Create specialist_consultation_links table
CREATE TABLE specialist_consultation_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_token TEXT NOT NULL UNIQUE,
    created_by_doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Create specialist_consultations table
CREATE TABLE specialist_consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_link_id UUID NOT NULL REFERENCES specialist_consultation_links(id) ON DELETE CASCADE,
    specialist_name TEXT NOT NULL,
    specialist_credentials TEXT NOT NULL,
    specialty TEXT NOT NULL,
    consultation_notes TEXT,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT fk_consultation_link FOREIGN KEY (consultation_link_id) REFERENCES specialist_consultation_links(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_consultation_links_token ON specialist_consultation_links(consultation_token);
CREATE INDEX idx_consultation_links_patient ON specialist_consultation_links(patient_id);
CREATE INDEX idx_consultations_link ON specialist_consultations(consultation_link_id);

-- Add RLS policies
ALTER TABLE specialist_consultation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_consultations ENABLE ROW LEVEL SECURITY;

-- Policies for specialist_consultation_links
CREATE POLICY "Doctors can create consultation links for their patients"
    ON specialist_consultation_links FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = patient_id
            AND patients.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can view their consultation links"
    ON specialist_consultation_links FOR SELECT
    TO authenticated
    USING (
        created_by_doctor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = patient_id
            AND patients.doctor_id = auth.uid()
        )
    );

-- Policies for specialist_consultations
CREATE POLICY "Anyone can create consultations with valid token"
    ON specialist_consultations FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM specialist_consultation_links
            WHERE specialist_consultation_links.id = consultation_link_id
            AND specialist_consultation_links.consultation_token = current_setting('request.jwt.claims')::json->>'token'
            AND specialist_consultation_links.is_used = FALSE
            AND specialist_consultation_links.expires_at > NOW()
        )
    );

CREATE POLICY "Doctors can view consultations for their patients"
    ON specialist_consultations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM specialist_consultation_links
            JOIN patients ON patients.id = specialist_consultation_links.patient_id
            WHERE specialist_consultation_links.id = consultation_link_id
            AND patients.doctor_id = auth.uid()
        )
    );

-- Function to generate a consultation link
CREATE OR REPLACE FUNCTION generate_consultation_link(
    p_patient_id UUID,
    p_expires_in_days INTEGER DEFAULT 30
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_link_id UUID;
BEGIN
    -- Generate a random token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create the consultation link
    INSERT INTO specialist_consultation_links (
        patient_id,
        consultation_token,
        created_by_doctor_id,
        expires_at
    )
    VALUES (
        p_patient_id,
        v_token,
        auth.uid(),
        NOW() + (p_expires_in_days || ' days')::INTERVAL
    )
    RETURNING id INTO v_link_id;
    
    -- Return the full URL
    RETURN 'https://c04b2383.eyesentrymed.pages.dev/specialist-consultation/' || v_token;
END;
$$; 