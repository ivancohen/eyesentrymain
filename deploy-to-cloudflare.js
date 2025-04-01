// Script to deploy the current build to Cloudflare
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function deployToCloudflare() {
  try {
    console.log("=".repeat(80));
    console.log("DEPLOYING TO CLOUDFLARE");
    console.log("=".repeat(80));
    
    // Step 1: Build the project
    console.log("\n1️⃣ Building the project...");
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log("✅ Project built successfully");
    } catch (error) {
      console.error("❌ Failed to build the project:", error.message);
      process.exit(1);
    }
    
    // Step 2: Check if the dist directory exists
    console.log("\n2️⃣ Checking for dist directory...");
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      console.error(`❌ Dist directory not found: ${distDir}`);
      process.exit(1);
    }
    console.log("✅ Dist directory found");
    
    // Step 3: Check for Cloudflare deployment script
    console.log("\n3️⃣ Checking for Cloudflare deployment script...");
    
    // Look for common Cloudflare deployment scripts
    const possibleScripts = [
      'deploy-to-cloudflare.sh',
      'deploy-cloudflare.js',
      'deploy-to-cloudflare.js',
      'deploy-cloudflare.sh'
    ];
    
    let deployScript = null;
    for (const script of possibleScripts) {
      if (fs.existsSync(path.join(__dirname, script))) {
        deployScript = script;
        break;
      }
    }
    
    if (deployScript) {
      console.log(`✅ Found Cloudflare deployment script: ${deployScript}`);
      
      // Step 4: Execute the existing deployment script
      console.log(`\n4️⃣ Executing ${deployScript}...`);
      try {
        if (deployScript.endsWith('.js')) {
          execSync(`node ${deployScript}`, { stdio: 'inherit' });
        } else if (deployScript.endsWith('.sh')) {
          execSync(`bash ${deployScript}`, { stdio: 'inherit' });
        }
        console.log(`✅ Successfully executed ${deployScript}`);
      } catch (error) {
        console.error(`❌ Failed to execute ${deployScript}:`, error.message);
        process.exit(1);
      }
    } else {
      // Step 4: Check for Cloudflare Wrangler
      console.log("\n4️⃣ Checking for Cloudflare Wrangler...");
      try {
        execSync('npx wrangler --version', { stdio: 'ignore' });
        console.log("✅ Cloudflare Wrangler found");
        
        // Step 5: Deploy using Wrangler
        console.log("\n5️⃣ Deploying to Cloudflare using Wrangler...");
        try {
          execSync('npx wrangler pages publish dist', { stdio: 'inherit' });
          console.log("✅ Successfully deployed to Cloudflare");
        } catch (error) {
          console.error("❌ Failed to deploy to Cloudflare:", error.message);
          process.exit(1);
        }
      } catch (error) {
        console.error("❌ Cloudflare Wrangler not found");
        console.log("Please install Wrangler or use an existing deployment script");
        process.exit(1);
      }
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 DEPLOYMENT TO CLOUDFLARE COMPLETED!");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error deploying to Cloudflare:", error);
    process.exit(1);
  }
}

// Run the function
deployToCloudflare()
  .then(() => {
    console.log("\nCloudflare deployment completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during Cloudflare deployment:", err);
    process.exit(1);
  });