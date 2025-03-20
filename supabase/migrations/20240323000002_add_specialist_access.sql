-- Create tables for specialist access system
CREATE TABLE IF NOT EXISTS patient_access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    access_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT unique_active_code UNIQUE (patient_id, access_code)
);

CREATE TABLE IF NOT EXISTS specialist_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('text', 'select')),
    display_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    required BOOLEAN DEFAULT false,
    dropdown_options TEXT[] DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS specialist_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES specialist_questions(id),
    response TEXT NOT NULL,
    specialist_name TEXT NOT NULL,
    specialist_credentials TEXT NOT NULL,
    specialty TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_response CHECK (response != '')
);

-- Create indexes for performance
CREATE INDEX idx_access_codes_patient ON patient_access_codes(patient_id);
CREATE INDEX idx_access_codes_code ON patient_access_codes(access_code) WHERE is_active = true;
CREATE INDEX idx_specialist_questions_order ON specialist_questions(display_order) WHERE is_active = true;
CREATE INDEX idx_specialist_responses_patient ON specialist_responses(patient_id);

-- Function to generate a unique access code
CREATE OR REPLACE FUNCTION generate_unique_access_code(p_patient_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 12-character code
        v_code := encode(gen_random_bytes(9), 'base64');
        -- Remove any non-alphanumeric characters
        v_code := regexp_replace(v_code, '[^a-zA-Z0-9]', '', 'g');
        -- Take first 12 characters
        v_code := substring(v_code, 1, 12);
        
        -- Check if code exists
        SELECT EXISTS (
            SELECT 1 
            FROM patient_access_codes 
            WHERE access_code = v_code 
            AND is_active = true
        ) INTO v_exists;
        
        -- Exit loop if unique code found
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    RETURN v_code;
END;
$$;

-- Function to create a new access code
CREATE OR REPLACE FUNCTION create_patient_access_code(p_patient_id UUID, p_created_by UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Deactivate any existing active codes for this patient
    UPDATE patient_access_codes
    SET is_active = false
    WHERE patient_id = p_patient_id
    AND is_active = true;
    
    -- Generate new code
    v_code := generate_unique_access_code(p_patient_id);
    
    -- Insert new access code
    INSERT INTO patient_access_codes (
        patient_id,
        access_code,
        created_by,
        expires_at
    ) VALUES (
        p_patient_id,
        v_code,
        p_created_by,
        TIMEZONE('utc'::text, NOW()) + INTERVAL '30 days'
    );
    
    RETURN v_code;
END;
$$;

-- Function to validate access code
CREATE OR REPLACE FUNCTION validate_access_code(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient_id UUID;
BEGIN
    SELECT patient_id INTO v_patient_id
    FROM patient_access_codes
    WHERE access_code = p_code
    AND is_active = true
    AND expires_at > TIMEZONE('utc'::text, NOW());
    
    RETURN v_patient_id;
END;
$$;

-- Add RLS policies
ALTER TABLE patient_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_responses ENABLE ROW LEVEL SECURITY;

-- Policies for patient_access_codes
CREATE POLICY "Doctors can manage access codes for their patients"
    ON patient_access_codes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = patient_id
            AND patients.doctor_id = auth.uid()
        )
    );

-- Policies for specialist_questions
CREATE POLICY "Anyone can view active specialist questions"
    ON specialist_questions
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage specialist questions"
    ON specialist_questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Policies for specialist_responses
CREATE POLICY "Doctors can view responses for their patients"
    ON specialist_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM patients
            WHERE patients.id = patient_id
            AND patients.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Allow response creation with valid access code"
    ON specialist_responses
    FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM patient_access_codes
            WHERE patient_id = specialist_responses.patient_id
            AND access_code = current_setting('request.jwt.claims')::json->>'access_code'
            AND is_active = true
            AND expires_at > TIMEZONE('utc'::text, NOW())
        )
    ); 