// Fix questionnaire system to prioritize admin-created questions using direct SQL
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
dotenv.config();

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    
    // 3. Make sure is_active column exists - using direct SQL
    console.log("Ensuring is_active column exists with direct SQL...");
    
    const alterTableSql = `
      -- Make sure the column exists
      ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      
      -- Create index on is_active column for better performance
      CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);
    `;
    
    const { data: alterResult, error: alterError } = await supabase.rpc('execute_sql', {
      sql_statement: alterTableSql
    });
    
    if (alterError) {
      console.error("Error adding is_active column:", alterError);
      console.log("Proceeding anyway in case the column already exists in the database...");
    } else {
      console.log("is_active column ensured");
    }
    
    // 4. Process each duplicate group using direct SQL for updates
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
      
      // Update each duplicate using direct SQL
      for (const question of toDeactivate) {
        console.log(`Deactivating: ID ${question.id} (created ${question.created_at})`);
        
        // Using direct SQL to update is_active
        const updateSql = `
          UPDATE public.questions 
          SET is_active = false 
          WHERE id = '${question.id}'::uuid;
        `;
        
        const { data: updateResult, error: updateError } = await supabase.rpc('execute_sql', {
          sql_statement: updateSql
        });
        
        if (updateError) {
          console.error(`Error deactivating question ${question.id}:`, updateError);
        } else {
          console.log(`✅ Successfully deactivated question ${question.id}`);
          totalDeactivated++;
        }
      }
    }
    
    console.log(`Successfully deactivated ${totalDeactivated} duplicate questions`);
    
    // 5. Standardize category names using direct SQL
    console.log("Standardizing category names...");
    
    const categoryMappings = [
      { pattern: 'patient_info', standard: 'patient_info', sql: "page_category LIKE '%patient%info%'" },
      { pattern: 'medical_history', standard: 'medical_history', sql: "page_category LIKE '%medical%history%'" },
      { pattern: 'clinical_measurements', standard: 'clinical_measurements', sql: "page_category LIKE '%clinical%measurements%'" }
    ];
    
    for (const mapping of categoryMappings) {
      // Get count first
      const countSql = `
        SELECT COUNT(*) FROM public.questions
        WHERE ${mapping.sql};
      `;
      
      const { data: countResult, error: countError } = await supabase.rpc('execute_sql', {
        sql_statement: countSql
      });
      
      if (countError) {
        console.error(`Error counting questions for ${mapping.pattern}:`, countError);
        continue;
      }
      
      console.log(`Found questions with category matching ${mapping.pattern}`);
      
      // Update categories using direct SQL
      const updateSql = `
        UPDATE public.questions
        SET page_category = '${mapping.standard}'
        WHERE ${mapping.sql} AND page_category != '${mapping.standard}';
      `;
      
      const { data: updateResult, error: updateError } = await supabase.rpc('execute_sql', {
        sql_statement: updateSql
      });
      
      if (updateError) {
        console.error(`Error updating categories for ${mapping.pattern}:`, updateError);
      } else {
        console.log(`✅ Successfully standardized ${mapping.pattern} category`);
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