// Script to apply the patient names restore point
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
const sqlFilePath = path.join(__dirname, 'supabase', 'create_patient_names_restore_point.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function executeSQL() {
  console.log('===================================================');
  console.log('Applying Patient Names Restore Point');
  console.log('===================================================');
  console.log();

  try {
    console.log('Executing restore point creation script...');
    const { error } = await supabase.rpc('execute_sql', { sql_statement: sqlContent });

    if (error) {
      console.error('Error applying restore point:', error.message);
    } else {
      console.log('Restore point created successfully.');
      console.log('You can now run SELECT restore_patient_names_system(); in Supabase SQL editor to restore.');
    }

    console.log();
  } catch (error) {
    console.error('Error executing script:', error.message);
  }
}

executeSQL();