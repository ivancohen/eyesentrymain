// Script to run the questionnaire and doctor approval fix SQL directly
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase credentials from the EyeSentry project
const supabaseUrl = 'https://gebojeuaeaqmdfrxptqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYm9qZXVhZWFxbWRmcnhwdHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDQ2NDEsImV4cCI6MjA1NzEyMDY0MX0.Fpzp_tD07GXGNvf2k7HLLOe1-UHLU_jOb-fKwZvn6OM';

// SQL file paths
const doctorApprovalsSetupPath = path.join(process.cwd(), 'eyesentrymain', 'supabase', 'doctor_approvals_setup.sql');
const doctorApprovalCheckFunctionPath = path.join(process.cwd(), 'eyesentrymain', 'supabase', 'doctor_approval_check_function.sql');
const fixPatientQuestionnairesTablePath = path.join(process.cwd(), 'eyesentrymain', 'supabase', 'fix_patient_questionnaires_table.sql');
const fixQuestionsTablePath = path.join(process.cwd(), 'eyesentrymain', 'supabase', 'fix_questions_table.sql');

// Function to read SQL file
function readSqlFile(filePath) {
  console.log(`Reading SQL file: ${filePath}`);
  try {
    const sqlScript = fs.readFileSync(filePath, 'utf8');
    console.log(`SQL file loaded successfully (${sqlScript.length} bytes)`);
    return sqlScript;
  } catch (error) {
    console.error(`Error reading SQL file: ${error.message}`);
    return null;
  }
}

// Split SQL script into statements
function splitSqlStatements(sqlScript) {
  if (!sqlScript) return [];
  
  return sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
}

async function executeSQL() {
  // Initialize the Supabase client
  console.log(`Connecting to Supabase: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // First check if we can authenticate
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error(`Authentication error: ${authError.message}`);
      // Try to continue anyway - some queries might work with anon key
    } else {
      console.log(`Authentication successful: ${authData.session ? 'Session found' : 'No session'}`);
    }
  } catch (error) {
    console.error(`Error checking authentication: ${error.message}`);
  }

  // Read SQL files
  const doctorApprovalsSetupSQL = readSqlFile(doctorApprovalsSetupPath);
  const doctorApprovalCheckFunctionSQL = readSqlFile(doctorApprovalCheckFunctionPath);
  const fixPatientQuestionnairesTableSQL = readSqlFile(fixPatientQuestionnairesTablePath);
  const fixQuestionsTableSQL = readSqlFile(fixQuestionsTablePath);

  // Due to RLS restrictions, we'll likely need admin credentials to run the SQL
  console.log(`\nNOTICE: To run the SQL scripts, you should:`);
  console.log(`1. Login to the Supabase Dashboard: https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf`);
  console.log(`2. Go to SQL Editor and run the following scripts in order:`);
  console.log(`   a. supabase/doctor_approvals_setup.sql`);
  console.log(`   b. supabase/doctor_approval_check_function.sql`);
  console.log(`   c. supabase/fix_patient_questionnaires_table.sql`);
  console.log(`   d. supabase/fix_questions_table.sql`);
  
  // Check if doctor_approvals table exists
  console.log(`\nChecking if doctor_approvals table exists...`);
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('doctor_approvals')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error(`Error checking doctor_approvals table: ${tableError.message}`);
      console.log('The doctor_approvals table might not exist yet. Please run the setup script.');
    } else {
      console.log('doctor_approvals table exists!');
    }
  } catch (error) {
    console.error(`Unexpected error checking doctor_approvals table: ${error.message}`);
  }
  
  // Check if check_doctor_approval_status function exists
  console.log(`\nChecking if check_doctor_approval_status function exists...`);
  try {
    const { data: funcData, error: funcError } = await supabase.rpc('check_doctor_approval_status', {
      p_user_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
    });
    
    if (funcError) {
      console.error(`Error checking function: ${funcError.message}`);
      console.log('The check_doctor_approval_status function might not exist yet. Please run the function script.');
    } else {
      console.log('check_doctor_approval_status function exists!');
      console.log('Function result:', funcData);
    }
  } catch (error) {
    console.error(`Unexpected error checking function: ${error.message}`);
  }
  
  // Check if patient_questionnaires table has the right structure
  console.log(`\nChecking patient_questionnaires table structure...`);
  try {
    const { data: insertData, error: insertError } = await supabase.rpc('insert_patient_questionnaire', {
      first_name: 'Test',
      last_name: 'User',
      age: '30',
      race: 'white',
      family_glaucoma: false,
      ocular_steroid: false,
      steroid_type: null,
      intravitreal: false,
      intravitreal_type: null,
      systemic_steroid: false,
      systemic_steroid_type: null,
      iop_baseline: false,
      vertical_asymmetry: false,
      vertical_ratio: false,
      total_score: 0,
      risk_level: 'Low'
    });
    
    if (insertError) {
      console.error(`Error testing patient_questionnaires table: ${insertError.message}`);
      console.log('The patient_questionnaires table might need fixing. Please run the fix script.');
    } else {
      console.log('patient_questionnaires table structure is correct!');
      console.log('Test insert ID:', insertData);
    }
  } catch (error) {
    console.error(`Unexpected error testing patient_questionnaires table: ${error.message}`);
  }
  
  // Check if questions table has the right structure
  console.log(`\nChecking questions table structure...`);
  try {
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('id, question')
      .limit(1);
    
    if (questionsError) {
      console.error(`Error checking questions table: ${questionsError.message}`);
      console.log('The questions table might not exist or you might not have access to it.');
    } else {
      console.log('Successfully queried questions table!');
      
      // Try to insert a test question
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('questions')
          .insert({
            question: 'Test question from diagnostic script',
            page_category: 'test',
            question_type: 'text'
          })
          .select('id');
        
        if (insertError) {
          console.error(`Error inserting test question: ${insertError.message}`);
          console.log('The questions table might need fixing. Please run the fix_questions_table.sql script.');
        } else {
          console.log('Successfully inserted test question!');
          console.log('Test question ID:', insertData[0]?.id);
          
          // Clean up the test question
          await supabase
            .from('questions')
            .delete()
            .eq('id', insertData[0]?.id);
        }
      } catch (insertError) {
        console.error(`Unexpected error inserting test question: ${insertError.message}`);
        console.log('The questions table might need fixing. Please run the fix_questions_table.sql script.');
      }
    }
  } catch (error) {
    console.error(`Unexpected error checking questions table: ${error.message}`);
  }
}

// Run the SQL execution
executeSQL().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});