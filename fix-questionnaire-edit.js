// Script to fix questionnaire editing issues:
// 1. Risk assessment scores not saving
// 2. Form not being populated with original answers
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Paths
const sqlFixPath = path.join(__dirname, 'fix-risk-score-saving.sql');
const originalComponentPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEdit.tsx');
const fixedComponentPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEditFix.tsx');
const backupComponentPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEdit.backup.tsx');

// Main function
async function applyQuestionnaireEditFix() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING QUESTIONNAIRE EDIT ISSUES");
    console.log("=".repeat(80));
    
    // Step 1: Apply SQL fix for risk score saving
    if (!fs.existsSync(sqlFixPath)) {
      console.error(`Error: SQL fix file not found at ${sqlFixPath}`);
      process.exit(1);
    }
    
    console.log("Applying SQL fix for risk score saving...");
    const sqlContent = fs.readFileSync(sqlFixPath, 'utf8');
    
    // Execute SQL script
    const { error: sqlError } = await supabase.rpc('execute_sql', { sql: sqlContent });
    
    if (sqlError) {
      console.error("Error executing SQL script:", sqlError);
      throw new Error(sqlError.message);
    }
    
    console.log("✅ SQL fix for risk score saving applied successfully");
    
    // Step 2: Replace QuestionnaireEdit component
    if (!fs.existsSync(fixedComponentPath)) {
      console.error(`Error: Fixed component file not found at ${fixedComponentPath}`);
      process.exit(1);
    }
    
    if (!fs.existsSync(originalComponentPath)) {
      console.error(`Error: Original component file not found at ${originalComponentPath}`);
      process.exit(1);
    }
    
    // Create backup
    console.log(`Creating backup at ${backupComponentPath}`);
    fs.copyFileSync(originalComponentPath, backupComponentPath);
    
    // Apply fixed component
    console.log(`Replacing QuestionnaireEdit component with fixed version`);
    fs.copyFileSync(fixedComponentPath, originalComponentPath);
    
    console.log("✅ QuestionnaireEdit component replaced successfully");
    
    console.log("\n=".repeat(80));
    console.log("QUESTIONNAIRE EDIT FIX COMPLETED");
    console.log("=".repeat(80));
    console.log("\nBoth issues have been fixed:");
    console.log("1. Risk assessment scores now save correctly when editing questionnaires");
    console.log("2. The edit form is now properly populated with original answers");
    console.log("\nTo test the fix:");
    console.log("1. Log in to the application");
    console.log("2. Go to the Questionnaires page");
    console.log("3. Click 'Edit' on an existing questionnaire");
    console.log("4. Verify that all fields are populated with the original values");
    console.log("5. Make changes and submit");
    console.log("6. Verify that the risk score is updated correctly");
    
  } catch (error) {
    console.error("Error applying fix:", error);
    
    // Try to restore from backup if available
    if (fs.existsSync(backupComponentPath) && fs.existsSync(originalComponentPath)) {
      console.log("Attempting to restore QuestionnaireEdit component from backup...");
      fs.copyFileSync(backupComponentPath, originalComponentPath);
      console.log("Restored from backup.");
    }
    
    process.exit(1);
  }
}

// Run the function
applyQuestionnaireEditFix()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix execution:", err);
    process.exit(1);
  });