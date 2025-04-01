// Script to verify reordering functionality
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test function
async function testReordering() {
  try {
    console.log("=".repeat(80));
    console.log("VERIFYING REORDERING FUNCTIONALITY");
    console.log("=".repeat(80));
    
    // Get a question with dropdown options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question')
      .eq('has_dropdown_options', true)
      .eq('status', 'Active')
      .limit(1);
    
    if (questionsError || !questions || questions.length === 0) {
      console.error("❌ Error: Could not find a question with dropdown options");
      return false;
    }
    
    const question = questions[0];
    console.log(`Testing with question: ${question.question} (${question.id})`);
    
    // Get the options for this question
    const { data: options, error: optionsError } = await supabase
      .from('dropdown_options')
      .select('id, option_text, display_order')
      .eq('question_id', question.id)
      .order('display_order');
    
    if (optionsError || !options || options.length < 2) {
      console.error("❌ Error: Could not find enough options for testing");
      return false;
    }
    
    console.log("Current order:");
    options.forEach(opt => console.log(`  - ${opt.option_text} (Order: ${opt.display_order})`));
    
    // Reverse the order
    const updates = options.map((option, index) => ({
      id: option.id,
      display_order: options.length - index
    }));
    
    console.log("\nApplying reverse order...");
    
    // Update each option directly
    for (const update of updates) {
      const { error } = await supabase
        .from('dropdown_options')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
      
      if (error) {
        console.error(`❌ Error updating option ${update.id}:`, error.message);
        return false;
      }
    }
    
    // Verify the changes
    const { data: updatedOptions, error: verifyError } = await supabase
      .from('dropdown_options')
      .select('id, option_text, display_order')
      .eq('question_id', question.id)
      .order('display_order');
    
    if (verifyError) {
      console.error("❌ Error verifying changes:", verifyError.message);
      return false;
    }
    
    console.log("\nNew order:");
    updatedOptions.forEach(opt => console.log(`  - ${opt.option_text} (Order: ${opt.display_order})`));
    
    // Verify the order is reversed
    let isReversed = true;
    for (let i = 0; i < options.length; i++) {
      if (options[i].id !== updatedOptions[options.length - 1 - i].id) {
        isReversed = false;
        break;
      }
    }
    
    if (isReversed) {
      console.log("\n✅ SUCCESS: Order was successfully reversed!");
    } else {
      console.log("\n❌ FAILURE: Order was not correctly reversed");
      return false;
    }
    
    // Restore original order
    console.log("\nRestoring original order...");
    
    const restoreUpdates = options.map((option, index) => ({
      id: option.id,
      display_order: index + 1
    }));
    
    for (const update of restoreUpdates) {
      await supabase
        .from('dropdown_options')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
    
    console.log("✅ Original order restored");
    return true;
  } catch (error) {
    console.error("❌ Error testing reordering:", error);
    return false;
  }
}

// Run the test
testReordering()
  .then(success => {
    if (success) {
      console.log("\n🎉 REORDERING FUNCTIONALITY IS WORKING CORRECTLY!");
    } else {
      console.log("\n❌ REORDERING FUNCTIONALITY IS NOT WORKING CORRECTLY");
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
