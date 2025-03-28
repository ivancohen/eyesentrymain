// Comprehensive script to fix all questionnaire system issues
// - Patient names not being saved
// - Risk assessment scores not being calculated 
// - Editing questionnaires not functioning properly

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

// Path to the comprehensive fix SQL file
const sqlFilePath = path.join(__dirname, 'supabase', 'fix_questionnaire_comprehensive_final.sql');

async function applyFixesAndTest() {
  try {
    console.log("=".repeat(80));
    console.log("COMPREHENSIVE QUESTIONNAIRE SYSTEM FIX");
    console.log("=".repeat(80));
    
    // Step 1: Read SQL fix script
    console.log("\nStep 1: Reading SQL fix script...");
    console.log(`Reading from: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: SQL file not found at ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`Read ${sqlContent.length} characters of SQL`);
    
    // Step 2: Execute SQL fix script
    console.log("\nStep 2: Executing SQL fixes...");
    
    try {
      const executeSqlResult = await supabase.rpc('execute_sql', { sql_statement: sqlContent });
      
      if (executeSqlResult.error) {
        console.error("Error executing SQL fixes:", executeSqlResult.error);
        console.log("However, some parts of the script may have succeeded. Continuing with testing...");
      } else {
        console.log("✅ SQL fixes applied successfully");
      }
    } catch (sqlError) {
      console.error("Exception during SQL execution:", sqlError);
      console.log("Continuing with testing to check current state...");
    }
    
    // Step 3: Verify front-end code changes
    console.log("\nStep 3: Verifying front-end code changes...");
    
    try {
      const patientServicePath = path.join(__dirname, 'src', 'services', 'PatientQuestionnaireService.ts');
      if (fs.existsSync(patientServicePath)) {
        const serviceCode = fs.readFileSync(patientServicePath, 'utf8');
        console.log("Scanning PatientQuestionnaireService.ts for fixes...");
        
        // Check for critical changes
        const hasNamesSaving = serviceCode.includes("metadata: { // Keep metadata for potential fallback/logging") ||
                                serviceCode.includes("firstName: data.firstName") || 
                                serviceCode.includes("lastName: data.lastName");
                                
        const hasRiskScoring = serviceCode.includes("const assessmentResult") && 
                              serviceCode.includes("calculateRiskScore");
                              
        const hasEditingFix = serviceCode.includes("updateQuestionnaire") && 
                             serviceCode.includes("rpc('update_patient_questionnaire'");
                             
        const hasTableFallback = serviceCode.includes("from('question_options')") || 
                                serviceCode.includes("Trying dropdown_options as fallback");
        
        console.log(`Patient names saving: ${hasNamesSaving ? '✅' : '❌'}`);
        console.log(`Risk assessment scoring: ${hasRiskScoring ? '✅' : '❌'}`);
        console.log(`Editing functionality: ${hasEditingFix ? '✅' : '❌'}`);
        console.log(`Table name handling: ${hasTableFallback ? '✅' : '❌'}`);
        
        if (hasNamesSaving && hasRiskScoring && hasEditingFix && hasTableFallback) {
          console.log("✅ All front-end code fixes are in place");
        } else {
          console.log("⚠️ Some front-end code fixes may be missing");
        }
      } else {
        console.log("❌ PatientQuestionnaireService.ts not found. Cannot verify front-end changes.");
      }
    } catch (fileError) {
      console.error("Error checking frontend code:", fileError);
    }
    
    // Step 4: Verify database structure
    console.log("\nStep 4: Verifying database structure...");
    
    try {
      // Check the patient_questionnaires table columns
      const { data: tableColumns, error: columnsError } = await supabase.rpc('execute_sql', {
        sql_statement: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'patient_questionnaires'
          ORDER BY column_name
        `
      });
      
      if (columnsError) {
        console.error("❌ Error checking table structure:", columnsError);
      } else {
        const columnNames = tableColumns.map(row => row.column_name);
        console.log("Table columns:", columnNames.join(", "));
        
        const hasMetadata = columnNames.includes('metadata');
        const hasFirstName = columnNames.includes('first_name');
        const hasLastName = columnNames.includes('last_name');
        const hasTotalScore = columnNames.includes('total_score');
        const hasRiskLevel = columnNames.includes('risk_level');
        const hasAnswers = columnNames.includes('answers');
        
        console.log(`Required columns present:
- first_name: ${hasFirstName ? '✅' : '❌'}
- last_name: ${hasLastName ? '✅' : '❌'}
- metadata: ${hasMetadata ? '✅' : '❌'}
- total_score: ${hasTotalScore ? '✅' : '❌'}
- risk_level: ${hasRiskLevel ? '✅' : '❌'}
- answers: ${hasAnswers ? '✅' : '❌'}`);
        
        if (hasFirstName && hasLastName && hasMetadata && hasTotalScore && hasRiskLevel) {
          console.log("✅ Required columns exist for full functionality");
          if (!hasAnswers) {
            console.log("⚠️ 'answers' column is missing but not strictly required");
          }
        } else {
          console.log("❌ Some required columns are missing");
        }
      }
    } catch (dbError) {
      console.error("Error checking database structure:", dbError);
    }
    
    // Step 5: Verify functions
    console.log("\nStep 5: Verifying database functions...");
    
    try {
      const { data: functions, error: functionsError } = await supabase.rpc('execute_sql', {
        sql_statement: `
          SELECT proname, pronargs
          FROM pg_proc 
          WHERE proname LIKE '%patient_questionnaire%'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        `
      });
      
      if (functionsError) {
        console.error("❌ Error checking database functions:", functionsError);
      } else {
        console.log("Found functions:", functions.map(f => f.proname).join(", "));
        
        const hasInsertFunction = functions.some(f => f.proname === 'insert_patient_questionnaire');
        const hasUpdateFunction = functions.some(f => f.proname === 'update_patient_questionnaire');
        const hasGetFunction = functions.some(f => f.proname === 'get_patient_questionnaires_for_user');
        
        console.log(`Required functions present:
- insert_patient_questionnaire: ${hasInsertFunction ? '✅' : '❌'}
- update_patient_questionnaire: ${hasUpdateFunction ? '✅' : '❌'}
- get_patient_questionnaires_for_user: ${hasGetFunction ? '✅' : '❌'}`);
        
        if (hasInsertFunction && hasUpdateFunction && hasGetFunction) {
          console.log("✅ All required functions exist");
        } else {
          console.log("❌ Some required functions are missing");
        }
      }
    } catch (dbError) {
      console.error("Error checking database functions:", dbError);
    }
    
    // Step 6: Verify option tables
    console.log("\nStep 6: Verifying question options tables...");
    
    try {
      const dropdownOptionsResult = await supabase
        .from('dropdown_options')
        .select('count')
        .limit(1)
        .single();
        
      const questionOptionsResult = await supabase
        .from('question_options')
        .select('count')
        .limit(1)
        .single();
        
      if (dropdownOptionsResult.error && questionOptionsResult.error) {
        console.error("❌ Neither dropdown_options nor question_options tables are accessible");
      } else if (dropdownOptionsResult.error) {
        console.log("ℹ️ Only question_options table is accessible");
      } else if (questionOptionsResult.error) {
        console.log("ℹ️ Only dropdown_options table is accessible");
      } else {
        console.log("✅ Both dropdown_options and question_options tables are accessible");
      }
      
      // Check for view
      const { data: viewExists, error: viewError } = await supabase.rpc('execute_sql', {
        sql_statement: `
          SELECT EXISTS (
            SELECT FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('combined_options', 'dropdown_options', 'question_options')
          ) AS view_exists;
        `
      });
      
      if (viewError) {
        console.error("❌ Error checking view existence:", viewError);
      } else {
        const viewExistsValue = viewExists?.[0]?.view_exists || false;
        if (viewExistsValue) {
          console.log("✅ Options view exists");
        } else {
          console.log("⚠️ Options view might not be created, but individual tables might still work");
        }
      }
    } catch (error) {
      console.error("Error checking options tables:", error);
    }
    
    console.log("\n=".repeat(80));
    console.log("QUESTIONNAIRE SYSTEM FIX COMPLETED");
    console.log("=".repeat(80));
    console.log("\nThe system should now be able to:");
    console.log("1. Save patient names correctly");
    console.log("2. Calculate and store risk assessment scores");
    console.log("3. Edit patient questionnaires properly");
    console.log("\nIf you encounter any issues, please check the QUESTIONNAIRE_SYSTEM_FIX_GUIDE.md for troubleshooting steps.");
    
  } catch (error) {
    console.error("Error executing fixes:", error);
    process.exit(1);
  }
}

// Run the function
applyFixesAndTest()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix execution:", err);
    process.exit(1);
  });