// Script to update the get_patient_questionnaires_for_user function
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'supabase', 'update_get_patient_questionnaires_function.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL content into individual statements
const statements = sqlContent
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

async function executeSQL() {
  console.log('===================================================');
  console.log('Updating get_patient_questionnaires_for_user Function');
  console.log('===================================================');
  console.log();

  try {
    // Create the update_names_from_metadata function
    const { error: updateNamesError } = await supabase.rpc('execute_sql', {
      sql_statement: `
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
      `
    });

    if (updateNamesError) {
      console.error('Error creating update_names_from_metadata function:', updateNamesError.message);
    } else {
      console.log('Created update_names_from_metadata function');
    }

    // Update the get_patient_questionnaires_for_user function
    const { error: updateFunctionError } = await supabase.rpc('execute_sql', {
      sql_statement: `
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
      `
    });

    if (updateFunctionError) {
      console.error('Error updating get_patient_questionnaires_for_user function:', updateFunctionError.message);
    } else {
      console.log('Updated get_patient_questionnaires_for_user function');
    }

    // Grant execute permissions
    const { error: grantError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        GRANT EXECUTE ON FUNCTION public.update_names_from_metadata TO authenticated;
        GRANT EXECUTE ON FUNCTION public.get_patient_questionnaires_for_user TO authenticated;
      `
    });

    if (grantError) {
      console.error('Error granting execute permissions:', grantError.message);
    } else {
      console.log('Granted execute permissions');
    }

    console.log();
    console.log('Done! The get_patient_questionnaires_for_user function has been updated.');
    console.log('Patient names should now be displayed correctly in the questionnaires list.');
    console.log();
  } catch (error) {
    console.error('Error executing SQL:', error.message);
  }
}

executeSQL();