// Script to completely remove the question reordering functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.remove-feature-backup');

// Main function
async function removeReorderingFeature() {
  try {
    console.log("=".repeat(80));
    console.log("REMOVING QUESTION REORDERING FUNCTIONALITY");
    console.log("=".repeat(80));
    
    // Check if the service file exists
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Error: Service file not found at ${servicePath}`);
      process.exit(1);
    }
    
    // Create a backup of the original file
    console.log(`📦 Creating backup of original file at ${backupPath}`);
    fs.copyFileSync(servicePath, backupPath);
    
    // Read the current content
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Replace the reorderDropdownOptions method with a stub that does nothing
    const stubMethod = `
  /**
   * Reorder dropdown options - DISABLED
   * This functionality has been disabled due to persistent issues.
   */
  static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    console.log('Reordering functionality has been disabled');
    return;
  }`;
    
    // Find and replace the reorderDropdownOptions method
    const updatedContent = content.replace(
      /\/\*\*\s*\*\s*Reorder dropdown options[\s\S]*?static async reorderDropdownOptions[\s\S]*?}\s*}/,
      stubMethod
    );
    
    // Modify fetchDropdownOptions to order by id instead of display_order
    const updatedContent2 = updatedContent.replace(
      /\.from\('dropdown_options'\)\s*\.select\('\*'\)\s*\.eq\('question_id', questionId\)\s*\.order\('display_order'\)/,
      `.from('dropdown_options').select('*').eq('question_id', questionId).order('id')`
    );
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent2);
    
    console.log("\n✅ Successfully removed question reordering functionality.");
    console.log("The following changes were made:");
    console.log("1. Replaced reorderDropdownOptions with a stub that does nothing");
    console.log("2. Modified fetchDropdownOptions to order by id instead of display_order");
    console.log("\nThe feature has been completely disabled. UI components that attempt to use");
    console.log("this functionality will not cause errors, but reordering will not take effect.");
    
  } catch (error) {
    console.error("\n❌ Error removing reordering feature:", error.message);
    process.exit(1);
  }
}

// Run the function
removeReorderingFeature()
  .then(() => {
    console.log("\nRemoval script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during removal:", err);
    process.exit(1);
  });