// Script to execute SQL fixes for the questionnaire system
import fs from 'fs';
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

// Read SQL file
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('Please provide an SQL file path as an argument');
  process.exit(1);
}

console.log(`Reading SQL file: ${sqlFilePath}`);
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Execute SQL
async function executeSql() {
  try {
    console.log("Executing SQL...");
    console.log(`SQL file size: ${sqlContent.length} characters`);
    
    // Execute the SQL using Supabase's SQL endpoint
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_statement: sqlContent
    });
    
    if (error) {
      console.error("Error executing SQL:", error);
      process.exit(1);
    }
    
    console.log("SQL executed successfully!");
    console.log("Result:", data);
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the function
executeSql();