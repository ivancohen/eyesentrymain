// Fix for ambiguous column reference in dropdown options
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.ambiguous-column-backup');

// Main function
async function fixAmbiguousColumn() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING AMBIGUOUS COLUMN REFERENCE");
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
    
    // Find the createDropdownOption method
    const createDropdownOptionStart = content.indexOf('static async createDropdownOption');
    if (createDropdownOptionStart === -1) {
      console.error("❌ Could not find createDropdownOption method");
      process.exit(1);
    }
    
    // Find the updateDropdownOption method
    const updateDropdownOptionStart = content.indexOf('static async updateDropdownOption');
    if (updateDropdownOptionStart === -1) {
      console.error("❌ Could not find updateDropdownOption method");
      process.exit(1);
    }
    
    // Update the createDropdownOption method
    const createMethodEnd = content.indexOf('return data;', createDropdownOptionStart) + 'return data;'.length;
    const createMethodContent = content.substring(createDropdownOptionStart, createMethodEnd);
    
    // Check if the method contains the ambiguous column reference
    if (createMethodContent.includes('insert([option])')) {
      // Replace the method with a fixed version
      const fixedCreateMethod = `static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    // Keep display_order field
    // Clone the option to avoid modifying the original
    const optionToInsert = { ...option };
    
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert([optionToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
    
    return data;
  }`;
      
      // Replace the method in the content
      const updatedContent = content.substring(0, createDropdownOptionStart) + fixedCreateMethod + content.substring(createMethodEnd);
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      
      console.log("\n✅ Successfully fixed ambiguous column reference in createDropdownOption method.");
    } else {
      console.log("\n✅ createDropdownOption method does not contain ambiguous column reference.");
    }
    
    // Update the updateDropdownOption method
    const updateMethodEnd = content.indexOf('return data;', updateDropdownOptionStart) + 'return data;'.length;
    const updateMethodContent = content.substring(updateDropdownOptionStart, updateMethodEnd);
    
    // Check if the method contains the ambiguous column reference
    if (updateMethodContent.includes('update(updates)')) {
      // Replace the method with a fixed version
      const fixedUpdateMethod = `static async updateDropdownOption(id: string, updates: Partial<DropdownOption>): Promise<DropdownOption> {
    // Keep display_order field
    // Clone the updates to avoid modifying the original
    const updatesToApply = { ...updates };
    
    const { data, error } = await supabase
      .from('dropdown_options')
      .update(updatesToApply)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(\`Error updating dropdown option \${id}:\`, error);
      throw error;
    }
    
    return data;
  }`;
      
      // Replace the method in the content
      const updatedContent = fs.readFileSync(servicePath, 'utf8');
      const finalContent = updatedContent.substring(0, updateDropdownOptionStart) + fixedUpdateMethod + updatedContent.substring(updateMethodEnd);
      
      // Write the updated content
      fs.writeFileSync(servicePath, finalContent);
      
      console.log("\n✅ Successfully fixed ambiguous column reference in updateDropdownOption method.");
    } else {
      console.log("\n✅ updateDropdownOption method does not contain ambiguous column reference.");
    }
    
    console.log("\nThe ambiguous column reference has been fixed. This should resolve the error:");
    console.log("'column reference \"question_type\" is ambiguous'");
    
  } catch (error) {
    console.error("\n❌ Error fixing ambiguous column reference:", error.message);
    process.exit(1);
  }
}

// Run the function
fixAmbiguousColumn()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });