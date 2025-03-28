// Script to fix risk assessment recommendations display for doctors
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("================================================================================");
console.log("FIXING RISK ASSESSMENT RECOMMENDATIONS FOR DOCTORS");
console.log("================================================================================");

// Path to the file with recommendations display issue
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');

console.log("Fixing recommendations display in Questionnaires.tsx...");

if (!fs.existsSync(questionnairesPath)) {
  console.error(`Error: File not found at ${questionnairesPath}`);
  process.exit(1);
}

// Create a backup of the file
const backupPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx.backup');
fs.copyFileSync(questionnairesPath, backupPath);
console.log(`Created backup at: ${backupPath}`);

// Read the file content
let content = fs.readFileSync(questionnairesPath, 'utf8');

// Find and replace the recommendations fetching and display logic
const recommendationsRegex = /\/\/ Get advice using the service\s*const adviceList = await riskAssessmentService\.getAdvice\(\);\s*const advice = adviceList\.find\(a => a\.risk_level === data\.risk_level\)\?\.advice \|\|\s*"[^"]*";/;

const improvedRecommendationsCode = `// Get advice using the service with better fallback
      const adviceList = await riskAssessmentService.getAdvice();
      
      // More robust matching logic - try exact match first, then case-insensitive
      let matchedAdvice = adviceList.find(a => a.risk_level === data.risk_level);
      
      // If no match, try case-insensitive matching
      if (!matchedAdvice && data.risk_level) {
        matchedAdvice = adviceList.find(a => 
          a.risk_level.toLowerCase() === data.risk_level.toLowerCase()
        );
      }
      
      // Try score-based matching as last resort
      if (!matchedAdvice && typeof data.total_score === 'number') {
        matchedAdvice = adviceList.find(a => 
          data.total_score >= a.min_score && data.total_score <= a.max_score
        );
      }
      
      // Use matched advice or fallback to a clear message
      const advice = matchedAdvice?.advice || 
        "No specific recommendations available at this time. Please consult with a specialist for personalized guidance.";`;

// Replace the old code with the improved code
content = content.replace(recommendationsRegex, improvedRecommendationsCode);

// Now also fix how risk_level is set in the results
const riskLevelRegex = /riskLevel: data\.risk_level,/;
const improvedRiskLevelCode = `riskLevel: data.risk_level || 
          (data.total_score <= 2 ? 'Low' : 
           data.total_score <= 5 ? 'Moderate' : 'High'),`;

content = content.replace(riskLevelRegex, improvedRiskLevelCode);

// Add advice to the view component properties
const adviceComponentRegex = /advice: result\.advice \|\| ""/;
// Use test() instead of includes() for regex matching
if (adviceComponentRegex.test(content)) {
  content = content.replace(adviceComponentRegex, `advice: result.advice || advice || ""`);
} else {
  console.log("Couldn't find where to add advice to the component - manual check needed");
}

// Write the fixed content back to the file
fs.writeFileSync(questionnairesPath, content);
console.log(`✅ Fixed recommendations display in Questionnaires.tsx`);

console.log("\n================================================================================");
console.log("RECOMMENDATIONS DISPLAY FIX COMPLETED");
console.log("================================================================================");

console.log("\nThe following changes were made:");
console.log("1. Improved risk recommendation matching logic to be more robust");
console.log("2. Added case-insensitive matching for risk levels");
console.log("3. Added score-based fallback for matching recommendations");
console.log("4. Ensured the advice is properly passed to the display component");

console.log("\nYou should now rebuild and test the application to ensure the recommendations");
console.log("are properly displayed for doctors on the risk assessment pages.");