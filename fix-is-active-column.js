// Script to properly fix the is_active column issue
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
dotenv.config();

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixIsActiveColumn() {
  try {
    console.log("Fixing is_active column in questions table...");
    
    // Run SQL to properly add the is_active column and refresh the schema
    const sql = `
      -- Make sure the column exists
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      
      -- Create index on is_active column for better performance
      CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);
      
      -- Refresh the PostgREST schema cache
      NOTIFY pgrst, 'reload schema';
    `;
    
    // Execute the SQL using the execute_sql function
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_statement: sql
    });
    
    if (error) {
      console.error("Error executing SQL:", error);
      
      // Try alternative approach if first method fails
      console.log("Trying alternative approach...");
      
      // Try to update a record directly to see if the column is accessible
      const { error: updateError } = await supabase
        .from('questions')
        .update({ is_active: true })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Using a fake ID to test
        
      if (updateError && updateError.code === 'PGRST204') {
        console.error("Column is still not accessible via API. You may need to restart the Supabase service.");
      } else {
        console.log("Column seems to be accessible now.");
      }
    } else {
      console.log("SQL executed successfully!");
      console.log("Result:", data);
    }
    
    // Now let's check if we can use the column
    console.log("Testing if is_active column is accessible...");
    
    // Get one question to test
    const { data: testQuestion, error: testError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error("Error fetching test question:", testError);
    } else if (testQuestion && testQuestion.length > 0) {
      // Try to update the is_active column
      const { error: updateError } = await supabase
        .from('questions')
        .update({ is_active: true })
        .eq('id', testQuestion[0].id);
        
      if (updateError) {
        console.error("Error updating is_active column:", updateError);
        console.log("You may need to restart the Supabase service or try a different approach.");
      } else {
        console.log("✅ is_active column is now working properly!");
      }
    }
    
    console.log("Fix attempt completed!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the function
fixIsActiveColumn();