// RESTORE ORIGINAL CODE
// This script restores the codebase to its state before risk recommendation fixes
//
// Run with: node restore-original-code.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("RESTORING CODEBASE TO ORIGINAL STATE");
console.log("================================================================================");

console.log("\nThis script will restore files to their state before risk recommendation fixes.");

// Files that may have been modified
const modifiedFiles = [
  'src/services/RiskAssessmentService.ts',
  'src/pages/Questionnaires.tsx'
];

// Find all backup files for these paths
const foundBackups = [];

for (const file of modifiedFiles) {
  const filePath = path.join(__dirname, file);
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  
  if (fs.existsSync(fileDir)) {
    // List all files in directory
    const filesInDir = fs.readdirSync(fileDir);
    
    // Look for backups of this file (files with the same name plus .backup-)
    const backupFiles = filesInDir.filter(f => f.startsWith(fileName + '.backup-'));
    
    if (backupFiles.length > 0) {
      // Sort by timestamp (latest first)
      backupFiles.sort().reverse();
      
      // Add to found backups
      foundBackups.push({
        originalFile: filePath,
        backupFile: path.join(fileDir, backupFiles[0])
      });
      
      console.log(`Found backup for ${file}: ${backupFiles[0]}`);
    } else {
      console.log(`No backup found for ${file}`);
    }
  }
}

if (foundBackups.length === 0) {
  console.log("\nNo backup files found. Cannot restore original code.");
  process.exit(1);
}

console.log("\nRestoring files from backups...");

// Restore original files from backups
for (const { originalFile, backupFile } of foundBackups) {
  try {
    // Check if original file exists
    if (fs.existsSync(originalFile)) {
      // Create a current backup just in case
      const currentBackup = `${originalFile}.pre-restore-${Date.now()}`;
      fs.copyFileSync(originalFile, currentBackup);
      console.log(`Created safety backup: ${currentBackup}`);
    }
    
    // Copy backup file to original location
    fs.copyFileSync(backupFile, originalFile);
    console.log(`Restored ${originalFile} from ${backupFile}`);
  } catch (error) {
    console.error(`Error restoring ${originalFile}:`, error);
  }
}

// Git status to see what changed
console.log("\nChecking Git status to see what files were modified...");
try {
  const gitStatus = execSync('git status --porcelain', { cwd: __dirname }).toString();
  console.log(gitStatus || "No changes detected by Git");
} catch (error) {
  console.log("Unable to run Git commands, skipping status check");
}

console.log("\n================================================================================");
console.log("RESTORATION COMPLETE");
console.log("================================================================================");
console.log("\nThe codebase has been restored to its state before risk recommendation fixes.");
console.log("You may need to rebuild the application with:");
console.log("\n  npm run build");
console.log("\nAnd restart the development server with:");
console.log("\n  npm run dev");