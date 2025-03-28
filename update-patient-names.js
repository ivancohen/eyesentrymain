// Script to update existing patient names from metadata
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
const sqlFilePath = path.join(__dirname, 'supabase', 'update_existing_patient_names.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL content into individual statements
const statements = sqlContent
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

async function executeSQL() {
  console.log('===================================================');
  console.log('Updating Patient Names from Metadata');
  console.log('===================================================');
  console.log();

  try {
    // First, check if there are questionnaires with empty names but metadata
    const { data: emptyNames, error: emptyNamesError } = await supabase
      .from('patient_questionnaires')
      .select('id, first_name, last_name, metadata')
      .or('first_name.is.null,first_name.eq.,last_name.is.null,last_name.eq.')
      .not('metadata', 'is', null);

    if (emptyNamesError) {
      console.error('Error checking for empty names:', emptyNamesError.message);
    } else {
      console.log(`Found ${emptyNames?.length || 0} questionnaires with empty names but metadata`);
    }

    // Update first_name from metadata.firstName if first_name is empty
    const { error: updateFirstNameError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        UPDATE patient_questionnaires
        SET first_name = metadata->>'firstName'
        WHERE (first_name IS NULL OR first_name = '')
        AND metadata IS NOT NULL
        AND metadata->>'firstName' IS NOT NULL;
      `
    });

    if (updateFirstNameError) {
      console.error('Error updating first names:', updateFirstNameError.message);
    } else {
      console.log('Updated first names from metadata');
    }

    // Update last_name from metadata.lastName if last_name is empty
    const { error: updateLastNameError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        UPDATE patient_questionnaires
        SET last_name = metadata->>'lastName'
        WHERE (last_name IS NULL OR last_name = '')
        AND metadata IS NOT NULL
        AND metadata->>'lastName' IS NOT NULL;
      `
    });

    if (updateLastNameError) {
      console.error('Error updating last names:', updateLastNameError.message);
    } else {
      console.log('Updated last names from metadata');
    }

    // Create the trigger function
    const { error: triggerFunctionError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION update_patient_names_trigger()
        RETURNS TRIGGER AS $$
        BEGIN
            -- If first_name is empty but metadata.firstName exists, use that
            IF (NEW.first_name IS NULL OR NEW.first_name = '') AND 
               NEW.metadata IS NOT NULL AND 
               NEW.metadata->>'firstName' IS NOT NULL THEN
                NEW.first_name := NEW.metadata->>'firstName';
            END IF;
            
            -- If last_name is empty but metadata.lastName exists, use that
            IF (NEW.last_name IS NULL OR NEW.last_name = '') AND 
               NEW.metadata IS NOT NULL AND 
               NEW.metadata->>'lastName' IS NOT NULL THEN
                NEW.last_name := NEW.metadata->>'lastName';
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (triggerFunctionError) {
      console.error('Error creating trigger function:', triggerFunctionError.message);
    } else {
      console.log('Created trigger function');
    }

    // Drop the trigger if it exists
    const { error: dropTriggerError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        DROP TRIGGER IF EXISTS patient_names_trigger ON patient_questionnaires;
      `
    });

    if (dropTriggerError) {
      console.error('Error dropping trigger:', dropTriggerError.message);
    } else {
      console.log('Dropped existing trigger if it existed');
    }

    // Create the trigger
    const { error: createTriggerError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE TRIGGER patient_names_trigger
        BEFORE INSERT OR UPDATE ON patient_questionnaires
        FOR EACH ROW
        EXECUTE FUNCTION update_patient_names_trigger();
      `
    });

    if (createTriggerError) {
      console.error('Error creating trigger:', createTriggerError.message);
    } else {
      console.log('Created trigger');
    }

    // Check how many questionnaires now have names
    const { data: withNames, error: withNamesError } = await supabase
      .from('patient_questionnaires')
      .select('id')
      .not('first_name', 'is', null)
      .not('first_name', 'eq', '')
      .not('last_name', 'is', null)
      .not('last_name', 'eq', '');

    if (withNamesError) {
      console.error('Error checking for questionnaires with names:', withNamesError.message);
    } else {
      console.log(`Total questionnaires with names: ${withNames?.length || 0}`);
    }

    console.log();
    console.log('Done! Patient names have been updated from metadata.');
    console.log();
  } catch (error) {
    console.error('Error executing SQL:', error.message);
  }
}

executeSQL();