-- Comprehensive fix for patient name saving and display issues

DO $$
BEGIN
  RAISE NOTICE 'Starting comprehensive patient names fix...';
END $$;

-- Step 1: Ensure metadata column exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'patient_questionnaires'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.patient_questionnaires
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to patient_questionnaires table.';
    ELSE
        RAISE NOTICE 'Metadata column already exists in patient_questionnaires table.';
    END IF;
END $$;

-- Step 2: Update the insert_patient_questionnaire function
CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
  p_first_name TEXT,
  p_last_name TEXT,
  p_age TEXT,
  p_race TEXT,
  p_family_glaucoma BOOLEAN,
  p_ocular_steroid BOOLEAN,
  p_steroid_type TEXT,
  p_intravitreal BOOLEAN,
  p_intravitreal_type TEXT,
  p_systemic_steroid BOOLEAN,
  p_systemic_steroid_type TEXT,
  p_iop_baseline BOOLEAN,
  p_vertical_asymmetry BOOLEAN,
  p_vertical_ratio BOOLEAN,
  p_total_score INTEGER,
  p_risk_level TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
  v_doctor_user_id UUID;
  v_final_first_name TEXT := p_first_name;
  v_final_last_name TEXT := p_last_name;
BEGIN
  RAISE NOTICE 'Executing insert_patient_questionnaire for % %', p_first_name, p_last_name;

  -- Ensure first_name and last_name are populated, falling back to metadata
  IF v_final_first_name IS NULL OR v_final_first_name = '' THEN
    v_final_first_name := p_metadata->>'firstName';
    RAISE NOTICE 'First name was empty, using metadata value: %', v_final_first_name;
  END IF;

  IF v_final_last_name IS NULL OR v_final_last_name = '' THEN
    v_final_last_name := p_metadata->>'lastName';
    RAISE NOTICE 'Last name was empty, using metadata value: %', v_final_last_name;
  END IF;

  -- Find a doctor user for doctor_id, or use the current user as fallback
  SELECT id INTO v_doctor_user_id
  FROM auth.users
  WHERE raw_app_meta_data->>'requestRole' = 'doctor'
  LIMIT 1;

  IF v_doctor_user_id IS NULL THEN
    v_doctor_user_id := auth.uid();
    RAISE NOTICE 'No doctor found, assigning current user % as doctor_id', v_doctor_user_id;
  END IF;

  -- Insert and capture the returned ID
  INSERT INTO public.patient_questionnaires (
    user_id, patient_id, doctor_id, first_name, last_name, age, race,
    family_glaucoma, ocular_steroid, steroid_type, intravitreal, intravitreal_type,
    systemic_steroid, systemic_steroid_type, iop_baseline, vertical_asymmetry,
    vertical_ratio, total_score, risk_level, metadata
  ) VALUES (
    auth.uid(), auth.uid(), v_doctor_user_id, v_final_first_name, v_final_last_name, p_age, p_race,
    p_family_glaucoma, p_ocular_steroid, p_steroid_type, p_intravitreal, p_intravitreal_type,
    p_systemic_steroid, p_systemic_steroid_type, p_iop_baseline, p_vertical_asymmetry,
    p_vertical_ratio, p_total_score, p_risk_level, p_metadata
  ) RETURNING id INTO v_new_id;

  RAISE NOTICE 'Inserted questionnaire with ID: %, Name: % %', v_new_id, v_final_first_name, v_final_last_name;
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.insert_patient_questionnaire(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, TEXT, BOOLEAN, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, TEXT, JSONB) TO authenticated;
RAISE NOTICE 'Updated insert_patient_questionnaire function.';

-- Step 3: Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.update_patient_names_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Trigger fired for questionnaire ID: %', COALESCE(NEW.id::text, OLD.id::text, 'N/A');
  -- If first_name is empty but metadata.firstName exists, use that
  IF (NEW.first_name IS NULL OR NEW.first_name = '') AND
     NEW.metadata IS NOT NULL AND
     NEW.metadata->>'firstName' IS NOT NULL AND
     NEW.metadata->>'firstName' != '' THEN
      NEW.first_name := NEW.metadata->>'firstName';
      RAISE NOTICE 'Trigger updated first_name to: %', NEW.first_name;
  END IF;

  -- If last_name is empty but metadata.lastName exists, use that
  IF (NEW.last_name IS NULL OR NEW.last_name = '') AND
     NEW.metadata IS NOT NULL AND
     NEW.metadata->>'lastName' IS NOT NULL AND
     NEW.metadata->>'lastName' != '' THEN
      NEW.last_name := NEW.metadata->>'lastName';
      RAISE NOTICE 'Trigger updated last_name to: %', NEW.last_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
RAISE NOTICE 'Created/Replaced update_patient_names_trigger_func function.';

-- Step 4: Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS patient_names_trigger ON public.patient_questionnaires;
RAISE NOTICE 'Dropped existing patient_names_trigger (if any).';

-- Step 5: Create the trigger
CREATE TRIGGER patient_names_trigger
BEFORE INSERT OR UPDATE ON public.patient_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.update_patient_names_trigger_func();
RAISE NOTICE 'Created patient_names_trigger.';

