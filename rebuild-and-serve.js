// Script to rebuild the application with the QuestionService fix
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function rebuildAndServe() {
  try {
    console.log("=".repeat(80));
    console.log("REBUILDING APPLICATION WITH QUESTIONSERVICE FIX");
    console.log("=".repeat(80));
    
    // Step 1: Build the application
    console.log("\n📦 Building the application...");
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log("✅ Build completed successfully!");
    } catch (error) {
      console.error("❌ Build failed:", error.message);
      throw new Error("Build process failed.");
    }
    
    // Step 2: Copy the built files to the dist directory
    console.log("\n📋 Copying built files to dist directory...");
    try {
      // Run the copy-cloudflare-build.js script
      execSync('node copy-cloudflare-build.js', { stdio: 'inherit' });
      console.log("✅ Files copied successfully!");
    } catch (error) {
      console.error("❌ Copy failed:", error.message);
      throw new Error("Copy process failed.");
    }
    
    // Step 3: Serve the application
    console.log("\n🚀 Starting the server...");
    console.log("Press Ctrl+C to stop the server");
    execSync('node serve-local.js', { stdio: 'inherit' });
    
  } catch (error) {
    console.error("\n❌ Error rebuilding application:", error.message);
    process.exit(1);
  }
}

// Run the function
rebuildAndServe()
  .then(() => {
    console.log("\nRebuild script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during rebuild:", err);
    process.exit(1);
  });