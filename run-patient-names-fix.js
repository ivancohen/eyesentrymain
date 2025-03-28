// Script to run the comprehensive patient names fix
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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use service role key if needed for permissions

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'supabase', 'fix_patient_names_comprehensive.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function executeSQL() {
  console.log('===================================================');
  console.log('Running Comprehensive Patient Names Fix');
  console.log('===================================================');
  console.log();

  try {
    console.log('Executing comprehensive SQL script...');
    // Note: Supabase JS client might not handle multiple statements well via rpc('execute_sql').
    // It's generally better to run multi-statement SQL via the Supabase CLI or SQL editor.
    // However, we'll try executing the whole script. If it fails, run manually.
    const { error } = await supabase.rpc('execute_sql', { sql_statement: sqlContent });

    if (error) {
      console.error('---------------------------------------------------');
      console.error('Error executing comprehensive SQL script:');
      console.error(error.message);
      console.error('---------------------------------------------------');
      console.error('Please run the script manually in the Supabase SQL editor:');
      console.error(path.relative(process.cwd(), sqlFilePath));
      console.error('---------------------------------------------------');
    } else {
      console.log('Comprehensive patient names fix script executed successfully.');
      console.log('Patient names should now be saved and displayed correctly.');
    }

    console.log();
  } catch (error) {
    console.error('Error running script:', error.message);
  }
}

executeSQL();