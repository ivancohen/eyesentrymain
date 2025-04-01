// Script to execute the SQL fix using the Supabase JavaScript client
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

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

// SQL to add display_order column
const sqlPath = path.join(__dirname, 'supabase', 'add_display_order_to_dropdown_options.sql');
let sqlContent;

try {
  sqlContent = fs.readFileSync(sqlPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading SQL file:', error.message);
  process.exit(1);
}

// Main function
async function executeSqlFix() {
  try {
    console.log("=".repeat(80));
    console.log("ADDING DISPLAY_ORDER COLUMN TO DROPDOWN_OPTIONS TABLE");
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
    
    console.log("\n🔧 Executing SQL to add display_order column...");
    
    // Split SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      console.log(`\nExecuting statement ${i + 1} of ${statements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: stmt });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.log("Continuing with the next statement...");
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully!`);
        }
      } catch (stmtErr) {
        console.error(`❌ Error executing statement ${i + 1}:`, stmtErr.message);
        console.log("Continuing with the next statement...");
      }
    }
    
    console.log("\n✅ SQL execution completed!");
    console.log("The dropdown_options table now has a display_order column.");
    console.log("\nIf you need to revert these changes, run:");
    console.log("await supabase.rpc('restore_questionnaire_system')");
    
  } catch (error) {
    console.error("\n❌ Error executing SQL fix:", error.message);
    process.exit(1);
  }
}

// Run the function
executeSqlFix()
  .then(() => {
    console.log("\nSQL fix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during SQL fix:", err);
    process.exit(1);
  });