// Script to add the missing createQuestion method to QuestionService
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.create-question-backup');

// Main function
async function fixCreateQuestion() {
  try {
    console.log("=".repeat(80));
    console.log("ADDING MISSING CREATE QUESTION METHOD");
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
    
    // Check if the createQuestion method already exists
    if (content.includes('static async createQuestion')) {
      console.log("✅ createQuestion method already exists, no changes needed.");
      return;
    }
    
    // Add the createQuestion method after fetchQuestionsByCategory
    const createQuestionMethod = `
  /**
   * Create a new question
   */
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    console.log('[QuestionService] Creating new question:', question);
    
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    console.log('[QuestionService] Question created successfully:', data);
    return data;
  }`;
    
    // Find the position to insert the method (after fetchQuestionsByCategory)
    const insertPosition = content.indexOf('static async fetchDropdownOptions');
    
    if (insertPosition === -1) {
      console.error("❌ Could not find insertion point for createQuestion method");
      process.exit(1);
    }
    
    // Insert the method
    const updatedContent = 
      content.slice(0, insertPosition) + 
      createQuestionMethod + 
      "\n  \n  " + 
      content.slice(insertPosition);
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully added createQuestion method to QuestionService.");
    console.log("This should fix the 409 conflict error when creating questions.");
    
  } catch (error) {
    console.error("\n❌ Error adding createQuestion method:", error.message);
    process.exit(1);
  }
}

// Run the function
fixCreateQuestion()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });