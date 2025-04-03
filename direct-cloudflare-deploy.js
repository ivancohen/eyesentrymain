// Script to directly build and deploy to Cloudflare without circular dependencies
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function directCloudfareDeploy() {
  try {
    console.log("=".repeat(80));
    console.log("DIRECT CLOUDFLARE DEPLOYMENT");
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
    
    // Step 3: Deploy using Wrangler
    console.log("\n3️⃣ Deploying to Cloudflare using Wrangler...");
    try {
      execSync('npx wrangler pages publish dist', { stdio: 'inherit' });
      console.log("✅ Successfully deployed to Cloudflare");
    } catch (error) {
      console.error("❌ Failed to deploy to Cloudflare:", error.message);
      process.exit(1);
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
directCloudfareDeploy()
  .then(() => {
    console.log("\nCloudflare deployment completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during Cloudflare deployment:", err);
    process.exit(1);
  });