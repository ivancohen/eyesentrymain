// VERIFY ADMIN RECOMMENDATIONS FLOW
// This script verifies that recommendations entered in the admin panel
// are flowing correctly to the doctor questionnaire pages
// 
// Run with: node verify-admin-recommendations.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("VERIFY ADMIN RECOMMENDATIONS FLOW");
console.log("================================================================================");
console.log("\nThis script checks if recommendations entered in the admin panel are");
console.log("flowing correctly to the doctor questionnaire pages.");

// Let's check if the database is being accessed properly
console.log("\n1. Checking how database recommendations are accessed...");

let riskAssessmentServiceContent;
try {
  const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
  riskAssessmentServiceContent = fs.readFileSync(riskAssessmentServicePath, 'utf8');
  
  // Check if fallback advice is defined with hardcoded values
  if (riskAssessmentServiceContent.includes('FALLBACK_ADVICE')) {
    console.log("✅ Found FALLBACK_ADVICE in RiskAssessmentService");
    
    // Check if the fallback is only used when database access fails
    if (riskAssessmentServiceContent.includes('if (error)') && 
        riskAssessmentServiceContent.includes('return [...FALLBACK_ADVICE]')) {
      console.log("⚠️ FALLBACK_ADVICE is only used when database access fails");
    } else {
      console.log("❌ FALLBACK_ADVICE may be used incorrectly - check usage patterns");
    }
  }
  
  // Check if it's trying to fetch from database
  if (riskAssessmentServiceContent.includes('.from(\'risk_assessment_advice\')') ||
      riskAssessmentServiceContent.includes('.rpc(\'get_risk_assessment_advice\')')) {
    console.log("✅ RiskAssessmentService attempts to fetch from database");
  } else {
    console.log("❌ RiskAssessmentService doesn't seem to fetch from database");
  }
  
  // Check if getDirectFixAdvice is bypassing the database
  if (riskAssessmentServiceContent.includes('getDirectFixAdvice') &&
      !riskAssessmentServiceContent.includes('supabase') &&
      riskAssessmentServiceContent.includes('return forcedAdvice')) {
    console.log("❌ getDirectFixAdvice is bypassing the database and returning hardcoded values");
    console.log("   This could be why admin-entered values aren't showing up");
  }
  
} catch (error) {
  console.error("❌ Error reading RiskAssessmentService.ts:", error);
}

// Check how recommendations are stored in the database
console.log("\n2. Generating SQL to verify database recommendations...");

try {
  const sqlFilePath = path.join(__dirname, 'verify-recommendations-db.sql');
  const sqlContent = `-- SQL to verify recommendations in the database
-- Execute in Supabase SQL Editor or database client

-- Check risk_assessment_advice table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'risk_assessment_advice';

-- Check if risk_assessment_advice table has any data
SELECT 
  id,
  risk_level,
  min_score,
  max_score,
  LEFT(advice, 50) || '...' AS advice_preview,
  created_at,
  updated_at
FROM 
  risk_assessment_advice
ORDER BY
  min_score ASC;

-- Check if there's an RPC function for accessing advice
SELECT 
  routine_name, 
  routine_type 
FROM 
  information_schema.routines 
WHERE 
  routine_name LIKE '%risk%advice%' OR
  routine_name LIKE '%get%risk%' OR
  routine_name LIKE '%assessment%advice%';

-- Check permissions on risk_assessment_advice table
SELECT 
  grantee, 
  privilege_type
FROM 
  information_schema.role_table_grants
WHERE 
  table_name = 'risk_assessment_advice';

-- Verify row-level security policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM
  pg_policies
WHERE
  tablename = 'risk_assessment_advice';
`;
  
  fs.writeFileSync(sqlFilePath, sqlContent);
  console.log(`✅ Generated SQL file at ${sqlFilePath}`);
  console.log("   Execute this SQL in your Supabase SQL Editor to verify database state");
  
} catch (error) {
  console.error("❌ Error generating SQL file:", error);
}

