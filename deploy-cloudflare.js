// Direct Cloudflare Deployment Script
// This is a simplified script focused only on deploying to Cloudflare
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const projectName = 'eyesentry';
const distPath = path.join(__dirname, 'dist');

// Main function
async function deployToCloudflare() {
  try {
    console.log("=".repeat(80));
    console.log("DIRECT CLOUDFLARE DEPLOYMENT");
    console.log("=".repeat(80));
    
    // Step 1: Check if dist directory exists
    console.log("\n📦 Checking for build directory...");
    if (!fs.existsSync(distPath)) {
      console.error(`❌ Error: Build directory not found at ${distPath}`);
      throw new Error("No build directory found. Please build the application first.");
    }

    // Step 2: Check if dist directory has content
    const distFiles = fs.readdirSync(distPath);
    if (distFiles.length === 0) {
      console.error("❌ Error: Build directory is empty.");
      throw new Error("Build directory is empty. Please build the application first.");
    }
    
    console.log(`✅ Found build directory with ${distFiles.length} files.`);
    
    // Step 3: Check if Wrangler is installed
    console.log("\n🔍 Checking for Wrangler CLI...");
    try {
      execSync('npx wrangler --version', { stdio: 'pipe' });
      console.log("✅ Wrangler CLI is available.");
    } catch (error) {
      console.log("⚠️ Wrangler CLI not found. Attempting to install...");
      try {
        execSync('npm install -g wrangler', { stdio: 'inherit' });
        console.log("✅ Wrangler CLI installed successfully.");
      } catch (installError) {
        console.error("❌ Failed to install Wrangler CLI:", installError.message);
        throw new Error("Could not install Wrangler CLI. Please install it manually with 'npm install -g wrangler'.");
      }
    }
    
    // Step 4: Login to Cloudflare (if needed)
    console.log("\n🔑 Checking Cloudflare authentication...");
    try {
      execSync('npx wrangler whoami', { stdio: 'pipe' });
      console.log("✅ Already logged in to Cloudflare.");
    } catch (error) {
      console.log("⚠️ Not logged in to Cloudflare. Please log in now...");
      try {
        execSync('npx wrangler login', { stdio: 'inherit' });
        console.log("✅ Successfully logged in to Cloudflare.");
      } catch (loginError) {
        console.error("❌ Failed to log in to Cloudflare:", loginError.message);
        throw new Error("Could not log in to Cloudflare. Please try again or use the Cloudflare Dashboard for manual upload.");
      }
    }
    
    // Step 5: Deploy to Cloudflare Pages
    console.log("\n🚀 Deploying to Cloudflare Pages...");
    console.log(`Using project name: ${projectName}`);
    
    try {
      execSync(`npx wrangler pages deploy ${distPath} --project-name ${projectName}`, { stdio: 'inherit' });
      console.log("\n✅ Successfully deployed to Cloudflare Pages!");
    } catch (deployError) {
      console.error("❌ Deployment failed:", deployError.message);
      
      // Check if project exists
      console.log("\n🔍 Checking if project exists...");
      
      try {
        execSync('npx wrangler pages project list', { stdio: 'inherit' });
        console.log("\nYou may need to create the project first. Try:");
        console.log(`npx wrangler pages project create ${projectName}`);
      } catch (error) {
        console.error("❌ Could not list projects:", error.message);
      }
      
      throw new Error("Failed to deploy to Cloudflare Pages. See above for details.");
    }
    
    console.log("\n=".repeat(80));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(80));
    console.log("\nYour application has been deployed to Cloudflare Pages.");
    console.log(`You can view it at: https://${projectName}.pages.dev`);
    console.log("\nYou can also check the status in your Cloudflare Dashboard:");
    console.log("https://dash.cloudflare.com/ > Pages");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.log("\nIf automatic deployment failed, you can use the manual approach:");
    console.log("1. Go to https://dash.cloudflare.com/");
    console.log("2. Navigate to 'Pages' in the left sidebar");
    console.log("3. Create a new project or select your existing project");
    console.log("4. Choose 'Direct Upload' option");
    console.log("5. Upload the contents of the 'dist' directory");
    console.log("6. Click 'Save and Deploy'");
    process.exit(1);
  }
}

// Run the deployment
deployToCloudflare()
  .then(() => {
    console.log("\nDeployment script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during deployment:", err);
    process.exit(1);
  });