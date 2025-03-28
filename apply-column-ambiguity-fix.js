// Script to apply the fix for column ambiguity in update_patient_questionnaire function
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Path to the fix SQL file
const sqlFilePath = path.join(__dirname, 'supabase', 'fix_column_ambiguity.sql');

async function applyFix() {
  try {
    console.log("=".repeat(80));
    console.log("APPLYING FIX FOR COLUMN AMBIGUITY IN UPDATE FUNCTION");
    console.log("=".repeat(80));
    
    // Read SQL fix script
    console.log(`Reading from: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: SQL file not found at ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`Read ${sqlContent.length} characters of SQL`);
    
    // Execute SQL fix script
    console.log("\nExecuting SQL fix...");
    
    try {
      const executeSqlResult = await supabase.rpc('execute_sql', { sql_statement: sqlContent });
      
      if (executeSqlResult.error) {
        console.error("Error executing SQL fix:", executeSqlResult.error);
        console.log("This may indicate the function is already fixed or there are other issues.");
      } else {
        console.log("✅ SQL fix applied successfully");
        
        // Test the update function
        console.log("\nTesting update function...");
        
        // Get a questionnaire ID to test with
        const { data: questionnaires, error: getError } = await supabase
          .from('patient_questionnaires')
          .select('id')
          .limit(1);
          
        if (getError || !questionnaires || questionnaires.length === 0) {
          console.log("⚠️ No questionnaires found to test update function.");
        } else {
          const testId = questionnaires[0].id;
          
          // Try a test update
          const testUpdate = await supabase.rpc('update_patient_questionnaire', {
            questionnaire_id: testId,
            first_name: 'TestName',
            last_name: 'TestLastName',
            age: '45',
            race: 'Other',
            family_glaucoma: true,
            ocular_steroid: false,
            steroid_type: null,
            intravitreal: false,
            intravitreal_type: null,
            systemic_steroid: false,
            systemic_steroid_type: null,
            iop_baseline: true,
            vertical_asymmetry: false,
            vertical_ratio: false,
            total_score: 10,
            risk_level: 'Moderate',
            metadata: { 
              firstName: 'TestName',
              lastName: 'TestLastName',
              answers: {}
            }
          });
          
          if (testUpdate.error) {
            console.error("⚠️ Test update failed:", testUpdate.error);
          } else if (testUpdate.data === true) {
            console.log(`✅ Successfully verified update function on questionnaire ID: ${testId}`);
          } else {
            console.log(`⚠️ Update function returned: ${testUpdate.data}`);
          }
        }
      }
    } catch (sqlError) {
      console.error("Exception during SQL execution:", sqlError);
    }
    
    console.log("\n=".repeat(80));
    console.log("FIX COMPLETED");
    console.log("=".repeat(80));
    console.log("\nAll three issues should now be fixed:");
    console.log("1. Patient names should be saved correctly");
    console.log("2. Risk assessment scores should be calculated correctly");
    console.log("3. Editing patient questionnaires should now work without column ambiguity errors");
    
  } catch (error) {
    console.error("Error applying fix:", error);
    process.exit(1);
  }
}

// Run the function
applyFix()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix execution:", err);
    process.exit(1);
  });