// Script to fix patient names in questionnaires
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
const sqlFilePath = path.join(__dirname, 'supabase', 'fix_patient_names.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL content into individual statements
const statements = sqlContent
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

async function executeSQL() {
  console.log('===================================================');
  console.log('Fixing Patient Names in Questionnaires');
  console.log('===================================================');
  console.log();

  try {
    // Check if the metadata column exists in the patient_questionnaires table
    const { data: columns, error: columnsError } = await supabase
      .from('patient_questionnaires')
      .select('metadata')
      .limit(1);

    if (columnsError) {
      console.log('Checking if metadata column exists...');
      
      // Add metadata column if it doesn't exist
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql_statement: `
          ALTER TABLE public.patient_questionnaires
          ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
        `
      });

      if (alterError) {
        console.error('Error adding metadata column:', alterError.message);
      } else {
        console.log('Added metadata column to patient_questionnaires table');
      }
    } else {
      console.log('Metadata column already exists in patient_questionnaires table');
    }

    // Update the insert_patient_questionnaire function
    console.log('Updating insert_patient_questionnaire function...');
    
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
          first_name TEXT,
          last_name TEXT,
          age TEXT,
          race TEXT,
          family_glaucoma BOOLEAN,
          ocular_steroid BOOLEAN,
          steroid_type TEXT,
          intravitreal BOOLEAN,
          intravitreal_type TEXT,
          systemic_steroid BOOLEAN,
          systemic_steroid_type TEXT,
          iop_baseline BOOLEAN,
          vertical_asymmetry BOOLEAN,
          vertical_ratio BOOLEAN,
          total_score INTEGER,
          risk_level TEXT,
          metadata JSONB DEFAULT '{}'::jsonb
        ) RETURNS UUID AS $$
        DECLARE
          new_id UUID;
          doctor_user_id UUID;
        BEGIN
          -- Find a doctor user for doctor_id, or use the current user as fallback
          SELECT id INTO doctor_user_id 
          FROM auth.users 
          WHERE raw_app_meta_data->>'requestRole' = 'doctor' 
          LIMIT 1;
          
          -- If no doctor found, use the current user
          IF doctor_user_id IS NULL THEN
            doctor_user_id := auth.uid();
          END IF;

          -- Insert and capture the returned ID
          INSERT INTO public.patient_questionnaires (
            user_id,
            patient_id,
            doctor_id,
            first_name,
            last_name,
            age,
            race,
            family_glaucoma,
            ocular_steroid,
            steroid_type,
            intravitreal,
            intravitreal_type,
            systemic_steroid,
            systemic_steroid_type,
            iop_baseline,
            vertical_asymmetry,
            vertical_ratio,
            total_score,
            risk_level,
            metadata
          ) VALUES (
            auth.uid(),
            auth.uid(), -- Use current user ID for patient_id
            doctor_user_id, -- Use found doctor or current user for doctor_id
            first_name,
            last_name,
            age,
            race,
            family_glaucoma,
            ocular_steroid,
            steroid_type,
            intravitreal,
            intravitreal_type,
            systemic_steroid,
            systemic_steroid_type,
            iop_baseline,
            vertical_asymmetry,
            vertical_ratio,
            total_score,
            risk_level,
            metadata
          ) RETURNING id INTO new_id;

          RETURN new_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (functionError) {
      console.error('Error updating function:', functionError.message);
    } else {
      console.log('Updated insert_patient_questionnaire function to handle metadata');
    }

    // Grant execute permission to authenticated users
    console.log('Granting execute permission to authenticated users...');
    
    const { error: grantError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        GRANT EXECUTE ON FUNCTION public.insert_patient_questionnaire TO authenticated;
      `
    });

    if (grantError) {
      console.error('Error granting permission:', grantError.message);
    } else {
      console.log('Granted execute permission to authenticated users');
    }

    console.log();
    console.log('Done! The patient names should now be saved correctly in questionnaires.');
    console.log();
  } catch (error) {
    console.error('Error executing SQL:', error.message);
  }
}

executeSQL();