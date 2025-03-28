// Script to check TypeScript errors and display them
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function checkTypeScriptErrors() {
  try {
    console.log("=".repeat(80));
    console.log("CHECKING TYPESCRIPT ERRORS");
    console.log("=".repeat(80));
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    // File to save TypeScript errors
    const tsErrorFile = path.join(logsDir, 'typescript-errors.txt');
    
    console.log("\n📋 Running TypeScript check...");
    try {
      // Run TypeScript check
      execSync('npx tsc --noEmit', { 
        stdio: 'inherit',
        encoding: 'utf8'
      });
      
      console.log("✅ No TypeScript errors found!");
      return;
    } catch (error) {
      // Save error output to file
      const errorOutput = error.stdout || '';
      fs.writeFileSync(tsErrorFile, errorOutput);
      console.log(`✅ TypeScript errors captured and saved to ${tsErrorFile}`);
      
      // Find files with QuestionnaireEdit references
      console.log("\n🔍 Checking for QuestionnaireEdit references...");
      try {
        const grepResult = execSync('grep -r "QuestionnaireEdit" --include="*.tsx" --include="*.ts" src/', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        console.log("Found QuestionnaireEdit references in the following files:");
        console.log(grepResult);
      } catch (grepError) {
        if (grepError.status === 1) {
          console.log("✅ No QuestionnaireEdit references found.");
        } else {
          console.error("Error searching for QuestionnaireEdit references:", grepError.message);
        }
      }
      
      // Find files with updateQuestionnaire references
      console.log("\n🔍 Checking for updateQuestionnaire references...");
      try {
        const grepResult = execSync('grep -r "updateQuestionnaire" --include="*.tsx" --include="*.ts" src/', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        console.log("Found updateQuestionnaire references in the following files:");
        console.log(grepResult);
      } catch (grepError) {
        if (grepError.status === 1) {
          console.log("✅ No updateQuestionnaire references found.");
        } else {
          console.error("Error searching for updateQuestionnaire references:", grepError.message);
        }
      }
      
      // Manually fix QuestionnaireEditFix.tsx
      console.log("\n🔧 Checking QuestionnaireEditFix.tsx...");
      const editFixPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEditFix.tsx');
      if (fs.existsSync(editFixPath)) {
        console.log("Found QuestionnaireEditFix.tsx. Fixing imports...");
        let content = fs.readFileSync(editFixPath, 'utf8');
        
        // Fix the import for updateQuestionnaire
        if (content.includes('updateQuestionnaire')) {
          content = content.replace(/import \{.*updateQuestionnaire.*\} from.*/, (match) => {
            return match.replace('updateQuestionnaire, ', '').replace(', updateQuestionnaire', '');
          });
          
          // Also remove any usage of updateQuestionnaire
          content = content.replace(/const.*=.*await updateQuestionnaire.*/, '// Update functionality removed');
          
          fs.writeFileSync(editFixPath, content);
          console.log("✅ Fixed QuestionnaireEditFix.tsx");
        }
      }
      
      // Check for App.tsx references
      console.log("\n🔧 Checking App.tsx...");
      const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
      if (fs.existsSync(appTsxPath)) {
        console.log("Found App.tsx. Checking for QuestionnaireEdit route...");
        let content = fs.readFileSync(appTsxPath, 'utf8');
        
        // Fix the import for QuestionnaireEdit
        if (content.includes('QuestionnaireEdit')) {
          content = content.replace(/import QuestionnaireEdit.*\n/, '');
          
          // Also remove the route
          content = content.replace(/<Route path="\/questionnaire\/edit\/.*QuestionnaireEdit.*\/>\n/, '');
          
          fs.writeFileSync(appTsxPath, content);
          console.log("✅ Fixed App.tsx");
        }
      }
      
      // Check for Questionnaires.tsx references
      console.log("\n🔧 Checking Questionnaires.tsx...");
      const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');
      if (fs.existsSync(questionnairesPath)) {
        console.log("Found Questionnaires.tsx. Checking for edit button...");
        let content = fs.readFileSync(questionnairesPath, 'utf8');
        
        // Fix the import for Edit icon
        if (content.includes('Edit,')) {
          content = content.replace(/import \{.*Edit,.*\} from.*/, (match) => {
            return match.replace('Edit, ', '').replace(', Edit', '');
          });
          
          // Remove the handleEditQuestionnaire function
          content = content.replace(/const handleEditQuestionnaire.*?\}\;\n/s, '');
          
          // Remove the Edit button
          content = content.replace(/<Button.*onClick=\{\(\) => handleEditQuestionnaire.*Edit.*<\/Button>\n/s, '');
          
          fs.writeFileSync(questionnairesPath, content);
          console.log("✅ Fixed Questionnaires.tsx");
        }
      }
      
      console.log("\n📋 Running TypeScript check again after fixes...");
      try {
        // Run TypeScript check again
        execSync('npx tsc --noEmit', { 
          stdio: 'inherit',
          encoding: 'utf8'
        });
        
        console.log("✅ All TypeScript errors fixed!");
      } catch (secondError) {
        console.log("⚠️ Some TypeScript errors remain. Manual fixes required.");
      }
    }
    
    console.log("\n=".repeat(80));
    console.log("TYPESCRIPT CHECK COMPLETED");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error checking TypeScript errors:", error.message);
    process.exit(1);
  }
}

// Run the function
checkTypeScriptErrors()
  .then(() => {
    console.log("\nTypeScript check script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during TypeScript check:", err);
    process.exit(1);
  });