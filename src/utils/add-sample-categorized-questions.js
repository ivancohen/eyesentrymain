// Script to add sample questions with page categories
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Immediately invoked async function
(async () => {
  console.log("Adding sample questions with page categories...");
  console.log("NOTE: To enable full category support, the database admin will need to run:");
  console.log("  - supabase/add_question_category.sql");
  
  try {
    // Test if page_category is supported in the database
    let hasPageCategorySupport = false;
    
    try {
      console.log("Testing if page_category column exists...");
      const testQuestionData = {
        id: uuidv4(),
        question: "Test question - will be deleted",
        question_type: "text",
        created_at: new Date().toISOString(),
        created_by: uuidv4(),
        page_category: "test"
      };
      
      const { data, error } = await supabase
        .from('questions')
        .insert([testQuestionData])
        .select();
      
      // If no error about page_category, it exists
      hasPageCategorySupport = !error || !error.message.includes('page_category');
      
      // Clean up test question
      if (data && data.length > 0) {
        await supabase.from('questions').delete().eq('id', data[0].id);
      }
      
      console.log("Page category support:", hasPageCategorySupport ? "YES" : "NO");
    } catch (testError) {
      console.log("Error testing for page_category column:", testError);
      console.log("Assuming page_category is NOT supported");
    }
    
    // Get a valid user ID from the profiles table
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
    
    // Define sample questions for each page category
    const questionsToInsert = [
      // Patient Information page
      {
        id: uuidv4(),
        question: "Do you wear glasses or contact lenses?",
        question_type: "dropdown",
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true,
        ...(hasPageCategorySupport ? { page_category: "patient_info" } : {})
      },
      {
        id: uuidv4(),
        question: "Have you had any eye surgeries in the past?",
        question_type: "dropdown",
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true,
        ...(hasPageCategorySupport ? { page_category: "patient_info" } : {})
      },
      
      // Family & Medication History page
      {
        id: uuidv4(),
        question: "Is there a history of macular degeneration in your family?",
        question_type: "dropdown",
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true,
        ...(hasPageCategorySupport ? { page_category: "family_medication" } : {})
      },
      {
        id: uuidv4(),
        question: "Are you currently taking blood pressure medication?",
        question_type: "dropdown",
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true,
        ...(hasPageCategorySupport ? { page_category: "family_medication" } : {})
      },
      
      // Clinical Measurements page
      {
        id: uuidv4(),
        question: "Have you had OCT imaging in the last year?",
        question_type: "dropdown",
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true,
        ...(hasPageCategorySupport ? { page_category: "clinical_measurements" } : {})
      },
      {
        id: uuidv4(),
        question: "Have you had a visual field test in the last year?",
        question_type: "dropdown",
        created_at: new Date().toISOString(),
        created_by: createdBy,
        has_conditional_items: false,
        has_dropdown_options: true,
        has_dropdown_scoring: true,
        ...(hasPageCategorySupport ? { page_category: "clinical_measurements" } : {})
      }
    ];
    
    // Insert questions one by one to handle dependencies better
    for (const questionData of questionsToInsert) {
      // Insert the question
      const categoryText = hasPageCategorySupport ? 
        `to ${questionData.page_category} page` : 
        "(page category not supported)";
      
      console.log(`Adding question: "${questionData.question}" ${categoryText}`);
      
      const { data: insertedQuestion, error: questionError } = await supabase
        .from('questions')
        .upsert([questionData], { onConflict: 'id' })
        .select();
      
      if (questionError) {
        console.error(`Error inserting question "${questionData.question}":`, questionError);
        continue;
      }
      
      if (!insertedQuestion || insertedQuestion.length === 0) {
        console.error(`Failed to insert question "${questionData.question}"`);
        continue;
      }
      
      const insertedQuestionId = insertedQuestion[0].id;
      
      // Add dropdown options for the question
      const yesScore = Math.floor(Math.random() * 5) + 1; // Random score 1-5
      
      const yesOption = {
        id: uuidv4(),
        question_id: insertedQuestionId,
        option_text: 'Yes',
        option_value: 'yes',
        score: yesScore,
        created_at: new Date().toISOString()
      };
      
      const noOption = {
        id: uuidv4(),
        question_id: insertedQuestionId,
        option_text: 'No',
        option_value: 'no',
        score: 0,
        created_at: new Date().toISOString()
      };
      
      // Insert the options
      const { error: optionsError } = await supabase
        .from('dropdown_options')
        .upsert([yesOption, noOption], { onConflict: 'id' });
      
      if (optionsError) {
        console.error(`Error inserting options for question "${questionData.question}":`, optionsError);
      } else {
        console.log(`Added options for question: "${questionData.question}"`);
      }
    }
    
    console.log("\nAll sample questions added successfully");
    console.log("\nYou can now go to the Questions page to view and edit these questions");
    console.log("or to the Question Scoring section in the Admin page to manage scores.");
    
    if (!hasPageCategorySupport) {
      console.log("\nNOTE: The page_category column is not available in your database.");
      console.log("To enable page categories, ask your database administrator to run:");
      console.log("  - supabase/add_question_category.sql");
    }
    
  } catch (error) {
    console.error("Error executing script:", error);
  }
})();
