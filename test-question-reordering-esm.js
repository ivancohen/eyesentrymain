// Script to test the question reordering functionality
// Using ES modules for compatibility with the project's module system
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Testing function
async function testQuestionReordering() {
  try {
    console.log("=".repeat(80));
    console.log("TESTING QUESTION REORDERING FUNCTIONALITY");
    console.log("=".repeat(80));
    console.log();
    
    // Load dependencies
    const { QuestionService } = await loadDependencies();
    
    let testResult = true;
    
    // 1. Get all questions
    console.log("1️⃣ Fetching all questions...");
    const questions = await QuestionService.fetchQuestions();
    
    if (!questions || questions.length === 0) {
      console.error("❌ No questions found in the database");
      return false;
    }
    
    console.log(`✅ Found ${questions.length} questions`);
    
    // 2. Find a question with dropdown options
    console.log("\n2️⃣ Looking for a question with dropdown options...");
    const questionsWithDropdown = questions.filter(q => q.has_dropdown_options);
    
    if (!questionsWithDropdown || questionsWithDropdown.length === 0) {
      console.error("❌ No questions with dropdown options found");
      return false;
    }
    
    const testQuestion = questionsWithDropdown[0];
    console.log(`✅ Selected question: ${testQuestion.question} (ID: ${testQuestion.id})`);
    
    // 3. Fetch dropdown options for the question
    console.log(`\n3️⃣ Fetching dropdown options for question ID ${testQuestion.id}...`);
    const options = await QuestionService.fetchDropdownOptions(testQuestion.id);
    
    if (!options || options.length < 2) {
      console.error("❌ Question doesn't have enough dropdown options for reordering test (need at least 2)");
      return false;
    }
    
    console.log(`✅ Found ${options.length} dropdown options`);
    console.log("Current order:");
    options.forEach(opt => {
      console.log(`   - ${opt.option_text} (ID: ${opt.id}, Order: ${opt.display_order})`);
    });
    
    // 4. Create updates to reverse the order
    console.log("\n4️⃣ Creating updates to reverse the order...");
    const originalOrder = [...options];
    const updates = options.map((option, index) => ({
      id: option.id,
      display_order: options.length - index // Reverse the order
    }));
    
    console.log("Reorder updates:");
    updates.forEach(update => {
      console.log(`   - ID: ${update.id}, New Order: ${update.display_order}`);
    });
    
    // 5. Apply the reordering
    console.log("\n5️⃣ Applying reordering...");
    await QuestionService.reorderDropdownOptions(updates);
    console.log("✅ Reordering applied");
    
    // 6. Fetch the options again to verify changes
    console.log("\n6️⃣ Fetching dropdown options again to verify changes...");
    const updatedOptions = await QuestionService.fetchDropdownOptions(testQuestion.id);
    
    console.log("New order:");
    updatedOptions.forEach(opt => {
      console.log(`   - ${opt.option_text} (ID: ${opt.id}, Order: ${opt.display_order})`);
    });
    
    // 7. Verify the order has been reversed
    console.log("\n7️⃣ Verifying the order has been reversed...");
    let orderCorrect = true;
    
    for (let i = 0; i < updatedOptions.length; i++) {
      const expectedId = originalOrder[originalOrder.length - 1 - i].id;
      const actualId = updatedOptions[i].id;
      
      if (expectedId !== actualId) {
        console.error(`❌ Order is incorrect at position ${i}`);
        console.error(`   Expected ID: ${expectedId}, Actual ID: ${actualId}`);
        orderCorrect = false;
        testResult = false;
        break;
      }
    }
    
    if (orderCorrect) {
      console.log("✅ Order has been correctly reversed");
    }
    
    // 8. Restore the original order
    console.log("\n8️⃣ Restoring the original order...");
    const restoreUpdates = originalOrder.map((option, index) => ({
      id: option.id,
      display_order: index + 1
    }));
    
    await QuestionService.reorderDropdownOptions(restoreUpdates);
    console.log("✅ Original order restored");
    
    // Final results
    console.log("\n=".repeat(80));
    if (testResult) {
      console.log("🎉 TEST PASSED: Question reordering functionality is working correctly!");
    } else {
      console.log("❌ TEST FAILED: Question reordering functionality is not working correctly");
    }
    console.log("=".repeat(80));
    
    return testResult;
    
  } catch (error) {
    console.error("\n❌ Error testing question reordering:", error);
    return false;
  }
}

// Helper function to load dependencies
async function loadDependencies() {
  try {
    console.log("Loading dependencies...");
    
    // Load environment variables
    dotenv.config();
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found in environment variables');
    }
    
    // Create the Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create a minimal QuestionService implementation for testing
    const QuestionService = {
      async fetchQuestions() {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('status', 'Active')
          .order('page_category')
          .order('display_order');
        
        if (error) {
          console.error('Error fetching questions:', error);
          throw error;
        }
        
        return data || [];
      },
      
      async fetchDropdownOptions(questionId) {
        const { data, error } = await supabase
          .from('dropdown_options')
          .select('*')
          .eq('question_id', questionId)
          .order('display_order');
        
        if (error) {
          console.error(`Error fetching dropdown options for question ${questionId}:`, error);
          throw error;
        }
        
        return data || [];
      },
      
      async updateDropdownOption(id, updates) {
        const { data, error } = await supabase
          .from('dropdown_options')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error(`Error updating dropdown option ${id}:`, error);
          throw error;
        }
        
        return data;
      },
      
      async reorderDropdownOptions(updates) {
        try {
          console.log('Reordering dropdown options:', updates);
          
          // Update each dropdown option directly
          for (const update of updates) {
            console.log(`Updating option ${update.id} to display_order ${update.display_order}`);
            
            // Use the updateDropdownOption method to update each option
            await this.updateDropdownOption(update.id, { display_order: update.display_order });
          }
          
          console.log('Successfully reordered dropdown options');
        } catch (err) {
          console.error('Error in reorderDropdownOptions:', err);
          throw err;
        }
      }
    };
    
    return { QuestionService };
  } catch (error) {
    console.error("Error loading dependencies:", error);
    throw error;
  }
}

// Run the test
testQuestionReordering()
  .then(result => {
    console.log("\nTest script completed.");
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error("\nFatal error during testing:", err);
    process.exit(1);
  });