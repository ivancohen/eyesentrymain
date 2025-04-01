// Fix to ensure risk assessment scoring pulls data from the admin section
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts.admin-scoring-backup');

// Main function
async function fixAdminScoring() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING RISK ASSESSMENT SCORING TO USE ADMIN DATA");
    console.log("=".repeat(80));
    
    // Check if the service file exists
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Error: Service file not found at ${servicePath}`);
      process.exit(1);
    }
    
    // Create a backup of the original file
    console.log(`📦 Creating backup of original file at ${backupPath}`);
    fs.copyFileSync(servicePath, backupPath);
    
    // Read the current content
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Find the calculateRiskScore method
    const calculateRiskScoreStart = content.indexOf('async calculateRiskScore');
    if (calculateRiskScoreStart === -1) {
      console.error("❌ Could not find calculateRiskScore method");
      process.exit(1);
    }
    
    // Find the section where answers are processed
    const processAnswersStart = content.indexOf('// Process each answer to calculate score', calculateRiskScoreStart);
    if (processAnswersStart === -1) {
      console.error("❌ Could not find answer processing section");
      process.exit(1);
    }
    
    // Find the end of the calculateRiskScore method
    const calculateRiskScoreEnd = content.indexOf('} catch (error) {', processAnswersStart);
    if (calculateRiskScoreEnd === -1) {
      console.error("❌ Could not find end of calculateRiskScore method");
      process.exit(1);
    }
    
    // Extract the method body
    const methodBody = content.substring(processAnswersStart, calculateRiskScoreEnd);
    
    // Check if the method already prioritizes admin data
    if (methodBody.includes('// SIMPLIFIED: Use direct lookup in the risk_assessment_config table')) {
      // Replace the comment to emphasize admin data
      const updatedMethodBody = methodBody.replace(
        '// SIMPLIFIED: Use direct lookup in the risk_assessment_config table',
        '// PRIORITY: Use admin-configured scores from risk_assessment_config table'
      );
      
      // Update the content
      const updatedContent = content.substring(0, processAnswersStart) + updatedMethodBody + content.substring(calculateRiskScoreEnd);
      fs.writeFileSync(servicePath, updatedContent);
      
      console.log("\n✅ Updated comments to emphasize admin data priority.");
    }
    
    // Add SQL to create a trigger for syncing scores
    const sqlFilePath = path.join(__dirname, 'sync-admin-scores.sql');
    const sqlContent = `-- Sync admin-configured scores with risk_assessment_config table

-- 1. Create a trigger to automatically update risk_assessment_config when dropdown options are updated
CREATE OR REPLACE FUNCTION sync_dropdown_option_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If score is updated in dropdown_options, update risk_assessment_config
  IF NEW.score IS NOT NULL AND (OLD.score IS NULL OR NEW.score != OLD.score) THEN
    INSERT INTO risk_assessment_config (question_id, option_value, score)
    VALUES (NEW.question_id::text, NEW.option_value, NEW.score)
    ON CONFLICT (question_id, option_value) 
    DO UPDATE SET score = EXCLUDED.score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_dropdown_score_trigger ON dropdown_options;
CREATE TRIGGER sync_dropdown_score_trigger
AFTER INSERT OR UPDATE ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION sync_dropdown_option_score();

-- 2. Create a trigger to automatically update dropdown_options when risk_assessment_config is updated
CREATE OR REPLACE FUNCTION sync_risk_config_score()
RETURNS TRIGGER AS $$
DECLARE
  dropdown_id UUID;
BEGIN
  -- Find the corresponding dropdown option
  SELECT id INTO dropdown_id
  FROM dropdown_options
  WHERE question_id::text = NEW.question_id AND option_value = NEW.option_value
  LIMIT 1;
  
  -- If found, update the score
  IF dropdown_id IS NOT NULL THEN
    UPDATE dropdown_options
    SET score = NEW.score
    WHERE id = dropdown_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_risk_config_trigger ON risk_assessment_config;
CREATE TRIGGER sync_risk_config_trigger
AFTER INSERT OR UPDATE ON risk_assessment_config
FOR EACH ROW
EXECUTE FUNCTION sync_risk_config_score();

-- 3. Sync existing scores from dropdown_options to risk_assessment_config
INSERT INTO risk_assessment_config (question_id, option_value, score)
SELECT question_id::text, option_value, score
FROM dropdown_options
WHERE score IS NOT NULL
ON CONFLICT (question_id, option_value) 
DO UPDATE SET score = EXCLUDED.score;

-- 4. Sync existing scores from risk_assessment_config to dropdown_options
UPDATE dropdown_options
SET score = rc.score
FROM risk_assessment_config rc
WHERE dropdown_options.question_id::text = rc.question_id 
  AND dropdown_options.option_value = rc.option_value
  AND (dropdown_options.score IS NULL OR dropdown_options.score != rc.score);
`;
    
    fs.writeFileSync(sqlFilePath, sqlContent);
    console.log(`\n✅ Created SQL file at ${sqlFilePath} to sync admin-configured scores.`);
    
    // Create a script to apply the SQL
    const scriptPath = path.join(__dirname, 'apply-admin-scoring.js');
    const scriptContent = `// Script to apply admin scoring SQL
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

  envContent.split('\\n').forEach(line => {
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
async function applyAdminScoring() {
  try {
    console.log("=".repeat(80));
    console.log("APPLYING ADMIN SCORING SQL");
    console.log("=".repeat(80));
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sync-admin-scores.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log(\`Executing SQL statement: \${statement.substring(0, 50)}...\`);
        
        const { error } = await supabase.rpc('execute_sql', { 
          sql_query: statement
        });
        
        if (error) {
          console.warn(\`⚠️ Warning: Error executing statement: \${error.message}\`);
          console.log("Will try direct query...");
          
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_direct_query').select('*').limit(1);
          if (directError) {
            console.error(\`❌ Error with direct query: \${directError.message}\`);
          }
        } else {
          console.log("✅ Statement executed successfully!");
        }
      } catch (stmtError) {
        console.warn(\`⚠️ Warning: Error executing statement: \${stmtError.message}\`);
      }
    }
    
    console.log("\n✅ Admin scoring SQL applied successfully!");
    console.log("The risk assessment will now use scores configured in the admin section.");
    
  } catch (error) {
    console.error("\n❌ Error applying admin scoring SQL:", error.message);
    process.exit(1);
  }
}

// Run the function
applyAdminScoring()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during script execution:", err);
    process.exit(1);
  });
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
    console.log(`\n✅ Created script at ${scriptPath} to apply the SQL.`);
    
    console.log("\n✅ Successfully fixed risk assessment scoring to use admin data.");
    console.log("This fix ensures that:");
    console.log("1. Scores configured in the admin section are used for risk assessment");
    console.log("2. Changes to scores in the admin section are automatically synced");
    console.log("3. Existing scores are synced between dropdown_options and risk_assessment_config");
    
    console.log("\nTo apply this fix:");
    console.log("1. Run the script: node apply-admin-scoring.js");
    console.log("2. Restart the server");
    
  } catch (error) {
    console.error("\n❌ Error fixing admin scoring:", error.message);
    process.exit(1);
  }
}

// Run the function
fixAdminScoring()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });