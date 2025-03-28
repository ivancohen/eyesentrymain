// Script to deploy the application to Cloudflare Pages
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
const buildDir = path.join(__dirname, 'dist');

// Parse command line arguments
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const useDirectBuild = args.includes('--direct-build');
const manualUpload = args.includes('--manual');

// Main function
async function deployToCloudflare() {
  try {
    console.log("=".repeat(80));
    console.log("DEPLOYING TO CLOUDFLARE PAGES");
    console.log("=".repeat(80));
    
    // Step 1: Optionally build the application
    if (!skipBuild) {
      console.log("\n📦 Building the application...");
      
      if (useDirectBuild) {
        console.log("Using Direct Build approach to bypass TypeScript errors...");
        try {
          const directBuildScript = path.join(__dirname, 'direct-build.js');
          if (!fs.existsSync(directBuildScript)) {
            console.error(`❌ Error: Direct build script not found at ${directBuildScript}`);
            console.log("Please ensure the direct-build.js script exists.");
            process.exit(1);
          }
          
          execSync('node direct-build.js', { stdio: 'inherit' });
          console.log("✅ Direct build completed successfully!");
        } catch (error) {
          console.error("❌ Direct build failed:", error.message);
          console.log("\nAttempting standard build as fallback...");
          try {
            execSync('npm run build', { stdio: 'inherit' });
          } catch (fallbackError) {
            console.error("❌ Standard build also failed. Unable to proceed with deployment.");
            throw new Error("Build process failed. Cannot deploy.");
          }
        }
      } else {
        console.log("Using standard build process...");
        try {
          execSync('npm run build', { stdio: 'inherit' });
        } catch (error) {
          console.error("❌ Standard build failed:", error.message);
          console.log("\nConsider using the --direct-build flag to bypass TypeScript errors.");
          throw new Error("Build process failed. Cannot deploy.");
        }
      }
    } else {
      console.log("\n⏩ Skipping build step as requested with --skip-build flag.");
    }
    
    // Step 2: Check if the dist directory exists
    if (!fs.existsSync(buildDir)) {
      console.error(`❌ Error: Build directory not found at ${buildDir}`);
      console.log("Please ensure you've built the application before deploying.");
      process.exit(1);
    }
    
    // Count files in the dist directory to ensure it's not empty
    const distFiles = fs.readdirSync(buildDir, { recursive: true });
    if (distFiles.length === 0) {
      console.error("❌ Error: Build directory is empty. Build may have failed.");
      process.exit(1);
    } else {
      console.log(`✅ Build directory contains ${distFiles.length} files.`);
    }
    
    // Step 3: Deploy to Cloudflare Pages
    if (manualUpload) {
      console.log("\n📋 Manual Upload Instructions:");
      console.log("=".repeat(80));
      console.log("1. Go to Cloudflare Dashboard: https://dash.cloudflare.com/");
      console.log("2. Navigate to Pages in the left sidebar");
      console.log("3. Select the project or create a new one named '" + projectName + "'");
      console.log("4. Click 'Upload' or 'Deploy site'");
      console.log("5. Upload the contents of the 'dist' directory");
      console.log("6. Complete the upload and deployment process");
      console.log("=".repeat(80));
      
      console.log("\nThe dist directory is located at:");
      console.log(buildDir);
      
      console.log("\nPress Enter to continue...");
      process.exit(0);
    } else {
      console.log("\n🚀 Deploying to Cloudflare Pages...");
      try {
        // Check if wrangler is installed
        execSync('npx wrangler --version', { stdio: 'pipe' });
        
        // Deploy using wrangler with specified project name
        console.log(`Deploying to project: ${projectName}`);
        execSync(`npx wrangler pages deploy dist --project-name ${projectName}`, { stdio: 'inherit' });
        
        console.log("\n✅ Deployment to Cloudflare Pages completed successfully!");
      } catch (error) {
        console.error("\n❌ Error: Wrangler command failed.");
        console.log("\nPossible issues and solutions:");
        console.log("1. Wrangler may not be installed: npm install -g wrangler");
        console.log("2. You may not be logged in to Cloudflare: npx wrangler login");
        console.log("3. Project name may be incorrect: Check the --project-name parameter");
        console.log("4. Permission issues: Ensure you have correct permissions in Cloudflare");
        console.log("\nConsider using the --manual flag for manual upload instructions.");
        throw error;
      }
    }
    
    console.log("\n=".repeat(80));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(80));
    console.log("\nYour application has been deployed to Cloudflare Pages.");
    console.log("You can view your deployments in the Cloudflare Dashboard.");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.log("\nTry the following:");
    console.log("1. Use --direct-build flag to bypass TypeScript errors: node deploy-to-cloudflare.js --direct-build");
    console.log("2. Build manually first, then deploy: node direct-build.js && node deploy-to-cloudflare.js --skip-build");
    console.log("3. Use manual upload instructions: node deploy-to-cloudflare.js --manual");
    process.exit(1);
  }
}

// Show usage information
console.log("Cloudflare Pages Deployment Tool");
console.log("Options:");
console.log("  --skip-build    : Skip the build step (use if you've already built the application)");
console.log("  --direct-build  : Use the direct build approach to bypass TypeScript errors");
console.log("  --manual        : Show instructions for manual upload instead of using Wrangler");
console.log("");

// Run the function
deployToCloudflare()
  .then(() => {
    console.log("\nDeployment script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during deployment:", err);
    process.exit(1);
  });