// Script to apply the dropdown options synchronization SQL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client if credentials are available
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Path to SQL file
const sqlFilePath = path.join(__dirname, 'supabase', 'sync_dropdown_options.sql');

// Main function
async function syncDropdownOptions() {
  try {
    console.log("=".repeat(80));
    console.log("SYNCHRONIZING DROPDOWN OPTIONS");
    console.log("=".repeat(80));
    
    // Check if SQL file exists
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: SQL file not found at ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    if (!supabase) {
      console.log("Supabase credentials not available. Cannot execute SQL directly.");
      console.log("\nTo apply this SQL, you have two options:");
      console.log("1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables and run this script again");
      console.log("2. Copy the SQL content below and execute it in the Supabase SQL Editor:");
      console.log("\n------------------ SQL CONTENT ------------------\n");
      console.log(sqlContent);
      console.log("\n------------------ END SQL CONTENT ------------------\n");
      return;
    }
    
    console.log("Executing SQL script to sync dropdown options...");
    
    // Execute SQL script
    const { error } = await supabase.rpc('execute_sql', { sql: sqlContent });
    
    if (error) {
      console.error("Error executing SQL script:", error);
      console.log("\nYou can apply this SQL manually using the Supabase SQL Editor:");
      console.log("\n------------------ SQL CONTENT ------------------\n");
      console.log(sqlContent);
      console.log("\n------------------ END SQL CONTENT ------------------\n");
      throw new Error(error.message);
    }
    
    console.log("✅ Dropdown options synchronized successfully");
    console.log("\nThe synchronization has:");
    console.log("1. Created or updated the question_options table");
    console.log("2. Copied all dropdown_options data to question_options");
    console.log("3. Set up a trigger to keep them in sync automatically");
    console.log("4. Created a combined view for compatibility");
    
    console.log("\nThe patient questionnaire should now correctly display dropdown options and scores.");
    
    console.log("\n=".repeat(80));
    console.log("DROPDOWN OPTIONS SYNCHRONIZATION COMPLETE");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("Error applying synchronization:", error);
    process.exit(1);
  }
}

// Run the function
syncDropdownOptions()
  .then(() => {
    console.log("\nSync script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during sync execution:", err);
    process.exit(1);
  });