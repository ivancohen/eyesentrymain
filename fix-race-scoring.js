// Fix for race/ethnicity scoring in RiskAssessmentService.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const servicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const backupPath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts.race-fix-backup');

// Main function
async function fixRaceScoring() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING RACE/ETHNICITY SCORING");
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
    
    // Find the special handling for race
    const raceHandlingStart = content.indexOf("if (questionId === 'race'", processAnswersStart);
    
    // If race handling exists, update it; otherwise, add it
    let updatedContent;
    if (raceHandlingStart !== -1) {
      // Find the end of the race handling block
      const raceHandlingEnd = content.indexOf('} else if', raceHandlingStart);
      if (raceHandlingEnd === -1) {
        console.error("❌ Could not find end of race handling block");
        process.exit(1);
      }
      
      // Replace the race handling block
      const improvedRaceHandling = `if (questionId === 'race') {
            // Special handling for race/ethnicity
            let score = 0;
            if (answerValue === 'black') {
              score = 2;
            } else if (answerValue === 'hispanic') {
              score = 1;
            } else if (answerValue === 'asian') {
              score = 1;
            }
            
            if (score > 0) {
              console.log(\`Using score \${score} for race=\${answerValue}\`);
              totalScore += score;
              contributingFactors.push({
                question: 'Race/Ethnicity',
                answer: answerValue,
                score: score
              });
            } else {
              console.log(\`No score added for race=\${answerValue}\`);
            }
          }`;
      
      updatedContent = content.substring(0, raceHandlingStart) + improvedRaceHandling + content.substring(raceHandlingEnd);
    } else {
      // Find where to add the race handling
      const elseBlock = content.indexOf('} else {', processAnswersStart);
      if (elseBlock === -1) {
        console.error("❌ Could not find where to add race handling");
        process.exit(1);
      }
      
      // Add the race handling before the else block
      const improvedRaceHandling = `          // Special handling for race/ethnicity
          if (questionId === 'race') {
            let score = 0;
            if (answerValue === 'black') {
              score = 2;
            } else if (answerValue === 'hispanic') {
              score = 1;
            } else if (answerValue === 'asian') {
              score = 1;
            }
            
            if (score > 0) {
              console.log(\`Using score \${score} for race=\${answerValue}\`);
              totalScore += score;
              contributingFactors.push({
                question: 'Race/Ethnicity',
                answer: answerValue,
                score: score
              });
            } else {
              console.log(\`No score added for race=\${answerValue}\`);
            }
          } else `;
      
      updatedContent = content.substring(0, elseBlock) + improvedRaceHandling + content.substring(elseBlock + 7);
    }
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent);
    
    console.log("\n✅ Successfully updated race/ethnicity scoring.");
    console.log("The race/ethnicity question will now be properly scored:");
    console.log("- Black: 2 points");
    console.log("- Hispanic: 1 point");
    console.log("- Asian: 1 point");
    
  } catch (error) {
    console.error("\n❌ Error fixing race scoring:", error.message);
    process.exit(1);
  }
}

// Run the function
fixRaceScoring()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });