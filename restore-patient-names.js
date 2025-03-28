// Script to restore the patient names system
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use the service role key for restore operations if needed

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or a service role key) are set.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeRestore() {
  console.log('===================================================');
  console.log('Restoring Patient Names System');
  console.log('===================================================');
  console.log();

  try {
    console.log('Calling restore_patient_names_system() function...');
    const { error } = await supabase.rpc('restore_patient_names_system');

    if (error) {
      console.error('Error restoring system:', error.message);
    } else {
      console.log('Patient names system restored successfully.');
    }

    console.log();
  } catch (error) {
    console.error('Error executing restore script:', error.message);
  }
}

executeRestore();