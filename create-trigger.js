// Script to create a database trigger to handle the foreign key constraint issue
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

// SQL for the trigger function and trigger
const triggerFunctionSQL = `
CREATE OR REPLACE FUNCTION handle_created_by_constraint()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if created_by is the all-zeros UUID
  IF NEW.created_by = '00000000-0000-0000-0000-000000000000' THEN
    -- Set it to NULL instead
    NEW.created_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

const triggerSQL = `
DROP TRIGGER IF EXISTS set_null_created_by ON questions;
CREATE TRIGGER set_null_created_by
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION handle_created_by_constraint();
`;

// Main function
async function createTrigger() {
  try {
    console.log("=".repeat(80));
    console.log("CREATING DATABASE TRIGGER TO HANDLE FOREIGN KEY CONSTRAINT");
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
    console.log("\n1️⃣ Attempting to create trigger function using RPC...");
    
    try {
      const { error: rpcError } = await supabase.rpc('execute_sql', { 
        sql_query: triggerFunctionSQL
      });
      
      if (rpcError) {
        console.error("❌ Error using RPC:", rpcError.message);
        console.log("Will provide manual instructions...");
      } else {
        console.log("✅ Successfully created trigger function using RPC!");
        
        // Create the trigger
        console.log("\n2️⃣ Attempting to create trigger using RPC...");
        
        const { error: triggerError } = await supabase.rpc('execute_sql', { 
          sql_query: triggerSQL
        });
        
        if (triggerError) {
          console.error("❌ Error creating trigger:", triggerError.message);
          console.log("Will provide manual instructions...");
        } else {
          console.log("✅ Successfully created trigger using RPC!");
          return;
        }
      }
    } catch (rpcErr) {
      console.warn("⚠️ RPC not available:", rpcErr.message);
      console.log("Will provide manual instructions...");
    }
    
    // Provide manual instructions
    console.log("\n❌ Unable to create trigger directly.");
    console.log("Please execute the following SQL in your Supabase SQL editor:");
    console.log("\n-- Create the trigger function");
    console.log(triggerFunctionSQL);
    console.log("\n-- Create the trigger");
    console.log(triggerSQL);
    
    // Create a SQL file with the instructions
    const sqlFilePath = path.join(__dirname, 'handle_created_by_constraint.sql');
    fs.writeFileSync(sqlFilePath, triggerFunctionSQL + '\n\n' + triggerSQL);
    console.log(`\n✅ SQL file created at ${sqlFilePath}`);
    console.log("You can copy this file's contents to the Supabase SQL editor.");
    
  } catch (error) {
    console.error("\n❌ Error creating trigger:", error.message);
    process.exit(1);
  }
}

// Run the function
createTrigger()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during script execution:", err);
    process.exit(1);
  });