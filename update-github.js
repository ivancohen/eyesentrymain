// Script to update GitHub with the current build
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import createRestorePoint from './create-restore-point.js';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function updateGitHub() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING GITHUB WITH CURRENT BUILD");
    console.log("=".repeat(80));
    
    // Step 1: Create a restore point
    console.log("\n1️⃣ Creating restore point...");
    const restorePointDir = await createRestorePoint();
    console.log(`✅ Restore point created at: ${restorePointDir}`);
    
    // Step 2: Check if we're in a git repository
    console.log("\n2️⃣ Checking git repository status...");
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      console.log("✅ Current directory is a git repository");
    } catch (error) {
      console.error("❌ Current directory is not a git repository");
      process.exit(1);
    }
    
    // Step 3: Check for uncommitted changes
    console.log("\n3️⃣ Checking for uncommitted changes...");
    const status = execSync('git status --porcelain').toString();
    
    if (status) {
      console.log("Found uncommitted changes:");
      console.log(status);
      
      // Step 4: Add all changes
      console.log("\n4️⃣ Adding all changes to git...");
      execSync('git add .', { stdio: 'inherit' });
      console.log("✅ Added all changes to git");
      
      // Step 5: Commit changes
      console.log("\n5️⃣ Committing changes...");
      const commitMessage = `Update with fixes: Steroid Questions, Risk Assessment Admin, Question Manager Enhancement

- Fixed steroid questions to allow reverting from "yes" to "no"
- Fixed risk assessment admin to pre-populate configuration fields
- Enhanced question manager with category-based cards and reordering
- Created restore point: ${path.basename(restorePointDir)}`;
      
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log("✅ Committed changes to git");
    } else {
      console.log("✅ No uncommitted changes found");
    }
    
    // Step 6: Push to GitHub
    console.log("\n6️⃣ Pushing to GitHub...");
    try {
      execSync('git push', { stdio: 'inherit' });
      console.log("✅ Successfully pushed to GitHub");
    } catch (error) {
      console.error("❌ Failed to push to GitHub:", error.message);
      console.log("You may need to push manually with 'git push'");
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 GITHUB UPDATE COMPLETED!");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error updating GitHub:", error);
    process.exit(1);
  }
}

// Run the function
updateGitHub()
  .then(() => {
    console.log("\nGitHub update completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during GitHub update:", err);
    process.exit(1);
  });