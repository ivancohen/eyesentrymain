// Script to create a restore point, update logos, update GitHub, and deploy to Cloudflare
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
async function buildUpdateDeploy() {
  try {
    console.log("=".repeat(80));
    console.log("BUILD, UPDATE GITHUB, AND DEPLOY TO CLOUDFLARE");
    console.log("=".repeat(80));
    
    // Step 1: Create a restore point
    console.log("\n1️⃣ Creating restore point...");
    const restorePointDir = await createRestorePoint();
    console.log(`✅ Restore point created at: ${restorePointDir}`);
    
    // Step 2: Save transparent logo
    console.log("\n2️⃣ Setting up transparent logo...");
    try {
      execSync('node save-transparent-logo.js', { stdio: 'inherit' });
      console.log("✅ Transparent logo setup completed");
    } catch (error) {
      console.error("❌ Failed to set up transparent logo:", error.message);
      const continueDeployment = await askToContinue("Do you want to continue with deployment despite logo setup failure?");
      if (!continueDeployment) {
        process.exit(1);
      }
    }
    
    // Step 3: Update all logo references
    console.log("\n3️⃣ Updating all logo references...");
    try {
      execSync('node update-all-logos.js', { stdio: 'inherit' });
      console.log("✅ All logo references updated successfully");
    } catch (error) {
      console.error("❌ Failed to update logo references:", error.message);
      const continueDeployment = await askToContinue("Do you want to continue with deployment despite logo reference update failure?");
      if (!continueDeployment) {
        process.exit(1);
      }
    }
    
    // Step 4: Update specialist form logo
    console.log("\n4️⃣ Updating specialist assessment form logo...");
    try {
      execSync('node update-specialist-form-logo.js', { stdio: 'inherit' });
      console.log("✅ Specialist form logo updated successfully");
    } catch (error) {
      console.error("❌ Failed to update specialist form logo:", error.message);
      const continueDeployment = await askToContinue("Do you want to continue with deployment despite specialist form logo update failure?");
      if (!continueDeployment) {
        process.exit(1);
      }
    }
    
    // Step 5: Update GitHub
    console.log("\n5️⃣ Updating GitHub...");
    try {
      execSync('node update-github.js', { stdio: 'inherit' });
      console.log("✅ GitHub updated successfully");
    } catch (error) {
      console.error("❌ Failed to update GitHub:", error.message);
      const continueDeployment = await askToContinue("Do you want to continue with deployment despite GitHub update failure?");
      if (!continueDeployment) {
        process.exit(1);
      }
    }
    
    // Step 6: Deploy to Cloudflare
    console.log("\n6️⃣ Deploying to Cloudflare...");
    try {
      execSync('node deploy-to-cloudflare.js', { stdio: 'inherit' });
      console.log("✅ Deployed to Cloudflare successfully");
    } catch (error) {
      console.error("❌ Failed to deploy to Cloudflare:", error.message);
      process.exit(1);
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 BUILD, UPDATE, AND DEPLOYMENT COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nSummary:");
    console.log(`1. Restore point created at: ${restorePointDir}`);
    console.log("2. Transparent logo set up");
    console.log("3. All logo references updated to use transparent logo");
    console.log("4. Specialist assessment form logo updated");
    console.log("5. GitHub repository updated");
    console.log("6. Application deployed to Cloudflare");
    
  } catch (error) {
    console.error("\n❌ Error in build-update-deploy process:", error);
    process.exit(1);
  }
}

// Helper function to ask for confirmation
async function askToContinue(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(`${question} (y/n): `, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run the function
buildUpdateDeploy()
  .then(() => {
    console.log("\nBuild, update, and deployment process completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during build-update-deploy process:", err);
    process.exit(1);
  });