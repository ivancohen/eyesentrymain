// Script to add logo to the specialist assessment form
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function updateSpecialistFormLogo() {
  try {
    console.log("=".repeat(80));
    console.log("ADDING LOGO TO SPECIALIST ASSESSMENT FORM");
    console.log("=".repeat(80));
    
    // Update SpecialistQuestionnaireForm.tsx
    console.log("\nUpdating SpecialistQuestionnaireForm.tsx...");
    
    const formPath = path.join(__dirname, 'src', 'components', 'specialist', 'SpecialistQuestionnaireForm.tsx');
    const formBackupPath = path.join(__dirname, 'src', 'components', 'specialist', `SpecialistQuestionnaireForm.tsx.logo-update-backup-${Date.now()}`);
    
    if (fs.existsSync(formPath)) {
      fs.copyFileSync(formPath, formBackupPath);
      console.log(`✅ Created backup at ${formBackupPath}`);
      
      let formContent = fs.readFileSync(formPath, 'utf8');
      
      // Add logo to the form
      const updatedFormContent = formContent.replace(
        /<Card className="p-6">\s*<h1 className="text-2xl font-bold mb-6">Specialist Assessment Form<\/h1>/,
        `<Card className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src="/src/assets/logo.png" 
                        alt="Eye Sentry Logo" 
                        className="h-16 mb-4"
                    />
                    <h1 className="text-2xl font-bold">Specialist Assessment Form</h1>
                </div>`
      );
      
      fs.writeFileSync(formPath, updatedFormContent);
      console.log("✅ Added logo to SpecialistQuestionnaireForm.tsx");
    } else {
      console.error("❌ SpecialistQuestionnaireForm.tsx not found");
      process.exit(1);
    }
    
    // Update the update-logos.js script to include this file
    console.log("\nUpdating update-logos.js to include specialist form...");
    
    const updateLogosPath = path.join(__dirname, 'update-logos.js');
    
    if (fs.existsSync(updateLogosPath)) {
      let updateLogosContent = fs.readFileSync(updateLogosPath, 'utf8');
      
      // Check if the file already includes the specialist form
      if (!updateLogosContent.includes('SpecialistQuestionnaireForm.tsx')) {
        // Add the specialist form to the step 3 section
        const updatedUpdateLogosContent = updateLogosContent.replace(
          /console\.log\("3️⃣ Checking for other logo references\.\.\."\);/,
          `console.log("3️⃣ Updating SpecialistQuestionnaireForm.tsx...");
    
    const specialistFormPath = path.join(__dirname, 'src', 'components', 'specialist', 'SpecialistQuestionnaireForm.tsx');
    const specialistFormBackupPath = path.join(__dirname, 'src', 'components', 'specialist', \`SpecialistQuestionnaireForm.tsx.logo-update-backup-\${Date.now()}\`);
    
    if (fs.existsSync(specialistFormPath)) {
      fs.copyFileSync(specialistFormPath, specialistFormBackupPath);
      console.log(\`✅ Created backup at \${specialistFormBackupPath}\`);
      
      let specialistFormContent = fs.readFileSync(specialistFormPath, 'utf8');
      
      // Add logo to the form
      const updatedSpecialistFormContent = specialistFormContent.replace(
        /<Card className="p-6">\\s*<h1 className="text-2xl font-bold mb-6">Specialist Assessment Form<\\/h1>/,
        \`<Card className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src="/src/assets/logo.png" 
                        alt="Eye Sentry Logo" 
                        className="h-16 mb-4"
                    />
                    <h1 className="text-2xl font-bold">Specialist Assessment Form</h1>
                </div>\`
      );
      
      fs.writeFileSync(specialistFormPath, updatedSpecialistFormContent);
      console.log("✅ Added logo to SpecialistQuestionnaireForm.tsx");
    } else {
      console.log("⚠️ SpecialistQuestionnaireForm.tsx not found, skipping");
    }
    
    console.log("\\n4️⃣ Checking for other logo references...");`
        );
        
        // Update the summary section
        const updatedSummaryContent = updatedUpdateLogosContent.replace(
          /console\.log\("1\. Updated logo path in Navbar\.tsx"\);/,
          `console.log("1. Updated logo path in Navbar.tsx");
    console.log("2. Added logo to SpecialistQuestionnaireForm.tsx");`
        );
        
        fs.writeFileSync(updateLogosPath, updatedSummaryContent);
        console.log("✅ Updated update-logos.js to include specialist form");
      } else {
        console.log("✅ update-logos.js already includes specialist form");
      }
    } else {
      console.log("⚠️ update-logos.js not found, skipping update");
    }
    
    // Update the DEPLOYMENT_README.md to mention the specialist form
    console.log("\nUpdating DEPLOYMENT_README.md to mention specialist form...");
    
    const readmePath = path.join(__dirname, 'DEPLOYMENT_README.md');
    
    if (fs.existsSync(readmePath)) {
      let readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // Check if the file already mentions the specialist form
      if (!readmeContent.includes('SpecialistQuestionnaireForm.tsx')) {
        // Add the specialist form to the Logo Updates section
        const updatedReadmeContent = readmeContent.replace(
          /The following files are updated:\s*\n\s*- `src\/components\/Navbar\.tsx`: Updates the logo path\s*\n\s*- `src\/pages\/SpecialistQuestionnaire\.tsx`: Adds the logo to both the validated and non-validated views/,
          `The following files are updated:

- \`src/components/Navbar.tsx\`: Updates the logo path
- \`src/pages/SpecialistQuestionnaire.tsx\`: Adds the logo to both the validated and non-validated views
- \`src/components/specialist/SpecialistQuestionnaireForm.tsx\`: Adds the logo to the specialist assessment form`
        );
        
        fs.writeFileSync(readmePath, updatedReadmeContent);
        console.log("✅ Updated DEPLOYMENT_README.md to mention specialist form");
      } else {
        console.log("✅ DEPLOYMENT_README.md already mentions specialist form");
      }
    } else {
      console.log("⚠️ DEPLOYMENT_README.md not found, skipping update");
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 LOGO ADDED TO SPECIALIST ASSESSMENT FORM!");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error updating specialist form logo:", error);
    process.exit(1);
  }
}

// Run the function
updateSpecialistFormLogo()
  .then(() => {
    console.log("\nSpecialist form logo update completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during specialist form logo update:", err);
    process.exit(1);
  });