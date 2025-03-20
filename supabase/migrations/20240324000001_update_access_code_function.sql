-- Update the create_patient_access_code function to ensure patient exists
CREATE OR REPLACE FUNCTION create_patient_access_code(p_patient_id UUID, p_created_by UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Ensure patient exists
    PERFORM ensure_patient_exists(p_patient_id, p_created_by);
    
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