// Fix RiskAssessmentService.ts to remove hardcoded values
console.log("\n3. Fixing the code to prioritize admin-entered recommendations...");

let updateScript = `// Update script to prioritize admin-entered recommendations
// This will modify RiskAssessmentService.ts

// First, create a backup
`;

try {
  const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
  
  // Only continue if we found the content before
  if (riskAssessmentServiceContent) {
    // 1. Replace getDirectFixAdvice to fetch from database properly
    let modifiedContent = riskAssessmentServiceContent;
    
    if (riskAssessmentServiceContent.includes('getDirectFixAdvice')) {
      const oldGetDirectFixAdvice = /getDirectFixAdvice\([^{]*{[\s\S]*?return forcedAdvice;[\s\S]*?}/;
      const newGetDirectFixAdvice = `async getDirectFixAdvice(riskLevel = ""): Promise<RiskAssessmentAdvice[]> {
    console.log("ADMIN RECOMMENDATIONS FIX: fetching recommendations from database for risk level:", riskLevel);
    
    try {
      // Always fetch from database
      // Use standard database access pattern - directly access the table or use RPC function
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .order('min_score', { ascending: true });
      
      console.log("DATABASE RECOMMENDATIONS:", {
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
        console.warn("Failed to fetch recommendations from database, using fallback");
        return [...FALLBACK_ADVICE];
      }
      
      // For the specific risk level requested, log the matching recommendation
      if (riskLevel) {
        const exactMatch = data.find(a => 
          a.risk_level && a.risk_level.toLowerCase() === riskLevel.toLowerCase()
        );
        
        if (exactMatch) {
          console.log("MATCHING RECOMMENDATION FOUND FOR", riskLevel, ":", 
            exactMatch.advice?.substring(0, 50) + "...");
        } else {
          console.log("NO EXACT MATCH FOUND FOR", riskLevel);
        }
      }
      
      // Return the database values - NOT hardcoded values
      return data;
    } catch (error) {
      console.error("Error in getDirectFixAdvice:", error);
      return [...FALLBACK_ADVICE]; // Use fallback only on error
    }
  }`;
      
      modifiedContent = modifiedContent.replace(oldGetDirectFixAdvice, newGetDirectFixAdvice);
    }
    
    // 2. Create the update script
    updateScript += `
// Back up the current file
const fs = require('fs');
const path = require('path');

const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const backupPath = \`\${riskAssessmentServicePath}.backup-\${Date.now()}\`;

// Create backup
fs.copyFileSync(riskAssessmentServicePath, backupPath);
console.log(\`Created backup at \${backupPath}\`);

// Write updated content
const updatedContent = \`${modifiedContent.replace(/`/g, '\\`')}\`;
fs.writeFileSync(riskAssessmentServicePath, updatedContent);
console.log(\`Updated \${riskAssessmentServicePath} to prioritize admin-entered recommendations\`);

console.log("\\nFix completed. Now recommendations entered in admin panel should appear in doctor pages.");
`;
    
    // Write the update script to a file
    const updateScriptPath = path.join(__dirname, 'update-risk-service.js');
    fs.writeFileSync(updateScriptPath, updateScript);
    console.log(`✅ Generated update script at ${updateScriptPath}`);
    console.log("   Run this with: node update-risk-service.js");
    
  } else {
    console.log("❌ Could not generate update script - RiskAssessmentService content not available");
  }
  
} catch (error) {
  console.error("❌ Error generating update script:", error);
}

console.log("\n================================================================================");
console.log("NEXT STEPS");
console.log("================================================================================");
console.log("\n1. Run the SQL queries in verify-recommendations-db.sql to check your database");
console.log("2. Make sure recommendations are entered in the admin panel");
console.log("3. Run the update script: node update-risk-service.js");
console.log("4. Rebuild and test the application");
console.log("\nThis ensures the system uses admin-entered recommendations from the database,");
console.log("not hardcoded values.");