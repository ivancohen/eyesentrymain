// Script to make the created_by field nullable in the questions table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      envVars[key] = value;
    }
  });

  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  console.log('Please make sure the .env file exists and contains VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or service role key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function
async function makeCreatedByNullable() {
  try {
    console.log("=".repeat(80));
    console.log("MAKING CREATED_BY FIELD NULLABLE IN QUESTIONS TABLE");
    console.log("=".repeat(80));
    
    console.log("\n📦 Creating a restore point first...");
    try {
      const { data: restoreData, error: restoreError } = await supabase.rpc('create_questionnaire_restore_point');
      
      if (restoreError) {
        console.warn("⚠️ Warning: Could not create restore point:", restoreError.message);
        console.log("Continuing with the fix...");
      } else {
        console.log("✅ Restore point created successfully!");
      }
    } catch (restoreErr) {
      console.warn("⚠️ Warning: Could not create restore point:", restoreErr.message);
      console.log("Continuing with the fix...");
    }
    
    // Try to execute the SQL directly using RPC
    console.log("\n1️⃣ Attempting to make created_by nullable using RPC...");
    
    try {
      const { error: rpcError } = await supabase.rpc('execute_sql', { 
        sql_query: 'ALTER TABLE public.questions ALTER COLUMN created_by DROP NOT NULL'
      });
      
      if (rpcError) {
        console.error("❌ Error using RPC:", rpcError.message);
        console.log("Will try direct approach...");
      } else {
        console.log("✅ Successfully made created_by nullable using RPC!");
        return;
      }
    } catch (rpcErr) {
      console.warn("⚠️ RPC not available:", rpcErr.message);
      console.log("Will try direct approach...");
    }
    
    // Try a different approach using a direct query
    console.log("\n2️⃣ Attempting to make created_by nullable using direct query...");
    
    // First, check if the column is already nullable
    const { data: columnInfo, error: columnError } = await supabase
      .from('questions')
      .select('created_by')
      .limit(1);
    
    if (columnError) {
      console.error("❌ Error checking column:", columnError.message);
      throw columnError;
    }
    
    // Try to insert a question with null created_by to test if it's already nullable
    try {
      const testQuestion = {
        question: 'Test Question - Will be deleted',
        page_category: 'test',
        question_type: 'text',
        display_order: 999,
        risk_score: 0,
        has_dropdown_options: false,
        has_conditional_items: false,
        has_dropdown_scoring: false,
        status: 'Inactive',
        created_by: null
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('questions')
        .insert([testQuestion])
        .select();
      
      if (insertError) {
        if (insertError.message.includes('violates not-null constraint')) {
          console.log("Column is NOT NULL. Need to modify it.");
          
          // We can't modify the schema directly without RPC, so we need to provide instructions
          console.log("\n❌ Unable to modify the schema directly.");
          console.log("Please execute the following SQL in your Supabase SQL editor:");
          console.log("\nALTER TABLE public.questions ALTER COLUMN created_by DROP NOT NULL;");
          console.log("\nAlternatively, you can:");
          console.log("1. Go to the Supabase dashboard");
          console.log("2. Navigate to the 'Table Editor'");
          console.log("3. Select the 'questions' table");
          console.log("4. Find the 'created_by' column");
          console.log("5. Edit the column and uncheck the 'Not Null' option");
          console.log("6. Save the changes");
        } else {
          console.error("❌ Error testing column:", insertError.message);
        }
      } else {
        console.log("✅ The created_by column is already nullable!");
        
        // Clean up the test question
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.warn("⚠️ Warning: Could not delete test question:", deleteError.message);
        } else {
          console.log("✅ Test question deleted successfully.");
        }
      }
    } catch (testErr) {
      console.error("❌ Error testing column:", testErr.message);
    }
    
  } catch (error) {
    console.error("\n❌ Error making created_by nullable:", error.message);
    process.exit(1);
  }
}

// Run the function
makeCreatedByNullable()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during script execution:", err);
    process.exit(1);
  });