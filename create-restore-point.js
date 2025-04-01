// Script to create a restore point before deployment
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function createRestorePoint() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const restorePointDir = path.join(__dirname, 'restore-points', `restore-point-${timestamp}`);
    
    console.log("=".repeat(80));
    console.log(`CREATING RESTORE POINT: ${restorePointDir}`);
    console.log("=".repeat(80));
    
    // Create restore-points directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'restore-points'))) {
      fs.mkdirSync(path.join(__dirname, 'restore-points'));
      console.log("✅ Created restore-points directory");
    }
    
    // Create restore point directory
    fs.mkdirSync(restorePointDir, { recursive: true });
    console.log(`✅ Created restore point directory: ${restorePointDir}`);
    
    // Create src directory structure in restore point
    const srcDir = path.join(restorePointDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    // Copy key files to restore point
    const filesToBackup = [
      // QuestionnaireForm and Container for steroid questions fix
      { src: 'src/components/questionnaires/QuestionnaireForm.tsx', dest: 'src/components/questionnaires/QuestionnaireForm.tsx' },
      { src: 'src/components/questionnaires/QuestionnaireContainer.tsx', dest: 'src/components/questionnaires/QuestionnaireContainer.tsx' },
      
      // RiskAssessmentService and Admin for risk assessment fix
      { src: 'src/services/RiskAssessmentService.ts', dest: 'src/services/RiskAssessmentService.ts' },
      { src: 'src/components/admin/RiskAssessmentAdmin.tsx', dest: 'src/components/admin/RiskAssessmentAdmin.tsx' },
      
      // EnhancedQuestionManager and QuestionService for question manager enhancement
      { src: 'src/components/admin/EnhancedQuestionManager.tsx', dest: 'src/components/admin/EnhancedQuestionManager.tsx' },
      { src: 'src/services/QuestionService.ts', dest: 'src/services/QuestionService.ts' },
      
      // SpecialistQuestionnaireForm for logo update
      { src: 'src/components/specialist/SpecialistQuestionnaireForm.tsx', dest: 'src/components/specialist/SpecialistQuestionnaireForm.tsx' },
      
      // Index.tsx for home page implementation
      { src: 'src/pages/Index.tsx', dest: 'src/pages/Index.tsx' },
      
      // Package.json for dependencies
      { src: 'package.json', dest: 'package.json' }
    ];
    
    for (const file of filesToBackup) {
      const srcPath = path.join(__dirname, file.src);
      const destPath = path.join(restorePointDir, file.dest);
      
      // Create directory structure if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Backed up ${file.src}`);
      } else {
        console.warn(`⚠️ File not found: ${file.src}`);
      }
    }
    
    // Create a README file in the restore point directory
    const readmeContent = `# Restore Point: ${timestamp}

This restore point was created before deploying the following fixes and enhancements:

1. Steroid Questions Fix - Allows reverting from "yes" to "no"
2. Risk Assessment Admin Fix - Fixes pre-population of configuration fields
3. Question Manager Enhancement - Organizes questions by category with reordering
4. Logo Updates - Ensures all logos use the correct path
5. Home Page Implementation - New modern home page design

## Files Included

${filesToBackup.map(file => `- \`${file.dest}\``).join('\n')}

## How to Restore

To restore these files, copy them back to their original locations in the project.
`;
    
    fs.writeFileSync(path.join(restorePointDir, 'README.md'), readmeContent);
    console.log("✅ Created README.md in restore point directory");
    
    console.log("\n=".repeat(80));
    console.log("🎉 RESTORE POINT CREATED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log(`\nRestore point location: ${restorePointDir}`);
    
    return restorePointDir;
  } catch (error) {
    console.error("\n❌ Error creating restore point:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createRestorePoint()
    .then(() => {
      console.log("\nRestore point creation completed.");
      process.exit(0);
    })
    .catch(err => {
      console.error("\nFatal error during restore point creation:", err);
      process.exit(1);
    });
}

// Export the function for use in other scripts
export default createRestorePoint;