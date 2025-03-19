// Simple script to verify database connection and question access
import { supabase } from "@/lib/supabase-client";

// Immediately invoked async function
(async () => {
  console.log("Verifying database connection and question access...");
  
  try {
    // Check question count
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting questions:", countError);
    } else {
      console.log(`Found ${count} questions in database`);
    }
    
    // Get sample questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, question_type')
      .limit(5);
    
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
    } else {
      console.log("Sample questions:", questions);
    }
    
    // Get dropdown options
    const { data: options, error: optionsError } = await supabase
      .from('dropdown_options')
      .select('id, question_id, option_text, score')
      .limit(10);
    
    if (optionsError) {
      console.error("Error fetching dropdown options:", optionsError);
    } else {
      console.log("Sample dropdown options:", options);
    }
    
    console.log("Verification complete");
  } catch (error) {
    console.error("Error during verification:", error);
  }
})();