-- Step 6: Create or replace the helper function to update names from metadata
CREATE OR REPLACE FUNCTION public.update_names_from_metadata(questionnaire public.patient_questionnaires)
RETURNS public.patient_questionnaires AS $$
DECLARE
    updated_questionnaire public.patient_questionnaires := questionnaire;
BEGIN
    -- Update first_name from metadata.firstName if first_name is empty
    IF (updated_questionnaire.first_name IS NULL OR updated_questionnaire.first_name = '') AND
       updated_questionnaire.metadata IS NOT NULL AND
       updated_questionnaire.metadata->>'firstName' IS NOT NULL AND
       updated_questionnaire.metadata->>'firstName' != '' THEN
        updated_questionnaire.first_name := updated_questionnaire.metadata->>'firstName';
    END IF;

    -- Update last_name from metadata.lastName if last_name is empty
    IF (updated_questionnaire.last_name IS NULL OR updated_questionnaire.last_name = '') AND
       updated_questionnaire.metadata IS NOT NULL AND
       updated_questionnaire.metadata->>'lastName' IS NOT NULL AND
       updated_questionnaire.metadata->>'lastName' != '' THEN
        updated_questionnaire.last_name := updated_questionnaire.metadata->>'lastName';
    END IF;

    RETURN updated_questionnaire;
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION public.update_names_from_metadata(public.patient_questionnaires) TO authenticated;
RAISE NOTICE 'Created/Replaced update_names_from_metadata helper function.';

-- Step 7: Update the get_patient_questionnaires_for_user function
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF public.patient_questionnaires AS $$
DECLARE
    q public.patient_questionnaires;
    updated_q public.patient_questionnaires;
    needs_update BOOLEAN;
BEGIN
    -- Ensure the user requesting the data is either the owner, doctor, or an admin
    IF auth.uid() = user_id_param OR
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor') OR -- Check doctor role
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') -- Check admin role
    THEN
        RAISE NOTICE 'Fetching questionnaires for user: % by user: %', user_id_param, auth.uid();
        FOR q IN
            SELECT * FROM public.patient_questionnaires
            WHERE user_id = user_id_param
            ORDER BY created_at DESC
        LOOP
            needs_update := FALSE;
            updated_q := q; -- Start with the original record

            -- Check and update first name if necessary
            IF (updated_q.first_name IS NULL OR updated_q.first_name = '') AND
               updated_q.metadata IS NOT NULL AND
               updated_q.metadata->>'firstName' IS NOT NULL AND
               updated_q.metadata->>'firstName' != '' THEN
                updated_q.first_name := updated_q.metadata->>'firstName';
                needs_update := TRUE;
                RAISE NOTICE 'Need to update first name for ID: % to %', q.id, updated_q.first_name;
            END IF;

            -- Check and update last name if necessary
            IF (updated_q.last_name IS NULL OR updated_q.last_name = '') AND
               updated_q.metadata IS NOT NULL AND
               updated_q.metadata->>'lastName' IS NOT NULL AND
               updated_q.metadata->>'lastName' != '' THEN
                updated_q.last_name := updated_q.metadata->>'lastName';
                needs_update := TRUE;
                RAISE NOTICE 'Need to update last name for ID: % to %', q.id, updated_q.last_name;
            END IF;

            -- If an update was needed, persist it to the database
            IF needs_update THEN
                UPDATE public.patient_questionnaires
                SET
                    first_name = updated_q.first_name,
                    last_name = updated_q.last_name
                WHERE id = q.id;
                RAISE NOTICE 'Persisted name update for ID: %', q.id;
            END IF;

            -- Return the potentially updated record
            RETURN NEXT updated_q;
        END LOOP;
    ELSE
        RAISE EXCEPTION 'Access denied: Not authorized to view questionnaires for user %', user_id_param;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Keep SECURITY DEFINER if needed for auth checks

GRANT EXECUTE ON FUNCTION public.get_patient_questionnaires_for_user(UUID) TO authenticated;
RAISE NOTICE 'Updated get_patient_questionnaires_for_user function.';

-- Step 8: Update existing records (run once)
DO $$
DECLARE
    r RECORD;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Updating existing records...';
    FOR r IN SELECT * FROM public.patient_questionnaires
             WHERE (first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '')
               AND metadata IS NOT NULL
               AND (metadata->>'firstName' IS NOT NULL OR metadata->>'lastName' IS NOT NULL)
    LOOP
        UPDATE public.patient_questionnaires
        SET
            first_name = COALESCE(NULLIF(first_name, ''), metadata->>'firstName', first_name),
            last_name = COALESCE(NULLIF(last_name, ''), metadata->>'lastName', last_name)
        WHERE id = r.id;
        updated_count := updated_count + 1;
    END LOOP;
    RAISE NOTICE 'Updated % existing records with names from metadata.', updated_count;
END $$;


DO $$
BEGIN
  RAISE NOTICE 'Comprehensive patient names fix completed successfully.';
END $$;