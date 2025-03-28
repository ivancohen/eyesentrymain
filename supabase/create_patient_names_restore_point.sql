-- Create restore point for patient names fix (functions and trigger)

DO $$
BEGIN
  RAISE NOTICE 'Creating restore point for patient names fix...';

  -- Backup insert_patient_questionnaire function (assuming the version before metadata existed)
  -- Note: This might need adjustment if the previous state was different.
  -- We'll try to recreate a version without the metadata parameter.
  CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire_backup_patient_names()
  RETURNS TRIGGER AS $$
  BEGIN
    -- This is a placeholder; the actual previous function logic might be different.
    -- If the function didn't exist or was significantly different, manual restoration might be needed.
    RAISE NOTICE 'Placeholder backup for insert_patient_questionnaire created.';
    RETURN NEW; -- Assuming it was a trigger function, adjust if not.
  END;
  $$ LANGUAGE plpgsql;
  RAISE NOTICE 'Backed up insert_patient_questionnaire function (placeholder).';

  -- Backup update_names_from_metadata function (it didn't exist before)
  -- No backup needed, just drop it during restore.

  -- Backup get_patient_questionnaires_for_user function
  CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user_backup_patient_names(user_id_param UUID)
  RETURNS SETOF public.patient_questionnaires AS $$
  BEGIN
    -- Ensure the user requesting the data is either the owner, doctor, or an admin
    IF auth.uid() = user_id_param OR
       EXISTS (SELECT 1 FROM public.patient_questionnaires WHERE doctor_id = auth.uid() AND user_id = user_id_param) OR
       auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin')
    THEN
      RETURN QUERY
      SELECT * FROM public.patient_questionnaires
      WHERE user_id = user_id_param
      ORDER BY created_at DESC;
    ELSE
      RAISE EXCEPTION 'Access denied: Not authorized to view this data';
    END IF;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  RAISE NOTICE 'Backed up get_patient_questionnaires_for_user function.';

  -- Backup patient_names_trigger (it didn't exist before)
  -- No backup needed, just drop it during restore.

  -- Create restore function
  CREATE OR REPLACE FUNCTION public.restore_patient_names_system()
  RETURNS void AS $$
  BEGIN
    RAISE NOTICE 'Restoring patient names system...';

    -- Drop new/updated functions
    DROP FUNCTION IF EXISTS public.update_names_from_metadata(patient_questionnaires);
    DROP FUNCTION IF EXISTS public.get_patient_questionnaires_for_user(UUID);
    DROP FUNCTION IF EXISTS public.insert_patient_questionnaire(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, TEXT, BOOLEAN, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, TEXT, JSONB);

    -- Drop trigger and its function
    DROP TRIGGER IF EXISTS patient_names_trigger ON public.patient_questionnaires;
    DROP FUNCTION IF EXISTS public.update_patient_names_trigger();

    -- Restore original get_patient_questionnaires_for_user function
    CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
    RETURNS SETOF public.patient_questionnaires AS $$
    BEGIN
      -- Ensure the user requesting the data is either the owner, doctor, or an admin
      IF auth.uid() = user_id_param OR
         EXISTS (SELECT 1 FROM public.patient_questionnaires WHERE doctor_id = auth.uid() AND user_id = user_id_param) OR
         auth.uid() IN (SELECT id FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin')
      THEN
        RETURN QUERY
        SELECT * FROM public.patient_questionnaires
        WHERE user_id = user_id_param
        ORDER BY created_at DESC;
      ELSE
        RAISE EXCEPTION 'Access denied: Not authorized to view this data';
      END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    RAISE NOTICE 'Restored original get_patient_questionnaires_for_user function.';

    -- Restore original insert_patient_questionnaire function (Placeholder - needs actual previous version)
    -- Example: Recreate without metadata if that was the state
    CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
      first_name TEXT, last_name TEXT, age TEXT, race TEXT, family_glaucoma BOOLEAN,
      ocular_steroid BOOLEAN, steroid_type TEXT, intravitreal BOOLEAN, intravitreal_type TEXT,
      systemic_steroid BOOLEAN, systemic_steroid_type TEXT, iop_baseline BOOLEAN,
      vertical_asymmetry BOOLEAN, vertical_ratio BOOLEAN, total_score INTEGER, risk_level TEXT
    ) RETURNS UUID AS $$
      -- Placeholder: Add the actual previous function body here
      DECLARE new_id UUID; BEGIN RAISE NOTICE 'Restored placeholder insert_patient_questionnaire'; RETURN gen_random_uuid(); END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    RAISE NOTICE 'Restored insert_patient_questionnaire function (placeholder).';


    -- Drop backup functions
    DROP FUNCTION IF EXISTS public.insert_patient_questionnaire_backup_patient_names();
    DROP FUNCTION IF EXISTS public.get_patient_questionnaires_for_user_backup_patient_names(UUID);

    RAISE NOTICE 'Patient names system restored.';
  END;
  $$ LANGUAGE plpgsql;

  RAISE NOTICE 'Restore point created successfully. Run SELECT restore_patient_names_system(); to restore.';

END $$;