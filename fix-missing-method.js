// Script to fix the missing fetchDropdownOptions method in QuestionService.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.missing-method-backup');

// Main function
async function fixMissingMethod() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING MISSING FETCHDROPDOWNOPTIONS METHOD");
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
    
    // Find the position to insert the method
    const fetchDropdownOptionsComment = content.indexOf('/**\n   * Fetch dropdown options for a specific question');
    const nextMethod = content.indexOf('/**', fetchDropdownOptionsComment + 10);
    
    if (fetchDropdownOptionsComment === -1 || nextMethod === -1) {
      console.error("❌ Could not find insertion point for fetchDropdownOptions method");
      process.exit(1);
    }
    
    // Create the fetchDropdownOptions method
    const fetchDropdownOptionsMethod = `/**
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
  }
  
  `;
    
    // Replace the comment with the actual method
    const updatedContent = content.substring(0, fetchDropdownOptionsComment) + 
                          fetchDropdownOptionsMethod + 
                          content.substring(nextMethod);
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully added missing fetchDropdownOptions method.");
    console.log("This should fix issues with fetching and displaying dropdown options.");
    
  } catch (error) {
    console.error("\n❌ Error fixing missing method:", error.message);
    process.exit(1);
  }
}

// Run the function
fixMissingMethod()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });