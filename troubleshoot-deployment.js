// Script to troubleshoot Cloudflare Pages deployment issues
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function troubleshootDeployment() {
  try {
    console.log("=".repeat(80));
    console.log("CLOUDFLARE DEPLOYMENT TROUBLESHOOTING");
    console.log("=".repeat(80));
    
    // Step 1: Check if wrangler is installed
    console.log("\n📋 Checking Wrangler installation...");
    try {
      const wranglerVersion = execSync('npx wrangler --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Wrangler is installed: ${wranglerVersion}`);
    } catch (error) {
      console.log("❌ Wrangler is not installed or not accessible.");
      console.log("\nInstalling Wrangler...");
      try {
        execSync('npm install wrangler --save-dev', { stdio: 'inherit' });
        console.log("✅ Wrangler installed successfully.");
      } catch (installError) {
        console.error("❌ Failed to install Wrangler:", installError.message);
        console.log("\nPlease try installing manually: npm install wrangler --save-dev");
      }
    }
    
    // Step 2: Check Cloudflare authentication
    console.log("\n📋 Checking Cloudflare authentication...");
    try {
      execSync('npx wrangler whoami', { stdio: 'pipe' });
      console.log("✅ You are authenticated with Cloudflare.");
    } catch (error) {
      console.log("❌ You are not authenticated with Cloudflare.");
      console.log("\nPlease run the following command to log in:");
      console.log("npx wrangler login");
      console.log("\nAfter logging in, run this troubleshooting script again.");
      return;
    }
    
    // Step 3: Check if the dist directory exists and has content
    console.log("\n📋 Checking build output...");
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.log("❌ Build directory not found at:", distPath);
      console.log("\nTrying to build the application...");
      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log("✅ Build completed successfully.");
      } catch (buildError) {
        console.error("❌ Build failed:", buildError.message);
        console.log("\nPlease fix the build issues and try again.");
        return;
      }
    } else {
      const files = fs.readdirSync(distPath);
      if (files.length === 0) {
        console.log("❌ Build directory is empty.");
        console.log("\nTrying to rebuild the application...");
        try {
          execSync('npm run build', { stdio: 'inherit' });
          console.log("✅ Build completed successfully.");
        } catch (buildError) {
          console.error("❌ Build failed:", buildError.message);
          console.log("\nPlease fix the build issues and try again.");
          return;
        }
      } else {
        console.log(`✅ Build directory exists and contains ${files.length} files/directories.`);
      }
    }
    
    // Step 4: Check wrangler.toml configuration
    console.log("\n📋 Checking wrangler.toml configuration...");
    const wranglerPath = path.join(__dirname, 'wrangler.toml');
    if (!fs.existsSync(wranglerPath)) {
      console.log("❌ wrangler.toml not found at:", wranglerPath);
      console.log("\nCreating a basic wrangler.toml file...");
      
      const wranglerContent = `name = "eyesentry"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[build]
command = "npm run build"
cwd = "."

[build.environment]
NODE_VERSION = "20"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
`;
      
      fs.writeFileSync(wranglerPath, wranglerContent);
      console.log("✅ Created wrangler.toml with basic configuration.");
    } else {
      console.log("✅ wrangler.toml exists.");
    }
    
    // Step 5: Try a direct deployment with verbose output
    console.log("\n📋 Attempting direct deployment with verbose output...");
    try {
      execSync('npx wrangler pages deploy dist --verbose', { stdio: 'inherit' });
      console.log("✅ Deployment completed successfully!");
    } catch (deployError) {
      console.error("❌ Deployment failed:", deployError.message);
      
      // Step 6: Check for common errors and provide solutions
      console.log("\n📋 Checking for common deployment issues...");
      
      // Check for account ID issues
      console.log("\n1. Checking if account ID is needed...");
      console.log("   Try deploying with an explicit account ID:");
      console.log("   npx wrangler pages deploy dist --account-id YOUR_ACCOUNT_ID");
      console.log("   (You can find your account ID in the Cloudflare dashboard)");
      
      // Check for project name issues
      console.log("\n2. Checking if project name is needed...");
      console.log("   Try deploying with an explicit project name:");
      console.log("   npx wrangler pages deploy dist --project-name eyesentry");
      
      // Check for permissions issues
      console.log("\n3. Checking for permissions issues...");
      console.log("   Make sure you have the necessary permissions in your Cloudflare account.");
      console.log("   You might need to create the Pages project first in the Cloudflare dashboard.");
      
      // Check for network issues
      console.log("\n4. Checking for network issues...");
      console.log("   Make sure you have a stable internet connection.");
      console.log("   Try again later if Cloudflare might be experiencing issues.");
      
      // Suggest manual deployment
      console.log("\n5. Consider manual deployment through the Cloudflare dashboard:");
      console.log("   a. Go to https://dash.cloudflare.com/");
      console.log("   b. Navigate to Pages");
      console.log("   c. Create a new project or select an existing one");
      console.log("   d. Upload your dist directory manually");
    }
    
    console.log("\n=".repeat(80));
    console.log("TROUBLESHOOTING COMPLETE");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Troubleshooting failed:", error.message);
    process.exit(1);
  }
}

// Run the function
troubleshootDeployment()
  .then(() => {
    console.log("\nTroubleshooting script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during troubleshooting:", err);
    process.exit(1);
  });