// Script to fix the QuestionService.ts file to handle missing display_order column
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const sourcePath = path.join(__dirname, 'src', 'services', 'QuestionService.fixed.ts');
const targetPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.backup');

// Main function
async function fixQuestionService() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING QUESTIONSERVICE.TS TO HANDLE MISSING DISPLAY_ORDER COLUMN");
    console.log("=".repeat(80));
    
    // Check if the fixed file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Error: Fixed file not found at ${sourcePath}`);
      process.exit(1);
    }
    
    // Check if the target file exists
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ Error: Target file not found at ${targetPath}`);
      process.exit(1);
    }
    
    // Create a backup of the original file
    console.log(`📦 Creating backup of original file at ${backupPath}`);
    fs.copyFileSync(targetPath, backupPath);
    
    // Copy the fixed file to the target location
    console.log(`🔧 Applying fix to ${targetPath}`);
    fs.copyFileSync(sourcePath, targetPath);
    
    console.log("\n✅ Successfully fixed QuestionService.ts to handle missing display_order column.");
    console.log("The file has been updated to remove display_order from dropdown option operations.");
    console.log("\nIf you want to properly add the display_order column to the database, run:");
    console.log("  Windows: add-display-order-to-dropdown-options.bat");
    console.log("  Unix/Linux/macOS: ./add-display-order-to-dropdown-options.sh");
    
  } catch (error) {
    console.error("\n❌ Error fixing QuestionService.ts:", error.message);
    process.exit(1);
  }
}

// Run the function
fixQuestionService()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });