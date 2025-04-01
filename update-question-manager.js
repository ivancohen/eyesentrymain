// Script to update the question manager with category-based cards and reordering functionality
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function updateQuestionManager() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING QUESTION MANAGER WITH CATEGORY-BASED CARDS AND REORDERING");
    console.log("=".repeat(80));
    
    // Step 1: Create backups of the original files
    console.log("\n1️⃣ Creating backups of original files...");
    
    const files = [
      {
        original: path.join(__dirname, 'src', 'components', 'admin', 'EnhancedQuestionManager.tsx'),
        enhanced: path.join(__dirname, 'src', 'components', 'admin', 'EnhancedQuestionManager.enhanced.tsx'),
        backup: path.join(__dirname, 'src', 'components', 'admin', `EnhancedQuestionManager.tsx.backup-${Date.now()}`)
      },
      {
        original: path.join(__dirname, 'src', 'services', 'QuestionService.ts'),
        enhanced: path.join(__dirname, 'src', 'services', 'QuestionService.enhanced.ts'),
        backup: path.join(__dirname, 'src', 'services', `QuestionService.ts.backup-${Date.now()}`)
      }
    ];
    
    // Create backups
    for (const file of files) {
      if (fs.existsSync(file.original)) {
        fs.copyFileSync(file.original, file.backup);
        console.log(`✅ Created backup at ${file.backup}`);
      } else {
        console.warn(`⚠️ Original file not found: ${file.original}`);
      }
    }
    
    // Step 2: Replace the original files with the enhanced versions
    console.log("\n2️⃣ Replacing original files with enhanced versions...");
    
    for (const file of files) {
      if (fs.existsSync(file.enhanced)) {
        fs.copyFileSync(file.enhanced, file.original);
        console.log(`✅ Replaced ${file.original} with enhanced version`);
      } else {
        console.error(`❌ Enhanced file not found: ${file.enhanced}`);
        process.exit(1);
      }
    }
    
    // Step 3: Update package.json to add react-beautiful-dnd dependency if not already present
    console.log("\n3️⃣ Checking for react-beautiful-dnd dependency...");
    
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.dependencies['react-beautiful-dnd']) {
        console.log("Adding react-beautiful-dnd dependency to package.json...");
        
        packageJson.dependencies['react-beautiful-dnd'] = '^13.1.1';
        packageJson.dependencies['@types/react-beautiful-dnd'] = '^13.1.4';
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log("✅ Added react-beautiful-dnd dependency to package.json");
        console.log("⚠️ You will need to run 'npm install' or 'yarn' to install the new dependency");
      } else {
        console.log("✅ react-beautiful-dnd dependency already present in package.json");
      }
    } else {
      console.warn("⚠️ package.json not found, skipping dependency check");
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 UPDATE COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nThe question manager has been updated with the following features:");
    console.log("1. Questions are now organized into cards by category");
    console.log("2. Questions can be reordered within each category using drag and drop");
    console.log("3. Questions can be moved up and down within each category using buttons");
    console.log("4. New questions are automatically assigned the next available display order in their category");
    console.log("\nNext steps:");
    console.log("1. If react-beautiful-dnd was added, run 'npm install' or 'yarn' to install the dependency");
    console.log("2. Restart your development server");
    console.log("3. Navigate to the question management page to see the changes");
    
  } catch (error) {
    console.error("\n❌ Error updating question manager:", error);
    process.exit(1);
  }
}

// Run the function
updateQuestionManager()
  .then(() => {
    console.log("\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during update:", err);
    process.exit(1);
  });