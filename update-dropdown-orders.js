// Script to update dropdown options with sequential display_order values
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

// Main function
async function updateDropdownOrders() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING DROPDOWN OPTIONS WITH SEQUENTIAL DISPLAY_ORDER VALUES");
    console.log("=".repeat(80));
    
    // Get all questions with dropdown options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question')
      .eq('has_dropdown_options', true)
      .eq('status', 'Active');
    
    if (questionsError) {
      console.error("❌ Error fetching questions:", questionsError.message);
      throw questionsError;
    }
    
    console.log(`Found ${questions.length} questions with dropdown options`);
    
    // Process each question
    for (const question of questions) {
      console.log(`\nProcessing question: ${question.question} (${question.id})`);
      
      // Get all options for this question
      const { data: options, error: optionsError } = await supabase
        .from('dropdown_options')
        .select('id, option_text, display_order')
        .eq('question_id', question.id)
        .order('created_at, id');
      
      if (optionsError) {
        console.error(`❌ Error fetching options for question ${question.id}:`, optionsError.message);
        continue;
      }
      
      console.log(`Found ${options.length} options`);
      
      // Update each option with sequential display_order
      for (let i = 0; i < options.length; i++) {
        const newDisplayOrder = i + 1;
        console.log(`  - Setting ${options[i].option_text} (${options[i].id}) to display_order ${newDisplayOrder}`);
        
        const { error: updateError } = await supabase
          .from('dropdown_options')
          .update({ display_order: newDisplayOrder })
          .eq('id', options[i].id);
        
        if (updateError) {
          console.error(`❌ Error updating option ${options[i].id}:`, updateError.message);
        }
      }
    }
    
    console.log("\n✅ All dropdown options updated with sequential display_order values");
  } catch (error) {
    console.error("\n❌ Error updating dropdown options:", error);
    process.exit(1);
  }
}

// Run the function
updateDropdownOrders()
  .then(() => {
    console.log("\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during update:", err);
    process.exit(1);
  });
