// Simplified script to fix questionnaire editing issues:
// This version only replaces the component, without requiring Supabase credentials
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const originalComponentPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEdit.tsx');
const fixedComponentPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEditFix.tsx');
const backupComponentPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEdit.backup.tsx');

// Main function
async function applyComponentFix() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING QUESTIONNAIRE EDIT COMPONENT");
    console.log("=".repeat(80));
    
    // Check if files exist
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
    console.log("COMPONENT FIX COMPLETED");
    console.log("=".repeat(80));
    console.log("\nThe component part of the fix has been applied.");
    console.log("The edit form should now be properly populated with original answers.");
    console.log("\nNOTE: To fix the risk score saving issue, you will need to:");
    console.log("1. Set up your Supabase credentials in a .env file");
    console.log("2. Run the SQL script manually from fix-risk-score-saving.sql");
    console.log("\nTo test the form population fix:");
    console.log("1. Log in to the application");
    console.log("2. Go to the Questionnaires page");
    console.log("3. Click 'Edit' on an existing questionnaire");
    console.log("4. Verify that all fields are populated with the original values");
    
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
applyComponentFix()
  .then(() => {
    console.log("\nComponent fix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix execution:", err);
    process.exit(1);
  });