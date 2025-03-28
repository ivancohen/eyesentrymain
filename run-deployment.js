// Integrated Deployment Script for EyeSentry
// This script follows the Master Deployment Plan and executes the preferred deployment approach

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const projectName = 'eyesentry';
const approaches = {
  DIRECT_BUILD: 'direct-build',
  FIX_ERRORS: 'fix-errors',
  LENIENT_CONFIG: 'lenient-config',
  MANUAL_UPLOAD: 'manual-upload'
};

// Parse command line arguments
const args = process.argv.slice(2);
const selectedApproach = args[0] || approaches.DIRECT_BUILD;
const skipConfirmation = args.includes('--yes') || args.includes('-y');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Main function
async function runDeployment() {
  try {
    console.log("=".repeat(80));
    console.log("EYESENTRY DEPLOYMENT PROCESS");
    console.log("=".repeat(80));
    
    console.log(`\n🚀 Selected approach: ${selectedApproach}`);
    
    // Confirm with user
    if (!skipConfirmation) {
      const confirm = await question(`\nProceed with ${selectedApproach} approach? (y/n): `);
      if (confirm.toLowerCase() !== 'y') {
        console.log("Deployment cancelled.");
        rl.close();
        return;
      }
    }
    
    // Phase 1: Preparation
    console.log("\n=== PHASE 1: PREPARATION ===");
    
    // Backup important configuration files
    console.log("\n📦 Backing up configuration files...");
    try {
      backupFile('tsconfig.json');
      backupFile('vite.config.ts');
      console.log("✅ Configuration files backed up successfully.");
    } catch (error) {
      console.warn("⚠️ Warning: Could not backup all configuration files:", error.message);
      console.log("Continuing with deployment...");
    }
    
    // Phase 2: Build Process
    console.log("\n=== PHASE 2: BUILD PROCESS ===");
    
    let buildSuccess = false;
    
    switch (selectedApproach) {
      case approaches.DIRECT_BUILD:
        console.log("\n🔨 Using Direct Build approach (recommended)...");
        try {
          console.log("Running direct-build script...");
          execSync('node direct-build.js', { stdio: 'inherit' });
          buildSuccess = true;
        } catch (error) {
          console.error("❌ Direct build failed:", error.message);
          if (!skipConfirmation) {
            const tryFallback = await question("Try fallback approach (fix-errors)? (y/n): ");
            if (tryFallback.toLowerCase() === 'y') {
              return runApproach(approaches.FIX_ERRORS);
            }
          }
        }
        break;
        
      case approaches.FIX_ERRORS:
        console.log("\n🔨 Using Fix Individual Errors approach...");
        try {
          // Run TypeScript error checker
          console.log("Running TypeScript error check...");
          try {
            execSync('node check-typescript-errors.js', { stdio: 'inherit' });
          } catch (error) {
            console.log("TypeScript errors found, attempting to fix...");
          }
          
          // Fix verify-questions.js
          console.log("Fixing verify-questions.js...");
          execSync('node fix-verify-questions.js', { stdio: 'inherit' });
          
          // Fix QuestionnaireEditFix
          console.log("Fixing QuestionnaireEdit references...");
          execSync('node manual-fix-questionnaireeditfix.js', { stdio: 'inherit' });
          
          // Fix general build issues
          console.log("Fixing build issues...");
          execSync('node fix-build-issues.js', { stdio: 'inherit' });
          
          // Attempt build
          console.log("Attempting build after fixes...");
          execSync('npm run build', { stdio: 'inherit' });
          buildSuccess = true;
        } catch (error) {
          console.error("❌ Error fixing approach failed:", error.message);
          if (!skipConfirmation) {
            const tryFallback = await question("Try fallback approach (lenient-config)? (y/n): ");
            if (tryFallback.toLowerCase() === 'y') {
              return runApproach(approaches.LENIENT_CONFIG);
            }
          }
        }
        break;
        
      case approaches.LENIENT_CONFIG:
        console.log("\n🔨 Using Lenient TypeScript Configuration approach...");
        try {
          console.log("Generating lenient TypeScript configuration...");
          execSync('node generate-lenient-tsconfig.js', { stdio: 'inherit' });
          
          console.log("Attempting build with lenient configuration...");
          execSync('npm run build', { stdio: 'inherit' });
          buildSuccess = true;
        } catch (error) {
          console.error("❌ Lenient configuration approach failed:", error.message);
          if (!skipConfirmation) {
            const tryFallback = await question("Try last resort approach (manual-upload)? (y/n): ");
            if (tryFallback.toLowerCase() === 'y') {
              return runApproach(approaches.MANUAL_UPLOAD);
            }
          }
        }
        break;
        
      case approaches.MANUAL_UPLOAD:
        console.log("\n🔨 Using Manual Upload approach (last resort)...");
        console.log("\n⚠️ This approach requires manual steps. Follow the instructions below:");
        console.log("\n1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/");
        console.log("2. Navigate to Pages in the left sidebar");
        console.log("3. Select the project or create a new one named '" + projectName + "'");
        console.log("4. Click 'Upload' or 'Deploy site'");
        console.log("5. Prepare a minimal set of files from the project for upload");
        
        if (!skipConfirmation) {
          const proceed = await question("\nDo you want to proceed with manual upload instructions? (y/n): ");
          if (proceed.toLowerCase() !== 'y') {
            console.log("Manual upload cancelled.");
            rl.close();
            return;
          }
        }
        
        // No build needed for manual upload
        buildSuccess = true;
        break;
        
      default:
        console.error(`❌ Unknown approach: ${selectedApproach}`);
        console.log("Available approaches: direct-build, fix-errors, lenient-config, manual-upload");
        process.exit(1);
    }
    
    // Check if build was successful
    if (!buildSuccess) {
      console.error("❌ All build approaches failed.");
      console.log("Please review the errors and try again.");
      process.exit(1);
    }
    
    // Phase 3: Deployment
    console.log("\n=== PHASE 3: DEPLOYMENT ===");
    
    // Check if the dist directory exists
    const distPath = path.join(__dirname, 'dist');
    if (selectedApproach !== approaches.MANUAL_UPLOAD) {
      if (!fs.existsSync(distPath)) {
        console.error(`❌ Error: Build directory not found at ${distPath}`);
        console.log("Build may have failed. Please check the errors above.");
        process.exit(1);
      }
      
      // Count files in the dist directory
      try {
        const distFiles = fs.readdirSync(distPath, { recursive: true });
        if (distFiles.length === 0) {
          console.error("❌ Error: Build directory is empty. Build may have failed.");
          process.exit(1);
        }
        console.log(`✅ Build directory contains ${distFiles.length} files.`);
      } catch (error) {
        console.error("❌ Error checking build directory:", error.message);
        process.exit(1);
      }
    }
    
    if (selectedApproach === approaches.MANUAL_UPLOAD) {
      console.log("\n📋 Manual Deployment Instructions:");
      console.log("=".repeat(80));
      console.log("Follow these steps to manually deploy your application:");
      console.log("1. Log in to your Cloudflare account: https://dash.cloudflare.com/");
      console.log("2. Navigate to 'Pages' in the left sidebar");
      console.log("3. Click 'Create a project' or select your existing project");
      console.log("4. Choose 'Direct Upload' option");
      console.log("5. Set project name to '" + projectName + "'");
      console.log("6. Upload the contents of the 'dist' directory (or minimal package)");
      console.log("7. Configure any required environment variables");
      console.log("8. Click 'Save and Deploy'");
      console.log("=".repeat(80));
    } else {
      console.log("\n🚀 Deploying to Cloudflare Pages...");
      try {
        // Check if wrangler is installed
        try {
          execSync('npx wrangler --version', { stdio: 'pipe' });
        } catch (error) {
          console.log("Installing Wrangler...");
          execSync('npm install -g wrangler', { stdio: 'inherit' });
        }
        
        // Ask about Cloudflare login
        if (!skipConfirmation) {
          const loginPrompt = await question("Do you need to log in to Cloudflare? (y/n): ");
          if (loginPrompt.toLowerCase() === 'y') {
            console.log("Logging in to Cloudflare...");
            execSync('npx wrangler login', { stdio: 'inherit' });
          }
        }
        
        // Deploy using wrangler
        console.log(`Deploying to project: ${projectName}`);
        execSync(`npx wrangler pages deploy dist --project-name ${projectName}`, { stdio: 'inherit' });
        
        console.log("\n✅ Deployment to Cloudflare Pages completed successfully!");
      } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        console.log("\nPossible solutions:");
        console.log("1. Ensure you're logged in to Cloudflare: npx wrangler login");
        console.log("2. Check project name in Cloudflare Dashboard");
        console.log("3. Try manual upload through the Cloudflare Dashboard");
        
        if (!skipConfirmation) {
          const tryManual = await question("Switch to manual upload instructions? (y/n): ");
          if (tryManual.toLowerCase() === 'y') {
            return runApproach(approaches.MANUAL_UPLOAD);
          }
        }
        
        process.exit(1);
      }
    }
    
    // Phase 4: Cleanup and Verification
    console.log("\n=== PHASE 4: CLEANUP AND VERIFICATION ===");
    
    // Restore configuration files
    console.log("\n🔄 Restoring original configuration files...");
    try {
      restoreFile('tsconfig.json');
      restoreFile('vite.config.ts');
      console.log("✅ Original configuration files restored.");
    } catch (error) {
      console.warn("⚠️ Warning: Could not restore all configuration files:", error.message);
      console.log("Please check and restore manually if needed.");
    }
    
    console.log("\n=".repeat(80));
    console.log("DEPLOYMENT PROCESS COMPLETE");
    console.log("=".repeat(80));
    console.log("\nYour EyeSentry application has been prepared for deployment or deployed to Cloudflare Pages.");
    console.log("You can view your deployments in the Cloudflare Dashboard.");
    
    // Verification steps
    console.log("\n📋 Post-Deployment Verification Checklist:");
    console.log("1. Visit your Cloudflare Pages URL to verify the deployment");
    console.log("2. Test core functionality of the application");
    console.log("3. Check browser console for any JavaScript errors");
    console.log("4. Verify that API connections are working correctly");
    console.log("5. Document any remaining issues for future improvements");
    
  } catch (error) {
    console.error("\n❌ Deployment process failed:", error.message);
    console.log("\nPlease review the errors above and try again.");
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Helper to run a specific approach
async function runApproach(approach) {
  console.log(`\n🔄 Switching to ${approach} approach...`);
  rl.close();
  
  // Run the script again with the new approach
  try {
    execSync(`node run-deployment.js ${approach} --yes`, { stdio: 'inherit' });
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ${approach} approach failed as well:`, error.message);
    process.exit(1);
  }
}

// Helper function to backup a file
function backupFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  const backupPath = path.join(__dirname, `${fileName}.backup`);
  
  if (fs.existsSync(filePath)) {
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`✅ Backed up: ${fileName}`);
    } else {
      console.log(`ℹ️ Backup already exists for: ${fileName}`);
    }
  } else {
    console.warn(`⚠️ File not found: ${fileName}`);
  }
}

// Helper function to restore a file from backup
function restoreFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  const backupPath = path.join(__dirname, `${fileName}.backup`);
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    console.log(`✅ Restored: ${fileName}`);
    
    // Optionally remove backup
    // fs.unlinkSync(backupPath);
  } else {
    console.warn(`⚠️ Backup not found for: ${fileName}`);
  }
}

// Display usage information
console.log("EyeSentry Deployment Tool");
console.log("Usage: node run-deployment.js [approach] [options]");
console.log("\nApproaches:");
console.log("  direct-build   : Use the direct build approach (default, recommended)");
console.log("  fix-errors     : Fix individual TypeScript errors");
console.log("  lenient-config : Use lenient TypeScript configuration");
console.log("  manual-upload  : Show instructions for manual upload");
console.log("\nOptions:");
console.log("  --yes, -y      : Skip confirmation prompts");
console.log("");

// Run the deployment process
runDeployment()
  .then(() => {
    console.log("\nDeployment script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during deployment:", err);
    process.exit(1);
  });