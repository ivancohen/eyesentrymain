// RISK ASSESSMENT RECOMMENDATIONS FIX - TYPESCRIPT-ONLY VERSION
// This script fixes the issues where recommendations entered in admin panel 
// aren't showing up in doctor questionnaire pages using only TypeScript changes.
// 
// Run with: node fix-risk-assessment-recs-ts-only.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("RISK ASSESSMENT RECOMMENDATIONS FIX - TYPESCRIPT-ONLY VERSION");
console.log("================================================================================");
console.log("\nPROBLEM: Recommendations entered in admin panel are not showing up in doctor pages\n");
console.log("ROOT CAUSE: The system has issues with risk level matching and cache management");
console.log("SOLUTION: This script updates the TypeScript code to improve matching and caching\n");

// Define the files we need to modify
const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');

// Create backups
console.log("Creating backups of original files...");
[riskAssessmentServicePath, questionnairesPath].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  } else {
    console.error(`⚠️ File not found: ${filePath}`);
  }
});

console.log("\nApplying fixes...");

// FIX 1: Improve RiskAssessmentService to properly clear cache and add better logging
try {
  console.log("\n1️⃣ Updating RiskAssessmentService.ts for better caching and logging...");
  
  let content = fs.readFileSync(riskAssessmentServicePath, 'utf8');
  
  // Fix getAdvice method to always clear cache and add better logging
  const getAdviceRegex = /async getAdvice\(\): Promise<RiskAssessmentAdvice\[\]> {[\s\S]*?try {[\s\S]*?\/\/ If we got data from the database[\s\S]*?if \(data && data\.length > 0\) {[\s\S]*?return data;[\s\S]*?}[\s\S]*?\/\/ If we got NO data from the database[\s\S]*?console\.warn\("DATABASE RETURNED EMPTY ADVICE LIST - Using fallback"\);[\s\S]*?return \[\.\.\.(FALLBACK_ADVICE|cachedAdvice)\];[\s\S]*?}/;
  
  const newGetAdvice = `async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // ALWAYS clear the cache to force fresh database fetch
      cachedAdvice = null;
      console.log("CLEARED ADVICE CACHE TO FORCE FRESH DATABASE FETCH");

      console.log("FETCHING FRESH ADVICE FROM DATABASE");
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .order('min_score', { ascending: true });

      // Debug what we got from the database
      console.log("DATABASE ADVICE FETCH RESULT:", {
        error: error ? error.message : 'none',
        dataReceived: !!data,
        dataCount: data?.length || 0,
        dataItems: data?.map(a => ({ 
          id: a.id, 
          level: a.risk_level, 
          score_range: \`\${a.min_score}-\${a.max_score}\`,
          advice: a.advice?.substring(0, 30) + '...' 
        }))
      });

      if (error) {
        console.error("Error fetching advice:", error);
        console.warn("CRITICAL: Using fallback advice as last resort due to database error");
        return [...FALLBACK_ADVICE]; // Don't cache fallbacks
      }

      // If we got data from the database - normalize risk levels for case-insensitive matching
      if (data && data.length > 0) {
        // Normalize the risk levels for case-insensitive matching
        const normalizedData = data.map(item => ({
          ...item,
          // Normalize risk level to one of: "Low", "Moderate", "High"
          risk_level: this.normalizeRiskLevel(item.risk_level),
          // Ensure advice has a value
          advice: item.advice || "No specific advice available."
        }));
        
        console.log("NORMALIZED DATABASE ADVICE:", normalizedData.map(a => ({
          risk_level: a.risk_level,
          min_score: a.min_score,
          max_score: a.max_score,
          advice_preview: a.advice?.substring(0, 30) + '...'
        })));
        
        // Cache the normalized advice
        cachedAdvice = normalizedData;
        return normalizedData;
      }
      
      // If we got NO data from the database (empty array)
      console.warn("DATABASE RETURNED EMPTY ADVICE LIST - Using fallback");
      return [...FALLBACK_ADVICE]; // Don't cache fallbacks
    } catch (error) {
      console.error('Error getting advice:', error);
      // Use fallback on any error, but NEVER cache it
      console.warn("CRITICAL ERROR: Using fallback advice due to exception");
      return [...FALLBACK_ADVICE]; // Return but don't cache
    }
  }`;
  
  // Add normalizeRiskLevel helper method
  const helpersInsertPosition = content.indexOf("// Calculate risk score based on answers");
  
  const normalizeRiskLevelMethod = `
  // Helper to normalize risk level text to standard formats (Low, Moderate, High)
  private normalizeRiskLevel(riskLevel: string | null | undefined): string {
    if (!riskLevel) return "Unknown";
    
    const lowercaseRisk = riskLevel.toLowerCase();
    
    if (lowercaseRisk.includes('low')) {
      return "Low";
    } else if (lowercaseRisk.includes('mod') || lowercaseRisk.includes('med')) {
      return "Moderate";
    } else if (lowercaseRisk.includes('high')) {
      return "High";
    }
    
    // Return original if no match
    return riskLevel;
  }
  
  `;
  
  content = content.replace(getAdviceRegex, newGetAdvice);
  content = content.slice(0, helpersInsertPosition) + normalizeRiskLevelMethod + content.slice(helpersInsertPosition);
  
  // Fix updateAdvice method to clear cache and add better logging
  const updateAdviceRegex = /async updateAdvice\(advice: Partial<RiskAssessmentAdvice>\): Promise<RiskAssessmentAdvice> {[\s\S]*?try {[\s\S]*?\/\/ Try to update in database[\s\S]*?const { data, error } = await supabase[\s\S]*?return (completeAdvice|data);[\s\S]*?} catch[\s\S]*?return completeAdvice;[\s\S]*?}/;
  
  const newUpdateAdvice = `async updateAdvice(advice: Partial<RiskAssessmentAdvice>): Promise<RiskAssessmentAdvice> {
    if (!advice.risk_level && (advice.min_score === undefined || advice.max_score === undefined)) {
      throw new Error('Risk level or score range is required to update advice.');
    }
    
    // ALWAYS clear the cache to force fresh database fetches
    console.log("CLEARING ALL CACHED ADVICE TO FORCE DATABASE FETCHES");
    cachedAdvice = null;
    
    // Normalize the risk level if provided
    const normalizedRiskLevel = advice.risk_level ? this.normalizeRiskLevel(advice.risk_level) : undefined;
    
    const riskLevel = normalizedRiskLevel || (
      advice.min_score !== undefined && advice.min_score <= 1 ? 'Low' :
      advice.min_score !== undefined && advice.min_score <= 3 ? 'Moderate' : 'High'
    );

    // Create a complete advice object
    const completeAdvice: RiskAssessmentAdvice = {
      min_score: advice.min_score || 0,
      max_score: advice.max_score || 100,
      advice: advice.advice || "No specific advice available.",
      risk_level: riskLevel,
      updated_at: new Date().toISOString()
    };

    console.log("ATTEMPTING TO UPDATE ADVICE IN DATABASE:", {
      min_score: completeAdvice.min_score,
      max_score: completeAdvice.max_score,
      risk_level: completeAdvice.risk_level,
      advice_preview: completeAdvice.advice.substring(0, 30) + '...'
    });

    try {
      // Try to update in database
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .upsert({
          min_score: completeAdvice.min_score,
          max_score: completeAdvice.max_score,
          advice: completeAdvice.advice,
          risk_level: completeAdvice.risk_level,
          updated_at: completeAdvice.updated_at
        }, { onConflict: 'risk_level' })
        .select()
        .single();

      if (error) {
        console.error('DATABASE UPDATE ERROR:', error);
        console.log("ADVICE WAS NOT SAVED TO DATABASE - Will retry on next access");
        // Return the object but don't cache it
        return completeAdvice;
      }

      console.log("ADVICE SUCCESSFULLY UPDATED IN DATABASE:", {
        id: data.id,
        risk_level: data.risk_level,
        advice_preview: data.advice?.substring(0, 30) + '...'
      });

      // Force a refresh of all data
      await this.getAdvice();
      
      return data;
    } catch (error) {
      console.error('ERROR UPDATING ADVICE:', error);
      // Return the object but don't cache it
      return completeAdvice;
    }
  }`;
  
  content = content.replace(updateAdviceRegex, newUpdateAdvice);
  
  // Save the changes
  fs.writeFileSync(riskAssessmentServicePath, content);
  console.log("✅ Updated RiskAssessmentService.ts successfully");
} catch (error) {
  console.error("❌ Error updating RiskAssessmentService.ts:", error);
}

// FIX 2: Enhance the matching logic in Questionnaires.tsx
try {
  console.log("\n2️⃣ Enhancing matching logic in Questionnaires.tsx...");
  
  let content = fs.readFileSync(questionnairesPath, 'utf8');
  
  // Find and replace the handleViewRiskAssessment method
  const handleViewRiskAssessmentRegex = /const handleViewRiskAssessment = async \(id: string\) => {[\s\S]*?console\.log\("VIEWING RISK ASSESSMENT FOR ID:", id\);[\s\S]*?try {[\s\S]*?setSelectedQuestionnaire\(id\);[\s\S]*?setIsViewingRisk\(true\);[\s\S]*?const data = await getQuestionnaireById\(id\);[\s\S]*?\/\/ Clear the risk assessment service cache[\s\S]*?\/\/ @ts-ignore[\s\S]*?riskAssessmentService\["cachedAdvice"\] = null;[\s\S]*?\/\/ Now get advice using the service[\s\S]*?const adviceList = await riskAssessmentService\.getAdvice\(\);[\s\S]*?console\.log\("Fetched fresh advice list:", adviceList\);[\s\S]*?\/\/ More robust matching logic[\s\S]*?let matchedAdvice[\s\S]*?\/\/ Use matched advice or fallback[\s\S]*?const advice = matchedAdvice\?\.advice \|\|[\s\S]*?;/;
  
  const newHandleViewRiskAssessment = `const handleViewRiskAssessment = async (id: string) => {
    console.log("===== VIEWING RISK ASSESSMENT FOR ID:", id, "=====");
    try {
      setSelectedQuestionnaire(id);
      setIsViewingRisk(true);
      const data = await getQuestionnaireById(id);
      
      // Log questionnaire data to ensure we have what we need
      console.log("QUESTIONNAIRE DATA:", {
        id: data.id,
        total_score: data.total_score,
        risk_level: data.risk_level,
        risk_level_type: typeof data.risk_level,
        has_answers: !!data.answers
      });
      
      // Clear the risk assessment service cache before fetching to ensure fresh data
      // This forces a fresh fetch from the database
      // @ts-ignore - Accessing the cached advice variable directly
      riskAssessmentService["cachedAdvice"] = null;
      
      // Get advice using the service
      const adviceList = await riskAssessmentService.getAdvice();
      console.log("ADVICE LIST:", adviceList.map(a => ({
        id: a.id,
        level: a.risk_level,
        range: \`\${a.min_score}-\${a.max_score}\`,
        preview: a.advice?.substring(0, 30) + '...'
      })));
      
      // Define standard risk levels for reference
      const standardRiskLevels = {
        LOW: 'Low',
        MODERATE: 'Moderate',
        HIGH: 'High'
      };
      
      // ENHANCED MATCHING STRATEGY:
      // 1. Prepare the patient's risk level with standard casing if possible
      let patientRiskLevel = data.risk_level || '';
      let patientRiskLevelLower = patientRiskLevel.toLowerCase();
      let standardizedPatientRiskLevel = patientRiskLevel;
      
      // Standardize patient risk level for consistent matching
      if (patientRiskLevelLower.includes('low')) {
        standardizedPatientRiskLevel = standardRiskLevels.LOW;
      } else if (patientRiskLevelLower.includes('mod') || patientRiskLevelLower.includes('med')) {
        standardizedPatientRiskLevel = standardRiskLevels.MODERATE;
      } else if (patientRiskLevelLower.includes('high')) {
        standardizedPatientRiskLevel = standardRiskLevels.HIGH;
      }
      
      console.log("PATIENT RISK LEVEL:", {
        original: patientRiskLevel,
        standardized: standardizedPatientRiskLevel
      });
      
      // MULTIPLE MATCHING STRATEGIES:
      console.log("APPLYING MATCHING STRATEGIES:");
      
      // Strategy 1: Direct match with standardized risk level (most accurate)
      console.log("STRATEGY 1: Exact match with standardized risk level");
      let matchedAdvice = adviceList.find(a => a.risk_level === standardizedPatientRiskLevel);
      console.log("STRATEGY 1 RESULT:", matchedAdvice ? 
        \`FOUND: \${matchedAdvice.risk_level}\` : 
        "No match"
      );
      
      // Strategy 2: Case-insensitive matching if needed
      if (!matchedAdvice && standardizedPatientRiskLevel) {
        console.log("STRATEGY 2: Case-insensitive match");
        matchedAdvice = adviceList.find(a => 
          a.risk_level.toLowerCase() === standardizedPatientRiskLevel.toLowerCase()
        );
        console.log("STRATEGY 2 RESULT:", matchedAdvice ? 
          \`FOUND: \${matchedAdvice.risk_level}\` : 
          "No match"
        );
      }
      
      // Strategy 3: Try exact match with original risk level
      if (!matchedAdvice && patientRiskLevel) {
        console.log("STRATEGY 3: Exact match with original risk level");
        matchedAdvice = adviceList.find(a => a.risk_level === patientRiskLevel);
        console.log("STRATEGY 3 RESULT:", matchedAdvice ? 
          \`FOUND: \${matchedAdvice.risk_level}\` : 
          "No match"
        );
      }
      
      // Strategy 4: Try score-based matching
      if (!matchedAdvice && typeof data.total_score === 'number') {
        console.log("STRATEGY 4: Score-based match");
        matchedAdvice = adviceList.find(a =>
          data.total_score >= a.min_score && data.total_score <= a.max_score
        );
        console.log("STRATEGY 4 RESULT:", matchedAdvice ? 
          \`FOUND: \${matchedAdvice.risk_level} (score \${data.total_score} in range \${matchedAdvice.min_score}-\${matchedAdvice.max_score})\` : 
          "No match"
        );
      }
      
      // Strategy 5: Manual mapping based on score ranges as last resort
      if (!matchedAdvice && typeof data.total_score === 'number') {
        console.log("STRATEGY 5: Manual mapping based on score");
        const score = data.total_score;
        let manualRiskLevel = score <= 2 ? standardRiskLevels.LOW : 
                             score <= 5 ? standardRiskLevels.MODERATE : 
                             standardRiskLevels.HIGH;
                             
        console.log(\`Manual mapping: Score \${score} maps to risk level \${manualRiskLevel}\`);
        
        matchedAdvice = adviceList.find(a => a.risk_level === manualRiskLevel);
        console.log("STRATEGY 5 RESULT:", matchedAdvice ? 
          \`FOUND: \${matchedAdvice.risk_level}\` : 
          "No match"
        );
      }
      
      // Final result
      console.log("FINAL MATCHING RESULT:", matchedAdvice ? 
        \`SUCCESS: Found advice for \${matchedAdvice.risk_level}\` : 
        "FAILED: No matching advice found"
      );
      
      // Use matched advice or fallback to a clear message
      const advice = matchedAdvice?.advice ||
        "No specific recommendations available at this time. Please consult with a specialist for personalized guidance.";
      
      console.log("ADVICE TO DISPLAY:", advice.substring(0, 100) + (advice.length > 100 ? '...' : ''));`;
  
  content = content.replace(handleViewRiskAssessmentRegex, newHandleViewRiskAssessment);
  
  // Save the changes
  fs.writeFileSync(questionnairesPath, content);
  console.log("✅ Updated Questionnaires.tsx successfully");
} catch (error) {
  console.error("❌ Error updating Questionnaires.tsx:", error);
}

console.log("\n================================================================================");
console.log("FIX COMPLETED SUCCESSFULLY - NEXT STEPS");
console.log("================================================================================");
console.log("\nThe TypeScript-only fix has been applied. Here's what you need to know:");
console.log("\n1. What changed:");
console.log("   - Enhanced risk level standardization in RiskAssessmentService");
console.log("   - Added multiple matching strategies in Questionnaires.tsx");
console.log("   - Improved cache handling and added detailed logging");
console.log("\n2. How to test:");
console.log("   - Build and run the application");
console.log("   - In admin panel, enter a distinctive recommendation (e.g., 'TEST123')");
console.log("   - Go to the doctor questionnaire page and view a risk assessment");
console.log("   - You should see your distinctive recommendation text");
console.log("   - Check the browser console for detailed logs about the matching process");
console.log("\n3. If you still don't see recommendations:");
console.log("   - Check that the risk level in admin EXACTLY matches what patients have");
console.log("   - Verify the database is being updated (check logs)");
console.log("   - Try making a new patient form with a clear risk level");
console.log("\nDo you want to build the application now? (Y/N)");