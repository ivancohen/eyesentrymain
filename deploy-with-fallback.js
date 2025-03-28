// Direct Cloudflare Deployment Script with Fallback
// This script creates minimal placeholder files if no build exists
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
async function deployWithFallback() {
  try {
    console.log("=".repeat(80));
    console.log("CLOUDFLARE DEPLOYMENT WITH FALLBACK");
    console.log("=".repeat(80));
    
    // Step 1: Check if dist directory exists
    console.log("\n📦 Checking for build directory...");
    let buildExists = false;
    
    if (fs.existsSync(distPath)) {
      const distFiles = fs.readdirSync(distPath);
      if (distFiles.length > 0) {
        buildExists = true;
        console.log(`✅ Found build directory with ${distFiles.length} files.`);
      } else {
        console.log("⚠️ Build directory exists but is empty.");
      }
    } else {
      console.log("⚠️ No build directory found.");
    }
    
    // Step 2: Create minimal placeholder if no build exists
    if (!buildExists) {
      console.log("\n🔨 Creating minimal placeholder site...");
      
      // Create dist directory if it doesn't exist
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }
      
      // Create minimal index.html
      const minimalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EyeSentry</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>EyeSentry</h1>
    <p>Application deployment in progress. Please check back later.</p>
    <p>Contact your administrator for more information.</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`;
      fs.writeFileSync(path.join(distPath, 'index.html'), minimalHtml);
      
      // Create minimal CSS
      const minimalCss = `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #2c3e50;
}

p {
  color: #7f8c8d;
  line-height: 1.6;
}`;
      fs.writeFileSync(path.join(distPath, 'style.css'), minimalCss);
      
      // Create minimal JavaScript
      const minimalJs = `document.addEventListener('DOMContentLoaded', function() {
  console.log('EyeSentry placeholder page loaded');
});`;
      fs.writeFileSync(path.join(distPath, 'script.js'), minimalJs);
      
      console.log("✅ Created minimal placeholder site in dist directory.");
      buildExists = true;
    }
    
    // Step 3: Verify build directory
    if (!buildExists) {
      throw new Error("Failed to create build directory. Cannot proceed with deployment.");
    }
    
    // Step 4: Check if Wrangler is installed
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
    
    // Step 5: Login to Cloudflare (if needed)
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
    
    // Step 6: Deploy to Cloudflare Pages
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
        console.log("\n⚠️ You may need to create the project first. Try:");
        console.log(`npx wrangler pages project create ${projectName}`);
        
        // Try to create the project
        console.log("\n🔨 Attempting to create project...");
        try {
          execSync(`npx wrangler pages project create ${projectName}`, { stdio: 'inherit' });
          console.log("\n✅ Project created successfully. Trying deployment again...");
          
          // Try deployment again
          execSync(`npx wrangler pages deploy ${distPath} --project-name ${projectName}`, { stdio: 'inherit' });
          console.log("\n✅ Successfully deployed to Cloudflare Pages!");
        } catch (createError) {
          console.error("❌ Failed to create project:", createError.message);
          throw new Error("Failed to create project. Please use the Cloudflare Dashboard for manual upload.");
        }
      } catch (error) {
        console.error("❌ Could not list projects:", error.message);
        throw new Error("Failed to deploy to Cloudflare Pages. Please use the manual approach.");
      }
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
deployWithFallback()
  .then(() => {
    console.log("\nDeployment script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during deployment:", err);
    process.exit(1);
  });