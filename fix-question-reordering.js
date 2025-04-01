// Script to fix the QuestionService.ts file to properly handle question reordering
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.reordering-backup');

// Main function
async function fixQuestionReordering() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING QUESTION REORDERING FUNCTIONALITY");
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
    
    // Fix 1: Ensure fetchDropdownOptions orders by display_order
    let updatedContent = content.replace(
      /\.from\('dropdown_options'\)\s*\.select\('\*'\)\s*\.eq\('question_id', questionId\)\s*\.order\([^\)]+\)/,
      `.from('dropdown_options').select('*').eq('question_id', questionId).order('display_order')`
    );
    
    // Fix 2: Ensure createDropdownOption doesn't remove display_order
    updatedContent = updatedContent.replace(
      /\/\/ No longer removing display_order field\s*const { data, error } = await supabase\s*\.from\('dropdown_options'\)\s*\.insert\(\[option\]\)/,
      `// Keep display_order field\n    const { data, error } = await supabase\n      .from('dropdown_options')\n      .insert([option])`
    );
    
    // Fix 3: Ensure updateDropdownOption doesn't remove display_order
    updatedContent = updatedContent.replace(
      /\/\/ No longer removing display_order field\s*const { data, error } = await supabase\s*\.from\('dropdown_options'\)\s*\.update\(updates\)/,
      `// Keep display_order field\n    const { data, error } = await supabase\n      .from('dropdown_options')\n      .update(updates)`
    );
    
    // Fix 4: Improve reorderDropdownOptions method
    const reorderMethodImproved = `  /**
   * Reorder dropdown options - Using PostgreSQL function with fallback
   */
  static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    try {
      console.log('Reordering dropdown options:', updates);
      
      // Try to use the RPC function first
      try {
        const { error } = await supabase.rpc('reorder_dropdown_options', { 
          p_updates: updates.map(u => ({ id: u.id, display_order: u.display_order }))
        });
        
        if (!error) {
          console.log('Successfully reordered dropdown options using RPC function');
          return;
        }
        
        console.warn('RPC function failed, falling back to individual updates:', error);
      } catch (rpcErr) {
        console.warn('RPC function error, falling back to individual updates:', rpcErr);
      }
      
      // Fallback: Update each dropdown option directly
      for (const update of updates) {
        console.log(\`Updating option \${update.id} to display_order \${update.display_order}\`);
        
        // Use the updateDropdownOption method to update each option
        await this.updateDropdownOption(update.id, { display_order: update.display_order });
      }
      
      console.log('Successfully reordered dropdown options using fallback method');
    } catch (err) {
      console.error('Error in reorderDropdownOptions:', err);
      throw err;
    }
  }`;
    
    // Replace the existing reorderDropdownOptions method
    updatedContent = updatedContent.replace(
      /\/\*\*\s*\*\s*Reorder dropdown options[\s\S]*?static async reorderDropdownOptions[\s\S]*?}\s*}/,
      reorderMethodImproved
    );
    
    // Fix 5: Ensure saveDropdownOption doesn't remove display_order
    updatedContent = updatedContent.replace(
      /\/\/ No longer removing display_order field\s*\n\s*\/\/ If the option has an ID/,
      `// Keep display_order field\n    \n    // If the option has an ID`
    );
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully fixed QuestionService.ts to properly handle reordering.");
    console.log("The following changes were made:");
    console.log("1. Updated fetchDropdownOptions to order by display_order");
    console.log("2. Ensured createDropdownOption keeps the display_order field");
    console.log("3. Ensured updateDropdownOption keeps the display_order field");
    console.log("4. Improved reorderDropdownOptions with PostgreSQL function and fallback");
    console.log("5. Ensured saveDropdownOption keeps the display_order field");
    
  } catch (error) {
    console.error("\n❌ Error fixing QuestionService.ts:", error.message);
    process.exit(1);
  }
}

// Run the function
fixQuestionReordering()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });