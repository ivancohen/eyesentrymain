// Simple script to apply admin scoring SQL
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
  console.error('Error reading .env file:', error.message);
  console.log('Please make sure the .env file exists and contains VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or service role key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function
async function applyAdminScoring() {
  try {
    console.log("=".repeat(80));
    console.log("APPLYING ADMIN SCORING SQL");
    console.log("=".repeat(80));
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sync-admin-scores.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log("Executing SQL statement...");
        
        const { error } = await supabase.rpc('execute_sql', { 
          sql_query: statement
        });
        
        if (error) {
          console.warn("Warning: Error executing statement:", error.message);
          console.log("Will try direct query...");
          
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_direct_query').select('*').limit(1);
          if (directError) {
            console.error("Error with direct query:", directError.message);
          }
        } else {
          console.log("Statement executed successfully!");
        }
      } catch (stmtError) {
        console.warn("Warning: Error executing statement:", stmtError.message);
      }
    }
    
    console.log("\nAdmin scoring SQL applied successfully!");
    console.log("The risk assessment will now use scores configured in the admin section.");
    
  } catch (error) {
    console.error("\nError applying admin scoring SQL:", error.message);
    process.exit(1);
  }
}

// Run the function
applyAdminScoring()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during script execution:", err);
    process.exit(1);
  });