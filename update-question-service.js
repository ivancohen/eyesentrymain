// Script to update QuestionService.ts to use the display_order column
// Script to update QuestionService.ts to use the display_order column
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const sourcePath = path.join(__dirname, 'src', 'services', 'QuestionService.updated.ts');
const targetPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.backup');

// Main function
async function updateQuestionService() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING QUESTIONSERVICE.TS TO USE DISPLAY_ORDER COLUMN");
    console.log("=".repeat(80));
    
    // Check if the updated file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Error: ${sourcePath} does not exist`);
      process.exit(1);
    }
    
    // Check if the target file exists
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ Error: ${targetPath} does not exist`);
      process.exit(1);
    }
    
    // Create a backup of the original file
    console.log("\n📦 Creating a backup of the original file...");
    fs.copyFileSync(targetPath, backupPath);
    console.log(`✅ Backup created at ${backupPath}`);
    
    // Read the updated file
    console.log("\n📄 Reading the updated file...");
    const updatedContent = fs.readFileSync(sourcePath, 'utf8');
    
    // Write the updated content to the target file
    console.log("\n✏️ Writing the updated content to the target file...");
    fs.writeFileSync(targetPath, updatedContent);
    
    console.log(`\n✅ QuestionService.ts has been updated to use the display_order column!`);
    console.log(`The original file has been backed up to ${backupPath}`);
    console.log("\nChanges made:");
    console.log("1. fetchDropdownOptions now orders by display_order instead of id");
    console.log("2. createDropdownOption no longer removes the display_order field");
    console.log("3. updateDropdownOption no longer removes the display_order field");
    console.log("4. saveDropdownOption no longer removes the display_order field");
    console.log("5. Added a new reorderDropdownOptions method to reorder dropdown options");
    
  } catch (error) {
    console.error("\n❌ Error updating QuestionService.ts:", error.message);
    process.exit(1);
  }
}

// Run the function
updateQuestionService()
  .then(() => {
    console.log("\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during update:", err);
    process.exit(1);
  });