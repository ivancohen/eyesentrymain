// Script to fix remaining issues in QuestionService.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.remaining-issues-backup');

// Main function
async function fixRemainingIssues() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING REMAINING ISSUES IN QUESTIONSERVICE.TS");
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
    
    // 1. Remove duplicate createQuestion comment
    let updatedContent = content.replace(
      /\/\*\*\s*\*\s*Create a new question\s*\*\/\s*\n\s*\/\*\*/,
      '/**'
    );
    
    // 2. Add missing createDropdownOption and updateDropdownOption methods
    const missingMethods = `
  /**
   * Create a dropdown option for a question
   */
  static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    // Keep display_order field
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert([option])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Update a dropdown option
   */
  static async updateDropdownOption(id: string, updates: Partial<DropdownOption>): Promise<DropdownOption> {
    // Keep display_order field
    const { data, error } = await supabase
      .from('dropdown_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(\`Error updating dropdown option \${id}:\`, error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Delete a dropdown option
   */
  static async deleteDropdownOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('dropdown_options')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(\`Error deleting dropdown option \${id}:\`, error);
      throw error;
    }
  }`;
    
    // Find the position to insert the missing methods
    const saveDropdownOptionStart = updatedContent.indexOf('static async saveDropdownOption');
    const saveDropdownOptionEnd = updatedContent.indexOf('static async reorderDropdownOptions');
    
    if (saveDropdownOptionStart === -1 || saveDropdownOptionEnd === -1) {
      console.error("❌ Could not find insertion point for missing methods");
      process.exit(1);
    }
    
    // Insert the missing methods before saveDropdownOption
    updatedContent = 
      updatedContent.substring(0, saveDropdownOptionStart) + 
      missingMethods + 
      "\n\n  " + 
      updatedContent.substring(saveDropdownOptionStart);
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully fixed remaining issues in QuestionService.ts.");
    console.log("The following changes were made:");
    console.log("1. Removed duplicate createQuestion comment");
    console.log("2. Added missing createDropdownOption method");
    console.log("3. Added missing updateDropdownOption method");
    console.log("4. Added missing deleteDropdownOption method");
    console.log("\nThis should complete the QuestionService implementation and fix any remaining issues.");
    
  } catch (error) {
    console.error("\n❌ Error fixing remaining issues:", error.message);
    process.exit(1);
  }
}

// Run the function
fixRemainingIssues()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });