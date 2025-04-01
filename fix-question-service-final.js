// Final fix for QuestionService to use the new SQL functions
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.final-fix-backup');

// Main function
async function fixQuestionService() {
  try {
    console.log("=".repeat(80));
    console.log("FINAL FIX FOR QUESTIONSERVICE");
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
    
    // Replace the createDropdownOption method
    const createMethodEnd = content.indexOf('return data;', createDropdownOptionStart) + 'return data;'.length;
    const fixedCreateMethod = `static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    try {
      // Use the SQL function to avoid ambiguity
      const { data, error } = await supabase.rpc('create_dropdown_option', {
        option_text: option.option_text,
        option_value: option.option_value,
        score: option.score || 0,
        question_id: option.question_id
      });
      
      if (error) {
        console.error('Error creating dropdown option:', error);
        
        // Fallback to direct insert if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('dropdown_options')
          .insert({
            option_text: option.option_text,
            option_value: option.option_value,
            score: option.score || 0,
            question_id: option.question_id
          })
          .select()
          .single();
          
        if (fallbackError) {
          console.error('Fallback error creating dropdown option:', fallbackError);
          throw fallbackError;
        }
        
        return fallbackData;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createDropdownOption:', error);
      throw error;
    }
  }`;
    
    // Replace the updateDropdownOption method
    const updateMethodEnd = content.indexOf('return data;', updateDropdownOptionStart) + 'return data;'.length;
    const fixedUpdateMethod = `static async updateDropdownOption(id: string, updates: Partial<DropdownOption>): Promise<DropdownOption> {
    try {
      // Use the SQL function to avoid ambiguity
      const { data, error } = await supabase.rpc('update_dropdown_option', {
        option_id: id,
        option_text: updates.option_text,
        option_value: updates.option_value,
        score: updates.score || 0
      });
      
      if (error) {
        console.error(\`Error updating dropdown option \${id}:\`, error);
        
        // Fallback to direct update if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('dropdown_options')
          .update({
            option_text: updates.option_text,
            option_value: updates.option_value,
            score: updates.score || 0
          })
          .eq('id', id)
          .select()
          .single();
          
        if (fallbackError) {
          console.error('Fallback error updating dropdown option:', fallbackError);
          throw fallbackError;
        }
        
        return fallbackData;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateDropdownOption:', error);
      throw error;
    }
  }`;
    
    // Update the content
    let updatedContent = content.substring(0, createDropdownOptionStart) + fixedCreateMethod + content.substring(createMethodEnd);
    updatedContent = updatedContent.substring(0, updatedContent.indexOf('static async updateDropdownOption')) + fixedUpdateMethod + updatedContent.substring(updatedContent.indexOf('static async updateDropdownOption') + (updateMethodEnd - updateDropdownOptionStart));
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully updated QuestionService with final fixes.");
    console.log("The service now uses SQL functions to avoid ambiguous column references.");
    
  } catch (error) {
    console.error("\n❌ Error fixing QuestionService:", error.message);
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