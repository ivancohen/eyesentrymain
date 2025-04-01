// Script to update App.tsx to use the enhanced PatientQuestionnaire component
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function updateAppComponent() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING APP.TSX TO USE ENHANCED PATIENT QUESTIONNAIRE");
    console.log("=".repeat(80));
    
    const appPath = path.join(__dirname, 'src', 'App.tsx');
    
    // Step 1: Create a backup of the current file
    console.log("\n1️⃣ Creating backup of current App.tsx file...");
    
    const backupPath = path.join(__dirname, 'src', `App.tsx.enhanced-backup-${Date.now()}`);
    
    if (fs.existsSync(appPath)) {
      fs.copyFileSync(appPath, backupPath);
      console.log(`✅ Created backup at ${backupPath}`);
    } else {
      console.error("❌ App.tsx not found");
      process.exit(1);
    }
    
    // Step 2: Read the current content
    console.log("\n2️⃣ Reading App.tsx content...");
    
    const content = fs.readFileSync(appPath, 'utf8');
    
    // Step 3: Update the import statement
    console.log("\n3️⃣ Updating import statement...");
    
    const updatedImport = content.replace(
      /import PatientQuestionnaire from "@\/pages\/PatientQuestionnaire";/,
      'import PatientQuestionnaire from "@/pages/PatientQuestionnaire.enhanced";'
    );
    
    if (updatedImport === content) {
      console.warn("⚠️ Import statement not found or already updated");
    } else {
      console.log("✅ Import statement updated");
    }
    
    // Step 4: Write the updated content
    console.log("\n4️⃣ Writing updated App.tsx...");
    
    fs.writeFileSync(appPath, updatedImport);
    console.log("✅ App.tsx updated successfully");
    
    console.log("\n=".repeat(80));
    console.log("🎉 APP.TSX UPDATED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("\nThe application will now use the enhanced PatientQuestionnaire component");
    console.log("with the 'Not Available' warning functionality.");
    
  } catch (error) {
    console.error("\n❌ Error updating App.tsx:", error);
    process.exit(1);
  }
}

// Run the function
updateAppComponent()
  .then(() => {
    console.log("\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during update:", err);
    process.exit(1);
  });