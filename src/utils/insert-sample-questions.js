// Script to insert sample questions through the Supabase client
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Immediately invoked async function
(async () => {
  console.log("Inserting sample questions...");
  
  try {
    // First, get a valid user ID from the profiles table
    console.log("Fetching a valid user ID...");
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError || !profiles || profiles.length === 0) {
      console.error("Error getting a valid user ID:", profileError || "No users found");
      return;
    }
    
    const createdBy = profiles[0].id;
    console.log("Using user ID for created_by:", createdBy);
    
    // Create sample questions
    const questionsToInsert = [
      {
        id: uuidv4(),
        question: 'Do you have a history of glaucoma?',
        question_type: 'dropdown',
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true
      },
      {
        id: uuidv4(),
        question: 'Have you experienced eye pressure or discomfort?',
        question_type: 'dropdown',
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true
      },
      {
        id: uuidv4(),
        question: 'Are you currently using eye drops?',
        question_type: 'dropdown',
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true
      }
    ];
    
    // Insert the questions
    const { data: insertedQuestions, error: questionError } = await supabase
      .from('questions')
      .upsert(questionsToInsert, { onConflict: 'id' })
      .select();
    
    if (questionError) {
      console.error("Error inserting questions:", questionError);
      return;
    }
    
    console.log("Successfully inserted questions:", insertedQuestions);
    
    // Update the question_text to match question
    for (const question of insertedQuestions) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ question_text: question.question })
        .eq('id', question.id);
      
      if (updateError) {
        console.error(`Error updating question_text for ${question.id}:`, updateError);
      }
    }
    
    // Now insert dropdown options for these questions
    for (const question of insertedQuestions) {
      // Yes option
      const yesScore = 
        question.question.includes('glaucoma') ? 5 :
        question.question.includes('pressure') ? 3 :
        question.question.includes('eye drops') ? 2 : 1;
      
      const yesOption = {
        id: uuidv4(),
        question_id: question.id,
        option_text: 'Yes',
        option_value: 'yes',
        score: yesScore,
        created_at: new Date().toISOString()
      };
      
      // No option
      const noOption = {
        id: uuidv4(),
        question_id: question.id,
        option_text: 'No',
        option_value: 'no',
        score: 0,
        created_at: new Date().toISOString()
      };
      
      // Insert options
      const { error: optionError } = await supabase
        .from('dropdown_options')
        .upsert([yesOption, noOption], { onConflict: 'id' });
      
      if (optionError) {
        console.error(`Error inserting options for question ${question.id}:`, optionError);
      }
    }
    
    console.log("Sample questions and options inserted successfully");
    
    // Verify the data
    const { data: questions, error: verifyError } = await supabase
      .from('questions')
      .select(`
        id, 
        question,
        question_text,
        question_type,
        dropdown_options (
          id,
          option_text,
          score
        )
      `);
    
    if (verifyError) {
      console.error("Error verifying questions:", verifyError);
    } else {
      console.log("Questions with options:", JSON.stringify(questions, null, 2));
    }
    
  } catch (error) {
    console.error("Error executing script:", error);
  }
})();
