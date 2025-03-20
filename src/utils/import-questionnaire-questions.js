// Script to import existing questionnaire questions into the management system
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { QUESTIONNAIRE_PAGES } from "../constants/questionnaireConstants";

// Immediately invoked async function
(async () => {
  console.log("Importing existing questionnaire questions into the management system...");
  
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
    
    // Check if page_category column exists
    let hasPageCategorySupport = false;
    try {
      console.log("Testing if page_category column exists...");
      const testQuestionData = {
        id: uuidv4(),
        question: "Test question - will be deleted",
        question_type: "text",
        created_at: new Date().toISOString(),
        created_by: createdBy,
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
    
    // Optional: Delete existing sample questions
    console.log("Deleting any existing sample questions...");
    // This is safe because real questionnaire questions would be linked to responses
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .is('question', null); // Questions without question are likely sample questions
    
    if (deleteError) {
      console.error("Error deleting sample questions:", deleteError);
    }
    
    // Process each page of the questionnaire
    const pageCategories = ["patient_info", "family_medication", "clinical_measurements"];
    
    for (let pageIndex = 0; pageIndex < QUESTIONNAIRE_PAGES.length; pageIndex++) {
      const pageQuestions = QUESTIONNAIRE_PAGES[pageIndex];
      const pageCategory = pageCategories[pageIndex];
      
      console.log(`\nImporting ${pageQuestions.length} questions from page ${pageIndex + 1} (${pageCategory})...`);
      
      // Process each question on the page
      for (const questionItem of pageQuestions) {
        // Skip items that are just UI or not real questions
        if (!questionItem.text || questionItem.text.trim() === "") continue;
        
        console.log(`Adding question: "${questionItem.text}"`);
        
        // Determine question type
        let questionType = "text";
        if (questionItem.type === "select") {
          questionType = "dropdown";
        } else if (questionItem.type === "number") {
          questionType = "number";
        }
        
        // Create the question
        const questionData = {
          id: uuidv4(),
          question: questionItem.text,
          question_type: questionType,
          created_at: new Date().toISOString(),
          created_by: createdBy,
          has_conditional_items: false,
          has_dropdown_options: questionType === "dropdown",
          has_dropdown_scoring: questionType === "dropdown"
        };
        
        // Add page category if supported
        if (hasPageCategorySupport) {
          questionData.page_category = pageCategory;
        }
        
        // Insert the question
        const { data: insertedQuestion, error: questionError } = await supabase
          .from('questions')
          .upsert([questionData])
          .select();
        
        if (questionError) {
          console.error(`Error inserting question "${questionItem.text}":`, questionError);
          continue;
        }
        
        if (!insertedQuestion || insertedQuestion.length === 0) {
          console.error(`Failed to insert question "${questionItem.text}"`);
          continue;
        }
        
        const insertedQuestionId = insertedQuestion[0].id;
        
        // Add dropdown options if this is a dropdown question
        if (questionType === "dropdown" && questionItem.options) {
          console.log(`Adding ${questionItem.options.length} options...`);
          
          // Generate options with scores
          const dropdownOptions = questionItem.options.map((option, index) => {
            let score = 0;
            
            // Assign scores based on the option value and text
            if (option.value === "yes" || 
                option.value === "22_and_above" || 
                option.value === "0.2_and_above" ||
                option.value === "0.6_and_above") {
              // Higher risk options get higher scores
              score = 5;
            } else if (option.value === "not_available") {
              // Medium risk for unknown values
              score = 2;
            } else if (option.value.includes("steroid") || option.value.includes("pred")) {
              // Steroid-related options get higher scores
              score = 4;
            }
            
            return {
              id: uuidv4(),
              question_id: insertedQuestionId,
              option_text: option.label,
              option_value: option.value,
              score: score,
              created_at: new Date().toISOString()
            };
          });
          
          // Insert the options
          const { error: optionsError } = await supabase
            .from('dropdown_options')
            .upsert(dropdownOptions, { onConflict: 'id' });
          
          if (optionsError) {
            console.error(`Error inserting options for question "${questionItem.text}":`, optionsError);
          } else {
            console.log(`Added options for question: "${questionItem.text}"`);
          }
        }
      }
    }
    
    console.log("\nAll questionnaire questions imported successfully");
    
    // Verify the data
    const { data: questions, error: verifyError } = await supabase
      .from('questions')
      .select(`
        id, 
        question,
        question_type,
        has_dropdown_options,
        ${hasPageCategorySupport ? 'page_category,' : ''}
        dropdown_options (
          id,
          option_text,
          score
        )
      `)
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error("Error verifying questions:", verifyError);
    } else {
      console.log(`\nImported a total of ${questions.length} questions:`);
      
      questions.forEach((q, i) => {
        console.log(`[${i+1}] ${q.question} (${q.question_type})${hasPageCategorySupport ? ' - ' + (q.page_category || 'uncategorized') : ''}`);
        
        if (q.dropdown_options && q.dropdown_options.length > 0) {
          console.log(`   Options: ${q.dropdown_options.length}`);
          q.dropdown_options.forEach(opt => {
            console.log(`   - ${opt.option_text}: score ${opt.score}`);
          });
        }
      });
    }
    
    console.log("\nYou can now access these questions in the Admin -> Question Management section");
    console.log("The scoring can be edited by clicking on the edit icon next to each question");
    
  } catch (error) {
    console.error("Error executing script:", error);
  }
})();
