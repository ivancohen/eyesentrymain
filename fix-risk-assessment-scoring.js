// Script to fix risk assessment scoring issues
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      envVars[key] = value;
    }
  });

  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  console.log('Please make sure the .env file exists and contains VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or service role key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function
async function fixRiskAssessmentScoring() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING RISK ASSESSMENT SCORING ISSUES");
    console.log("=".repeat(80));
    
    console.log("\n📦 Creating a restore point first...");
    try {
      const { data: restoreData, error: restoreError } = await supabase.rpc('create_questionnaire_restore_point');
      
      if (restoreError) {
        console.warn("⚠️ Warning: Could not create restore point:", restoreError.message);
        console.log("Continuing with the fix...");
      } else {
        console.log("✅ Restore point created successfully!");
      }
    } catch (restoreErr) {
      console.warn("⚠️ Warning: Could not create restore point:", restoreErr.message);
      console.log("Continuing with the fix...");
    }
    
    // Step 1: Check if the insert_patient_questionnaire function exists and is working correctly
    console.log("\n1️⃣ Checking insert_patient_questionnaire function...");
    
    try {
      const { data: functionData, error: functionError } = await supabase.rpc('get_function_definition', { 
        function_name: 'insert_patient_questionnaire' 
      });
      
      if (functionError) {
        console.error("❌ Error checking function:", functionError.message);
        console.log("Will provide SQL to create/update the function...");
      } else if (functionData) {
        console.log("✅ insert_patient_questionnaire function exists");
        
        // Check if the function includes total_score and risk_level parameters
        const functionDefinition = functionData.toString();
        if (!functionDefinition.includes('total_score') || !functionDefinition.includes('risk_level')) {
          console.warn("⚠️ Function may be missing total_score or risk_level parameters");
          console.log("Will provide SQL to update the function...");
        } else {
          console.log("✅ Function includes total_score and risk_level parameters");
        }
      }
    } catch (functionErr) {
      console.warn("⚠️ Error checking function:", functionErr.message);
    }
    
    // Step 2: Check if the patient_questionnaires table has the necessary columns
    console.log("\n2️⃣ Checking patient_questionnaires table structure...");
    
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('patient_questionnaires')
        .select('total_score, risk_level')
        .limit(1);
      
      if (tableError) {
        console.error("❌ Error checking table:", tableError.message);
      } else {
        console.log("✅ patient_questionnaires table has total_score and risk_level columns");
      }
    } catch (tableErr) {
      console.warn("⚠️ Error checking table:", tableErr.message);
    }
    
    // Step 3: Provide SQL to fix any issues
    console.log("\n3️⃣ Generating SQL to fix issues...");
    
    const fixSQL = `
-- Ensure the patient_questionnaires table has the necessary columns
ALTER TABLE IF EXISTS public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Unknown';

-- Update the insert_patient_questionnaire function to properly handle risk scores
CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
  first_name TEXT,
  last_name TEXT,
  age TEXT,
  race TEXT,
  family_glaucoma BOOLEAN,
  ocular_steroid BOOLEAN,
  steroid_type TEXT,
  intravitreal BOOLEAN,
  intravitreal_type TEXT,
  systemic_steroid BOOLEAN,
  systemic_steroid_type TEXT,
  iop_baseline BOOLEAN,
  vertical_asymmetry BOOLEAN,
  vertical_ratio BOOLEAN,
  total_score INTEGER,
  risk_level TEXT,
  metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Insert the questionnaire
  INSERT INTO public.patient_questionnaires (
    user_id,
    first_name,
    last_name,
    age,
    race,
    family_glaucoma,
    ocular_steroid,
    steroid_type,
    intravitreal,
    intravitreal_type,
    systemic_steroid,
    systemic_steroid_type,
    iop_baseline,
    vertical_asymmetry,
    vertical_ratio,
    total_score,
    risk_level,
    metadata
  ) VALUES (
    current_user_id,
    first_name,
    last_name,
    age,
    race,
    family_glaucoma,
    ocular_steroid,
    steroid_type,
    intravitreal,
    intravitreal_type,
    systemic_steroid,
    systemic_steroid_type,
    iop_baseline,
    vertical_asymmetry,
    vertical_ratio,
    total_score,
    risk_level,
    metadata
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the get_patient_questionnaires_for_user function returns total_score and risk_level
CREATE OR REPLACE FUNCTION public.get_patient_questionnaires_for_user(user_id_param UUID)
RETURNS SETOF patient_questionnaires AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.patient_questionnaires
  WHERE user_id = user_id_param
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
    
    // Write the SQL to a file
    const sqlFilePath = path.join(__dirname, 'fix_risk_assessment_scoring.sql');
    fs.writeFileSync(sqlFilePath, fixSQL);
    console.log(`✅ SQL file created at ${sqlFilePath}`);
    
    // Step 4: Check if the RiskAssessmentService.ts file is correctly calculating scores
    console.log("\n4️⃣ Checking RiskAssessmentService.ts implementation...");
    
    const riskServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
    if (fs.existsSync(riskServicePath)) {
      const riskServiceContent = fs.readFileSync(riskServicePath, 'utf8');
      
      // Check if the calculateRiskScore method is properly implemented
      if (riskServiceContent.includes('calculateRiskScore') && 
          riskServiceContent.includes('totalScore') && 
          riskServiceContent.includes('risk_level')) {
        console.log("✅ RiskAssessmentService.ts has calculateRiskScore method with totalScore and risk_level");
      } else {
        console.warn("⚠️ RiskAssessmentService.ts may have issues with calculateRiskScore method");
      }
    } else {
      console.warn("⚠️ RiskAssessmentService.ts file not found");
    }
    
    // Step 5: Check if the PatientQuestionnaireService.ts file is correctly handling scores
    console.log("\n5️⃣ Checking PatientQuestionnaireService.ts implementation...");
    
    const patientServicePath = path.join(__dirname, 'src', 'services', 'PatientQuestionnaireService.ts');
    if (fs.existsSync(patientServicePath)) {
      const patientServiceContent = fs.readFileSync(patientServicePath, 'utf8');
      
      // Check if the submitPatientQuestionnaire method is properly handling scores
      if (patientServiceContent.includes('submitPatientQuestionnaire') && 
          patientServiceContent.includes('total_score') && 
          patientServiceContent.includes('risk_level')) {
        console.log("✅ PatientQuestionnaireService.ts has submitPatientQuestionnaire method with total_score and risk_level");
      } else {
        console.warn("⚠️ PatientQuestionnaireService.ts may have issues with submitPatientQuestionnaire method");
      }
    } else {
      console.warn("⚠️ PatientQuestionnaireService.ts file not found");
    }
    
    console.log("\n=".repeat(80));
    console.log("RISK ASSESSMENT SCORING FIX SUMMARY");
    console.log("=".repeat(80));
    console.log("\nTo fix the risk assessment scoring issues:");
    console.log("1. Execute the SQL in fix_risk_assessment_scoring.sql in your Supabase SQL editor");
    console.log("2. Restart the application to apply the changes");
    console.log("\nThis will ensure that risk scores are properly calculated, saved, and displayed");
    console.log("after questionnaire submission.");
    
  } catch (error) {
    console.error("\n❌ Error fixing risk assessment scoring:", error.message);
    process.exit(1);
  }
}

// Run the function
fixRiskAssessmentScoring()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });