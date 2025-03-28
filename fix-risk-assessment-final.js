// RISK ASSESSMENT RECOMMENDATIONS FINAL FIX
// This script updates the TypeScript files to properly handle recommendations
// entered by administrators in the admin panel
//
// Run with: node fix-risk-assessment-final.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("RISK ASSESSMENT RECOMMENDATIONS FINAL FIX");
console.log("================================================================================");
console.log("\nThis script ensures recommendations entered in the admin panel");
console.log("are properly displayed in doctor questionnaire pages.");

// Define the files we need to modify
const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');
const sqlFilePath = path.join(__dirname, 'supabase', 'get_risk_assessment_recommendations.sql');

// Create backups
console.log("\nCreating backups of original files...");
[riskAssessmentServicePath, questionnairesPath].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  } else {
    console.error(`⚠️ File not found: ${filePath}`);
  }
});

console.log("\nApplying TypeScript fixes...");

// Step 1: Update RiskAssessmentService to properly use RPC function
try {
  console.log("\n1️⃣ Updating RiskAssessmentService.ts...");
  
  let content = fs.readFileSync(riskAssessmentServicePath, 'utf8');
  
  // Update getAdvice method to use the 'get_risk_assessment_recommendations' RPC function
  const getAdviceRegex = /async getAdvice\(\): Promise<RiskAssessmentAdvice\[\]> {[\s\S]*?const { data, error } = await supabase[\s\S]*?\.rpc\(['"](get_risk_assessment_advice|[^'"]+)['"]\);/;
  
  const newRpcCall = `async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // ALWAYS clear the cache to force fresh database fetch
      cachedAdvice = null;
      console.log("CLEARED ADVICE CACHE TO FORCE FRESH DATABASE FETCH");

      console.log("FETCHING FRESH ADVICE USING RPC FUNCTION");
      
      // Use RPC function - matching pattern used by getUserQuestionnaires
      // This follows the same pattern as other successful services
      const { data, error } = await supabase
        .rpc('get_risk_assessment_recommendations');`;
  
  // Replace the method call
  content = content.replace(getAdviceRegex, newRpcCall);
  
  // Update getDirectFixAdvice to also use the RPC function instead of hardcoded values
  const directFixRegex = /getDirectFixAdvice\(riskLevel = ""\)[\s\S]*?{[\s\S]*?return forcedAdvice;[\s\S]*?}/;
  
  const newDirectFixMethod = `async getDirectFixAdvice(riskLevel = ""): Promise<RiskAssessmentAdvice[]> {
    console.log("ADMIN RECOMMENDATIONS FIX: Fetching admin-entered recommendations for risk level:", riskLevel);
    
    try {
      // Use the same RPC function as getAdvice - consistent with other services
      const { data, error } = await supabase
        .rpc('get_risk_assessment_recommendations');
      
      console.log("ADMIN-ENTERED RECOMMENDATIONS:", {
        error: error ? error.message : 'none',
        dataCount: data?.length || 0,
        items: data?.map(a => ({
          id: a.id,
          level: a.risk_level,
          score_range: \`\${a.min_score}-\${a.max_score}\`,
          preview: a.advice?.substring(0, 30) + '...'
        }))
      });
      
      // If we failed to fetch from database, only then use fallback
      if (error || !data || data.length === 0) {
        console.warn("Failed to fetch admin recommendations, using fallback");
        return [...FALLBACK_ADVICE];
      }
      
      // For the specific risk level requested, log the matching recommendation
      if (riskLevel && riskLevel.trim() !== "") {
        const normalizedRiskLevel = riskLevel.toLowerCase();
        const exactMatch = data.find(a => 
          a.risk_level && a.risk_level.toLowerCase() === normalizedRiskLevel
        );
        
        if (exactMatch) {
          console.log("MATCHING ADMIN RECOMMENDATION FOUND FOR", riskLevel, ":", 
            exactMatch.advice?.substring(0, 50) + "...");
        } else {
          console.log("NO EXACT MATCH FOUND FOR", riskLevel);
        }
      }
      
      // Normalize and return the database values
      const normalizedData = data.map(item => ({
        ...item,
        risk_level: this.normalizeRiskLevel(item.risk_level),
        risk_level_normalized: item.risk_level?.toLowerCase() || '',
        advice: item.advice || "No specific advice available."
      }));
      
      return normalizedData;
    } catch (error) {
      console.error("Error in getDirectFixAdvice:", error);
      return [...FALLBACK_ADVICE]; // Use fallback only on error
    }
  }`;
  
  // Replace directFixAdvice method
  content = content.replace(directFixRegex, newDirectFixMethod);
  
  // Save the changes
  fs.writeFileSync(riskAssessmentServicePath, content);
  console.log("✅ Updated RiskAssessmentService.ts successfully");
} catch (error) {
  console.error("❌ Error updating RiskAssessmentService.ts:", error);
}

// Step 2: Update Questionnaires.tsx to use standard pattern
try {
  console.log("\n2️⃣ Updating Questionnaires.tsx...");
  
  let content = fs.readFileSync(questionnairesPath, 'utf8');
  
  // Replace direct fix prefix with standard approach
  const adviceFormatRegex = /const adviceSource[\s\S]*?const advice = "FIXED RECOMMENDATION: "[\s\S]*?;/;
  
  const newAdviceFormat = `const advice = matchedAdvice?.advice || 
        "Recommendations will be provided by your doctor based on this assessment.";
      
      // Debug logs to ensure we can see the advice - consistent with other parts
      console.log("RECOMMENDATION FROM DATABASE:", advice);`;
  
  content = content.replace(adviceFormatRegex, newAdviceFormat);
  
  // Update to use standard getAdvice method
  content = content.replace(
    /const adviceList = await riskAssessmentService\.getDirectFixAdvice\(data\.risk_level\);/,
    `// Get advice using the standard pattern used by other parts of the system
      // This ensures we get admin-entered recommendations from the database
      const adviceList = await riskAssessmentService.getAdvice();`
  );
  
  // Save the changes
  fs.writeFileSync(questionnairesPath, content);
  console.log("✅ Updated Questionnaires.tsx successfully");
} catch (error) {
  console.error("❌ Error updating Questionnaires.tsx:", error);
}

// Step 3: Create SQL file for database changes if it doesn't exist
try {
  console.log("\n3️⃣ Creating SQL file for database changes...");
  
  if (!fs.existsSync(path.dirname(sqlFilePath))) {
    fs.mkdirSync(path.dirname(sqlFilePath), { recursive: true });
  }
  
  const sqlContent = `-- Create RPC function for risk assessment recommendations
-- This follows the same pattern as other successful RPC functions in the system
CREATE OR REPLACE FUNCTION get_risk_assessment_recommendations()
RETURNS SETOF risk_assessment_advice
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return all recommendations from the risk_assessment_advice table
  -- Ordered by min_score to ensure consistent results
  RETURN QUERY
    SELECT *
    FROM risk_assessment_advice
    ORDER BY min_score ASC;
END;
$$;

-- Grant necessary permissions to match other RPC functions
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO anon;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO service_role;

-- Create a view for debugging and verification
CREATE OR REPLACE VIEW vw_risk_assessment_recommendations AS
SELECT 
  id,
  risk_level,
  min_score,
  max_score,
  substr(advice, 1, 50) || '...' AS advice_preview,
  created_at,
  updated_at
FROM 
  risk_assessment_advice
ORDER BY 
  min_score ASC;

-- Comment
COMMENT ON FUNCTION get_risk_assessment_recommendations() IS 
  'Returns risk assessment recommendations using the same pattern as other successful RPC functions';`;
  
  fs.writeFileSync(sqlFilePath, sqlContent);
  console.log(`✅ Created SQL file at ${sqlFilePath}`);
} catch (error) {
  console.error("❌ Error creating SQL file:", error);
}

console.log("\n================================================================================");
console.log("NEXT STEPS");
console.log("================================================================================");
console.log("\n1. Run the SQL in Supabase SQL Editor:");
console.log(`   Copy and execute the SQL from: ${sqlFilePath}`);
console.log("\n2. Build the application:");
console.log("   npm run build");
console.log("\n3. Start the application:");
console.log("   npm run dev");
console.log("\n4. In admin panel, enter recommendations for each risk level (Low, Moderate, High)");
console.log("\n5. View patient questionnaires in doctor view to verify recommendations display correctly");