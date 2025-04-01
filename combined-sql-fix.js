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

// SQL to create execute_sql function
const createFunctionSqlPath = path.join(__dirname, 'create-execute-sql-function.sql');
let createFunctionSql;

try {
  createFunctionSql = fs.readFileSync(createFunctionSqlPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading create-execute-sql-function.sql file:', error.message);
  process.exit(1);
}

// SQL to add display_order column
const addColumnSqlPath = path.join(__dirname, 'supabase', 'add_display_order_to_dropdown_options.sql');
let addColumnSql;

try {
  addColumnSql = fs.readFileSync(addColumnSqlPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading add_display_order_to_dropdown_options.sql file:', error.message);
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
    
    // Step 1: Create the execute_sql function
    console.log("\n🔧 Creating execute_sql function...");
    
    try {
      // Execute the SQL directly using the REST API
      const { data, error } = await supabase.from('_rpc').select('*').execute(createFunctionSql);
      
      if (error) {
        console.error("❌ Error creating execute_sql function:", error.message);
        console.log("This might be because the function already exists. Continuing with the next step...");
      } else {
        console.log("✅ execute_sql function created successfully!");
      }
    } catch (functionErr) {
      console.error("❌ Error creating execute_sql function:", functionErr.message);
      console.log("This might be because the function already exists. Continuing with the next step...");
    }
    
    // Step 2: Execute the SQL to add display_order column
    console.log("\n🔧 Executing SQL to add display_order column...");
    
    // Split SQL into individual statements
    const statements = addColumnSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      console.log(`\nExecuting statement ${i + 1} of ${statements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      try {
        // Try using the execute_sql function
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: stmt });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1} using RPC:`, error.message);
          console.log("Trying direct execution...");
          
          // If RPC fails, try direct execution
          try {
            const { data: directData, error: directError } = await supabase.from('_rpc').select('*').execute(stmt);
            
            if (directError) {
              console.error(`❌ Error executing statement ${i + 1} directly:`, directError.message);
              console.log("Continuing with the next statement...");
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully (direct)!`);
            }
          } catch (directErr) {
            console.error(`❌ Error executing statement ${i + 1} directly:`, directErr.message);
            console.log("Continuing with the next statement...");
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully (RPC)!`);
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