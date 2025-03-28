-- Update the get_patient_questionnaires_for_user function to update first_name and last_name from metadata
-- This function is used to fetch questionnaires for the current user

-- First, create a function to update first_name and last_name from metadata
CREATE OR REPLACE FUNCTION public.update_names_from_metadata(questionnaire patient_questionnaires)
RETURNS patient_questionnaires AS $$
DECLARE
    updated_questionnaire patient_questionnaires;
BEGIN
    updated_questionnaire := questionnaire;
    
    -- Update first_name from metadata.firstName if first_name is empty
    IF (updated_questionnaire.first_name IS NULL OR updated_questionnaire.first_name = '') AND 
       updated_questionnaire.metadata IS NOT NULL AND 
       updated_questionnaire.metadata->>'firstName' IS NOT NULL THEN
        updated_questionnaire.first_name := updated_questionnaire.metadata->>'firstName';
    END IF;
    
    -- Update last_name from metadata.lastName if last_name is empty
    IF (updated_questionnaire.last_name IS NULL OR updated_questionnaire.last_name = '') AND 
       updated_questionnaire.metadata IS NOT NULL AND 
       updated_questionnaire.metadata->>'lastName' IS NOT NULL THEN
        updated_questionnaire.last_name := updated_questionnaire.metadata->>'lastName';
    END IF;
    
    RETURN updated_questionnaire;
END;
$$ LANGUAGE plpgsql;

-- Update the get_patient_questionnaires_for_user function
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF public.patient_questionnaires AS $$
DECLARE
    q patient_questionnaires;
BEGIN
    -- Ensure the user requesting the data is either the owner, doctor, or an admin
    IF auth.uid() = user_id_param OR 
       EXISTS (SELECT 1 FROM public.patient_questionnaires WHERE doctor_id = auth.uid() AND user_id = user_id_param) OR
       auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin')
    THEN
        -- Get all questionnaires for the user
        FOR q IN
            SELECT * FROM public.patient_questionnaires
            WHERE user_id = user_id_param
            ORDER BY created_at DESC
        LOOP
            -- Update first_name and last_name from metadata
            q := public.update_names_from_metadata(q);
            
            -- Also update the questionnaire in the database
            UPDATE public.patient_questionnaires
            SET 
                first_name = q.first_name,
                last_name = q.last_name
            WHERE id = q.id;
            
            -- Return the updated questionnaire
            RETURN NEXT q;
        END LOOP;
    ELSE
        RAISE EXCEPTION 'Access denied: Not authorized to view this data';
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_names_from_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_questionnaires_for_user TO authenticated;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Updated get_patient_questionnaires_for_user function to update names from metadata';
END $$;