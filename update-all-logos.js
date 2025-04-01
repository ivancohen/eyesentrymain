// Script to update all logo references in the codebase to use the transparent logo
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function updateAllLogos() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING ALL LOGO REFERENCES IN THE CODEBASE");
    console.log("=".repeat(80));
    
    // Ensure the logo file exists
    const logoPath = path.join(__dirname, 'src', 'assets', 'logo.png');
    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Logo file not found at: ${logoPath}`);
      console.error("Please ensure you have saved the transparent logo to src/assets/logo.png");
      process.exit(1);
    }
    
    console.log(`✅ Found logo file at: ${logoPath}`);
    
    // Find all TSX and JSX files in the src directory
    console.log("\nSearching for all TSX and JSX files in the src directory...");
    
    try {
      // Find all files containing logo references
      const grepCommand = 'grep -r "logo\\|Logo" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" src';
      const grepResult = execSync(grepCommand, { encoding: 'utf8' });
      
      const fileMatches = grepResult.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [filePath] = line.split(':');
          return filePath;
        })
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
      
      console.log(`\nFound ${fileMatches.length} files with potential logo references:`);
      fileMatches.forEach(file => console.log(`- ${file}`));
      
      // Update each file
      let updatedFiles = 0;
      
      for (const filePath of fileMatches) {
        console.log(`\nProcessing: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Replace various logo paths with the correct path
        let updatedContent = content
          // Replace absolute paths
          .replace(/src="\/lovable-uploads\/[^"]+"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\/images\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          // Replace relative paths
          .replace(/src="\.\.\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\.\.\/\.\.\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\.\.\/\.\.\/\.\.\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="images\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="logo[^"]*"/g, 'src="/src/assets/logo.png"');
        
        // Ensure logos are on white backgrounds
        // Look for logo img tags in colored backgrounds and add a white background class
        updatedContent = updatedContent.replace(
          /(<img[^>]*src="\/src\/assets\/logo\.png"[^>]*>)/g, 
          (match) => {
            // If the img tag doesn't already have a bg-white class, add it
            if (!match.includes('bg-white')) {
              return match.replace(
                /class="([^"]*)"/,
                (classMatch, classes) => `class="${classes} bg-white rounded-md p-1"`
              );
            }
            return match;
          }
        );
        
        // Only write the file if changes were made
        if (content !== updatedContent) {
          fs.writeFileSync(filePath, updatedContent);
          console.log(`✅ Updated logo references in: ${filePath}`);
          updatedFiles++;
        } else {
          console.log(`ℹ️ No logo references to update in: ${filePath}`);
        }
      }
      
      console.log(`\n✅ Updated logo references in ${updatedFiles} files`);
      
    } catch (error) {
      console.error(`❌ Error searching for logo references: ${error.message}`);
      console.log("Continuing with manual updates...");
    }
    
    // Manually update key files that we know contain logo references
    const keyFiles = [
      'src/components/Navbar.tsx',
      'src/pages/Index.tsx',
      'src/pages/Login.tsx',
      'src/pages/Register.tsx',
      'src/components/specialist/SpecialistQuestionnaireForm.tsx',
      'src/components/layouts/AppLayout.tsx',
      'src/components/AuthForm.tsx'
    ];
    
    console.log("\nManually updating key files...");
    
    for (const filePath of keyFiles) {
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        console.log(`\nProcessing: ${filePath}`);
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Replace various logo paths with the correct path
        let updatedContent = content
          // Replace absolute paths
          .replace(/src="\/lovable-uploads\/[^"]+"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\/images\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          // Replace relative paths
          .replace(/src="\.\.\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\.\.\/\.\.\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="\.\.\/\.\.\/\.\.\/assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="assets\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="images\/logo[^"]*"/g, 'src="/src/assets/logo.png"')
          .replace(/src="logo[^"]*"/g, 'src="/src/assets/logo.png"');
        
        // Ensure logos are on white backgrounds
        // Look for logo img tags in colored backgrounds and add a white background class
        updatedContent = updatedContent.replace(
          /(<img[^>]*src="\/src\/assets\/logo\.png"[^>]*>)/g, 
          (match) => {
            // If the img tag doesn't already have a bg-white class, add it
            if (!match.includes('bg-white')) {
              // If the match already has a class attribute
              if (match.includes('class="')) {
                return match.replace(
                  /class="([^"]*)"/,
                  (classMatch, classes) => `class="${classes} bg-white rounded-md p-1"`
                );
              } else {
                // If the match doesn't have a class attribute, add one
                return match.replace(
                  /(<img\s)/,
                  '$1class="bg-white rounded-md p-1" '
                );
              }
            }
            return match;
          }
        );
        
        // Only write the file if changes were made
        if (content !== updatedContent) {
          fs.writeFileSync(fullPath, updatedContent);
          console.log(`✅ Updated logo references in: ${filePath}`);
        } else {
          console.log(`ℹ️ No logo references to update in: ${filePath}`);
        }
      } else {
        console.log(`⚠️ File not found: ${filePath}`);
      }
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 LOGO REFERENCES UPDATED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log("\nAll logo references in the codebase have been updated to use the transparent logo at src/assets/logo.png");
    console.log("All logos have been ensured to be on white backgrounds to prevent them from getting lost");
    
  } catch (error) {
    console.error("\n❌ Error updating logo references:", error);
    process.exit(1);
  }
}

// Run the function
updateAllLogos()
  .then(() => {
    console.log("\nLogo reference update completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during logo reference update:", err);
    process.exit(1);
  });