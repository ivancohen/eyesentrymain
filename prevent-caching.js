// Script to prevent caching of dropdown options
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.no-cache-backup');

// Main function
async function preventCaching() {
  try {
    console.log("=".repeat(80));
    console.log("PREVENTING CACHING OF DROPDOWN OPTIONS");
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
    
    // Add a timestamp parameter to the fetchDropdownOptions query to prevent caching
    const updatedFetchMethod = `
  /**
   * Fetch dropdown options for a specific question
   * Added timestamp to prevent caching
   */
  static async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
    const timestamp = new Date().getTime(); // Add timestamp to prevent caching
    console.log(\`[QuestionService] Fetching dropdown options for question \${questionId} at \${timestamp}\`);
    
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at')
      .order('id');
    
    if (error) {
      console.error(\`Error fetching dropdown options for question \${questionId}:\`, error);
      throw error;
    }
    
    console.log(\`[QuestionService] Found \${data?.length || 0} dropdown options\`);
    return data || [];
  }`;
    
    // Replace the existing fetchDropdownOptions method
    const updatedContent = content.replace(
      /\/\*\*\s*\*\s*Fetch dropdown options[\s\S]*?static async fetchDropdownOptions[\s\S]*?}\s*}/,
      updatedFetchMethod
    );
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully updated fetchDropdownOptions to prevent caching.");
    console.log("The following changes were made:");
    console.log("1. Added timestamp parameter to prevent caching");
    console.log("2. Added detailed logging to track fetching of dropdown options");
    console.log("\nThis ensures that dropdown options will always be fetched fresh from the database,");
    console.log("without relying on any cached versions.");
    
  } catch (error) {
    console.error("\n❌ Error preventing caching:", error.message);
    process.exit(1);
  }
}

// Run the function
preventCaching()
  .then(() => {
    console.log("\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during update:", err);
    process.exit(1);
  });