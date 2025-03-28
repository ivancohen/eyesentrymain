// Fix questionnaire system to prioritize admin-created questions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixQuestionnaireSystem() {
  try {
    console.log("Analyzing questions table...");
    
    // 1. Get all questions
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*');
      
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      process.exit(1);
    }
    
    console.log(`Found ${allQuestions.length} questions in database`);
    
    // 2. Identify duplicate questions
    const questionsByText = {};
    const duplicateQuestions = [];
    
    allQuestions.forEach(q => {
      const key = `${q.question}-${q.page_category}`;
      if (!questionsByText[key]) {
        questionsByText[key] = [];
      }
      questionsByText[key].push(q);
      
      if (questionsByText[key].length > 1) {
        duplicateQuestions.push(q);
      }
    });
    
    const duplicateGroups = Object.values(questionsByText).filter(group => group.length > 1);
    console.log(`Found ${duplicateGroups.length} groups of duplicate questions`);
    
    // 3. Add is_active column if needed
    console.log("Checking if is_active column exists...");
    try {
      // Try to select using is_active to see if it exists
      await supabase.from('questions').select('is_active').limit(1);
      console.log("is_active column already exists");
    } catch (e) {
      console.log("is_active column doesn't exist, adding it...");
      
      // Run the alter table command
      const { error: alterError } = await supabase.rpc('execute_statement', {
        statement: 'ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true'
      });
      
      if (alterError) {
        console.log("Using alternative method to add column...");
        // Direct SQL approach - many Supabase instances have this function
        const { error: directSqlError } = await supabase.rpc('alter_table', {
          table_name: 'questions', 
          column_name: 'is_active', 
          column_type: 'BOOLEAN',
          default_value: 'true'
        });
        
        if (directSqlError) {
          console.error("Error adding is_active column:", directSqlError);
          console.log("Please add the column manually using the SQL Editor");
        } else {
          console.log("is_active column added successfully");
        }
      } else {
        console.log("is_active column added successfully");
      }
    }
    
    // 4. Process each duplicate group
    let totalDeactivated = 0;
    
    for (const group of duplicateGroups) {
      console.log(`Processing duplicate group: "${group[0].question}" (${group.length} duplicates)`);
      
      // Sort by created_by to prioritize admin-created questions
      // Then by created_at to get the newest
      group.sort((a, b) => {
        // First, prioritize questions with created_by set
        if (a.created_by && !b.created_by) return -1;
        if (!a.created_by && b.created_by) return 1;
        
        // If both have created_by or both don't, sort by created_at, newest first
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Keep only the first question active, deactivate others
      const keepActive = group[0];
      const toDeactivate = group.slice(1);
      
      console.log(`Keeping active: ID ${keepActive.id} (created ${keepActive.created_at})`);
      
      // Update each duplicate to set is_active=false
      for (const question of toDeactivate) {
        console.log(`Deactivating: ID ${question.id} (created ${question.created_at})`);
        
        const { error: updateError } = await supabase
          .from('questions')
          .update({ is_active: false })
          .eq('id', question.id);
          
        if (updateError) {
          console.error(`Error deactivating question ${question.id}:`, updateError);
        } else {
          totalDeactivated++;
        }
      }
    }
    
    console.log(`Successfully deactivated ${totalDeactivated} duplicate questions`);
    
    // 5. Standardize category names
    console.log("Standardizing category names...");
    
    const categoryMappings = [
      { pattern: /patient_?info/i, standard: 'patient_info' },
      { pattern: /medical_?history/i, standard: 'medical_history' },
      { pattern: /clinical_?measurements/i, standard: 'clinical_measurements' }
    ];
    
    for (const mapping of categoryMappings) {
      const { data: matchingQuestions, error: matchError } = await supabase
        .from('questions')
        .select('id, page_category')
        .like('page_category', `%${mapping.pattern.source.replace(/[_?]/g, '%')}%`);
        
      if (matchError) {
        console.error(`Error finding questions matching ${mapping.pattern}:`, matchError);
        continue;
      }
      
      console.log(`Found ${matchingQuestions.length} questions with category matching ${mapping.pattern}`);
      
      for (const question of matchingQuestions) {
        if (question.page_category !== mapping.standard) {
          console.log(`Updating category: ${question.page_category} -> ${mapping.standard}`);
          
          const { error: updateError } = await supabase
            .from('questions')
            .update({ page_category: mapping.standard })
            .eq('id', question.id);
            
          if (updateError) {
            console.error(`Error updating category for question ${question.id}:`, updateError);
          }
        }
      }
    }
    
    console.log("Questionnaire system fix completed successfully!");
    
  } catch (error) {
    console.error("Error fixing questionnaire system:", error);
    process.exit(1);
  }
}

// Run the fix
fixQuestionnaireSystem();