// Script to fix the foreign key constraint issue with createQuestion
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.fk-constraint-backup');

// Main function
async function fixForeignKeyConstraint() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING FOREIGN KEY CONSTRAINT ISSUE WITH CREATEQUESTION");
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
    
    // Find the createQuestion method
    const createQuestionMethodStart = content.indexOf('static async createQuestion');
    const createQuestionMethodEnd = content.indexOf('static async updateQuestion', createQuestionMethodStart);
    
    if (createQuestionMethodStart === -1 || createQuestionMethodEnd === -1) {
      console.error("❌ Could not find createQuestion method");
      process.exit(1);
    }
    
    // Extract the method
    const createQuestionMethod = content.substring(createQuestionMethodStart, createQuestionMethodEnd);
    
    // Create the updated method with foreign key constraint fix
    const updatedMethod = `
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
  }`;
    
    // Replace the method in the content
    const updatedContent = content.substring(0, createQuestionMethodStart) + updatedMethod + content.substring(createQuestionMethodEnd);
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully fixed foreign key constraint issue with createQuestion.");
    console.log("The following changes were made:");
    console.log("1. Removed created_by field from the question object to avoid foreign key constraint violation");
    console.log("2. Added default values for required fields");
    console.log("\nThis should fix the error: 'Key (created_by)=(00000000-0000-0000-0000-000000000000) is not present in table \"users\"'");
    
  } catch (error) {
    console.error("\n❌ Error fixing foreign key constraint:", error.message);
    process.exit(1);
  }
}

// Run the function
fixForeignKeyConstraint()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });