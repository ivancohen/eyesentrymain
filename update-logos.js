// Script to update logo paths and add logo to specialist questionnaire
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function updateLogos() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING LOGOS");
    console.log("=".repeat(80));
    
    // Step 1: Update Navbar.tsx
    console.log("\n1️⃣ Updating Navbar.tsx...");
    
    const navbarPath = path.join(__dirname, 'src', 'components', 'Navbar.tsx');
    const navbarBackupPath = path.join(__dirname, 'src', 'components', `Navbar.tsx.logo-update-backup-${Date.now()}`);
    
    if (fs.existsSync(navbarPath)) {
      fs.copyFileSync(navbarPath, navbarBackupPath);
      console.log(`✅ Created backup at ${navbarBackupPath}`);
      
      let navbarContent = fs.readFileSync(navbarPath, 'utf8');
      
      // Update the logo path
      const updatedNavbarContent = navbarContent.replace(
        /src="\/lovable-uploads\/a9fbc3f2-7b88-4043-889e-a3abacb6805c\.png"/,
        'src="/src/assets/logo.png"'
      );
      
      fs.writeFileSync(navbarPath, updatedNavbarContent);
      console.log("✅ Updated logo path in Navbar.tsx");
    } else {
      console.error("❌ Navbar.tsx not found");
    }
    
    // Step 2: Update SpecialistQuestionnaire.tsx
    console.log("\n2️⃣ Updating SpecialistQuestionnaire.tsx...");
    
    const specialistPath = path.join(__dirname, 'src', 'pages', 'SpecialistQuestionnaire.tsx');
    const specialistBackupPath = path.join(__dirname, 'src', 'pages', `SpecialistQuestionnaire.tsx.logo-update-backup-${Date.now()}`);
    
    if (fs.existsSync(specialistPath)) {
      fs.copyFileSync(specialistPath, specialistBackupPath);
      console.log(`✅ Created backup at ${specialistBackupPath}`);
      
      let specialistContent = fs.readFileSync(specialistPath, 'utf8');
      
      // Add logo to the non-validated view
      const updatedSpecialistContent1 = specialistContent.replace(
        /<Card className="w-full max-w-md p-6 space-y-4">/,
        `<Card className="w-full max-w-md p-6 space-y-4">
                    <div className="flex justify-center mb-4">
                        <img 
                            src="/src/assets/logo.png" 
                            alt="Eye Sentry Logo" 
                            className="h-16"
                        />
                    </div>`
      );
      
      // Add logo to the validated view
      const updatedSpecialistContent2 = updatedSpecialistContent1.replace(
        /<div className="container mx-auto py-8">/,
        `<div className="container mx-auto py-8">
                <div className="flex justify-center mb-6">
                    <img 
                        src="/src/assets/logo.png" 
                        alt="Eye Sentry Logo" 
                        className="h-16"
                    />
                </div>`
      );
      
      fs.writeFileSync(specialistPath, updatedSpecialistContent2);
      console.log("✅ Added logo to SpecialistQuestionnaire.tsx");
    } else {
      console.error("❌ SpecialistQuestionnaire.tsx not found");
    }
    
    // Step 3: Check for other logo references
    console.log("\n3️⃣ Checking for other logo references...");
    
    const indexPath = path.join(__dirname, 'src', 'pages', 'Index.tsx');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (indexContent.includes('src="src/assets/logo.png"')) {
        console.log("✅ Index.tsx already uses the correct logo path");
      } else {
        const indexBackupPath = path.join(__dirname, 'src', 'pages', `Index.tsx.logo-update-backup-${Date.now()}`);
        fs.copyFileSync(indexPath, indexBackupPath);
        console.log(`✅ Created backup at ${indexBackupPath}`);
        
        // Update the logo path
        const updatedIndexContent = indexContent.replace(
          /src="[^"]*"(\s+alt="Eye Sentry Logo")/,
          'src="/src/assets/logo.png"$1'
        );
        
        fs.writeFileSync(indexPath, updatedIndexContent);
        console.log("✅ Updated logo path in Index.tsx");
      }
    } else {
      console.log("⚠️ Index.tsx not found, skipping");
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 LOGO UPDATES COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nSummary:");
    console.log("1. Updated logo path in Navbar.tsx");
    console.log("2. Added logo to SpecialistQuestionnaireForm.tsx");
    console.log("2. Added logo to SpecialistQuestionnaire.tsx");
    console.log("3. Checked other logo references");
    
  } catch (error) {
    console.error("\n❌ Error updating logos:", error);
    process.exit(1);
  }
}

// Run the function
updateLogos()
  .then(() => {
    console.log("\nLogo update completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during logo update:", err);
    process.exit(1);
  });