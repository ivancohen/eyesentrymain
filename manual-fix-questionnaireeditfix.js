// Script to manually fix QuestionnaireEditFix.tsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function fixQuestionnaireEditFix() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING QUESTIONNAIREEDITFIX.TSX");
    console.log("=".repeat(80));
    
    // Path to QuestionnaireEditFix.tsx
    const filePath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireEditFix.tsx');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log("❌ File not found:", filePath);
      console.log("Checking for similar files...");
      
      // Check for similar files
      const questionnairesDir = path.join(__dirname, 'src', 'components', 'questionnaires');
      if (fs.existsSync(questionnairesDir)) {
        const files = fs.readdirSync(questionnairesDir);
        const similarFiles = files.filter(file => file.includes('Edit') && file.endsWith('.tsx'));
        
        if (similarFiles.length > 0) {
          console.log("Found similar files:");
          similarFiles.forEach(file => {
            console.log(`- ${file}`);
            
            // Fix each similar file
            const similarFilePath = path.join(questionnairesDir, file);
            fixFile(similarFilePath);
          });
        } else {
          console.log("No similar files found.");
        }
      }
      
      return;
    }
    
    // Fix the file
    fixFile(filePath);
    
    console.log("\n=".repeat(80));
    console.log("FIX COMPLETED");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error fixing QuestionnaireEditFix.tsx:", error.message);
    process.exit(1);
  }
}

// Function to fix a file
function fixFile(filePath) {
  console.log(`\n📝 Fixing file: ${path.basename(filePath)}`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix 1: Remove updateQuestionnaire from import
  if (content.includes('updateQuestionnaire')) {
    console.log("Removing updateQuestionnaire from imports...");
    
    const originalContent = content;
    
    // Fix import statements
    content = content.replace(/import\s*{([^}]*)updateQuestionnaire([^}]*)}/, (match, before, after) => {
      return `import {${before}${after}}`;
    });
    
    // Clean up any double commas or trailing commas in imports
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/,\s*}/g, '}');
    
    // Fix any calls to updateQuestionnaire
    content = content.replace(/const.*=.*await updateQuestionnaire.*\n/g, '// Update functionality removed\n');
    content = content.replace(/updateQuestionnaire\(.*\)/g, '/* updateQuestionnaire removed */');
    
    if (content !== originalContent) {
      modified = true;
      console.log("✅ Removed updateQuestionnaire references");
    } else {
      console.log("⚠️ No updateQuestionnaire references found to remove");
    }
  }
  
  // Fix 2: Check for handleSubmit function that might use updateQuestionnaire
  if (content.includes('handleSubmit') && content.includes('updateQuestionnaire')) {
    console.log("Fixing handleSubmit function...");
    
    // Replace the entire handleSubmit function with a simplified version
    content = content.replace(/const\s+handleSubmit\s*=\s*async\s*\([^)]*\)\s*=>\s*{[\s\S]*?updateQuestionnaire[\s\S]*?};/m, 
      `const handleSubmit = async (event) => {
    event.preventDefault();
    toast.error("Editing questionnaires is no longer supported");
    navigate("/questionnaires");
  };`);
    
    modified = true;
    console.log("✅ Fixed handleSubmit function");
  }
  
  // Save changes if modified
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Successfully fixed ${path.basename(filePath)}`);
  } else {
    console.log(`⚠️ No changes needed for ${path.basename(filePath)}`);
  }
}

// Run the function
fixQuestionnaireEditFix()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });