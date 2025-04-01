// Script to add the createQuestion method with foreign key constraint fix
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.add-method-backup');

// Main function
async function addCreateQuestionMethod() {
  try {
    console.log("=".repeat(80));
    console.log("ADDING CREATEQUESTION METHOD WITH FOREIGN KEY CONSTRAINT FIX");
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
    
    // Check if the method already exists
    if (content.includes('static async createQuestion')) {
      console.log("⚠️ createQuestion method already exists. Updating it...");
      
      // Find the method and replace it
      const regex = /static async createQuestion[\s\S]*?}\s*}/;
      const match = content.match(regex);
      
      if (!match) {
        console.error("❌ Could not find existing createQuestion method");
        process.exit(1);
      }
      
      const updatedContent = content.replace(regex, `
  /**
   * Create a new question
   * Modified to handle foreign key constraint for created_by
   */
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    console.log('[QuestionService] Creating new question:', question);
    
    // Remove created_by field to avoid foreign key constraint violation
    const { created_by, ...safeQuestion } = question;
    
    // Set default values for required fields if not provided
    const questionToInsert = {
      ...safeQuestion,
      status: safeQuestion.status || 'Active',
      risk_score: safeQuestion.risk_score || 0,
      display_order: safeQuestion.display_order || 1,
      has_dropdown_options: safeQuestion.has_dropdown_options || false,
      has_conditional_items: safeQuestion.has_conditional_items || false,
      has_dropdown_scoring: safeQuestion.has_dropdown_scoring || false
    };
    
    const { data, error } = await supabase
      .from('questions')
      .insert([questionToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    console.log('[QuestionService] Question created successfully:', data);
    return data;
  }`);
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      console.log("✅ Successfully updated createQuestion method with foreign key constraint fix");
    } else {
      // Find a good insertion point (after fetchQuestionsByCategory)
      const fetchByCategory = content.indexOf('static async fetchQuestionsByCategory');
      const fetchByCategoryEnd = content.indexOf('static async', fetchByCategory + 10);
      
      if (fetchByCategory === -1 || fetchByCategoryEnd === -1) {
        console.error("❌ Could not find insertion point for createQuestion method");
        process.exit(1);
      }
      
      // Insert the new method
      const updatedContent = 
        content.substring(0, fetchByCategoryEnd) + 
        `
  /**
   * Create a new question
   * Modified to handle foreign key constraint for created_by
   */
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    console.log('[QuestionService] Creating new question:', question);
    
    // Remove created_by field to avoid foreign key constraint violation
    const { created_by, ...safeQuestion } = question;
    
    // Set default values for required fields if not provided
    const questionToInsert = {
      ...safeQuestion,
      status: safeQuestion.status || 'Active',
      risk_score: safeQuestion.risk_score || 0,
      display_order: safeQuestion.display_order || 1,
      has_dropdown_options: safeQuestion.has_dropdown_options || false,
      has_conditional_items: safeQuestion.has_conditional_items || false,
      has_dropdown_scoring: safeQuestion.has_dropdown_scoring || false
    };
    
    const { data, error } = await supabase
      .from('questions')
      .insert([questionToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    console.log('[QuestionService] Question created successfully:', data);
    return data;
  }
  
  ` + 
        content.substring(fetchByCategoryEnd);
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      console.log("✅ Successfully added createQuestion method with foreign key constraint fix");
    }
    
    console.log("\nThe following changes were made:");
    console.log("1. Added/updated createQuestion method to handle foreign key constraint");
    console.log("2. Removed created_by field from the question object");
    console.log("3. Added default values for required fields");
    console.log("\nThis should fix the error: 'Key (created_by)=(00000000-0000-0000-0000-000000000000) is not present in table \"users\"'");
    
  } catch (error) {
    console.error("\n❌ Error adding createQuestion method:", error.message);
    process.exit(1);
  }
}

// Run the function
addCreateQuestionMethod()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during script execution:", err);
    process.exit(1);
  });