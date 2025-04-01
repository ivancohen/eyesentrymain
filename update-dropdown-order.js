// Script to update QuestionService to display dropdown options in creation order
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.creation-order-backup');

// Main function
async function updateDropdownOrder() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING DROPDOWN OPTIONS TO DISPLAY IN CREATION ORDER");
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
    
    // Update fetchDropdownOptions to order by created_at, then id
    const updatedContent = content.replace(
      /\.from\('dropdown_options'\)\s*\.select\('\*'\)\s*\.eq\('question_id', questionId\)\s*\.order\([^\)]+\)/,
      `.from('dropdown_options').select('*').eq('question_id', questionId).order('created_at').order('id')`
    );
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully updated dropdown options to display in creation order.");
    console.log("The following changes were made:");
    console.log("1. Modified fetchDropdownOptions to order by created_at, then id");
    console.log("\nThis ensures that dropdown options will be displayed in the order they were created,");
    console.log("which is the order they were entered in the admin section.");
    
  } catch (error) {
    console.error("\n❌ Error updating dropdown order:", error.message);
    process.exit(1);
  }
}

// Run the function
updateDropdownOrder()
  .then(() => {
    console.log("\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during update:", err);
    process.exit(1);
  });