// Script to save the transparent logo to the assets directory
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function saveTransparentLogo() {
  try {
    console.log("=".repeat(80));
    console.log("SAVING TRANSPARENT LOGO TO ASSETS DIRECTORY");
    console.log("=".repeat(80));
    
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(__dirname, 'src', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
      console.log(`✅ Created assets directory: ${assetsDir}`);
    }
    
    // Copy the logo from the provided image to the assets directory
    const logoPath = path.join(assetsDir, 'logo.png');
    
    // Since we can't directly save the image from the message,
    // we'll provide instructions for the user to save the logo
    console.log("\n⚠️ Please save the transparent logo to src/assets/logo.png");
    console.log("The logo should be the one with the transparent background that was provided.");
    
    // Create a placeholder file if it doesn't exist
    if (!fs.existsSync(logoPath)) {
      fs.writeFileSync(logoPath, ''); // Create an empty file as a placeholder
      console.log(`✅ Created placeholder file at: ${logoPath}`);
      console.log("Please replace this placeholder with the actual transparent logo.");
    } else {
      console.log(`✅ Logo file already exists at: ${logoPath}`);
      console.log("Please ensure it's the transparent version of the logo.");
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 LOGO SETUP COMPLETED!");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error setting up logo:", error);
    process.exit(1);
  }
}

// Run the function
saveTransparentLogo()
  .then(() => {
    console.log("\nLogo setup completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during logo setup:", err);
    process.exit(1);
  });
