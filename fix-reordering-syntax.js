// Script to fix the syntax error in QuestionService.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function fixSyntaxError() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING SYNTAX ERROR IN QuestionService.ts");
    console.log("=".repeat(80));
    
    // Update the QuestionService.ts file
    const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Service file not found: ${servicePath}`);
      throw new Error("Service file not found");
    }
    
    // Create a backup
    const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.syntax-fix-backup');
    fs.copyFileSync(servicePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    
    // Read the current content
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Replace the reorderDropdownOptions method with a corrected implementation
    const newReorderMethod = `
  /**
   * Reorder dropdown options - Direct implementation with debug logging
   */
  static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    try {
      console.log('[QuestionService] Reordering dropdown options:', JSON.stringify(updates));
      
      if (!updates || updates.length === 0) {
        console.log('[QuestionService] No updates provided, skipping reordering');
        return;
      }
      
      // Update each dropdown option directly with individual queries
      for (const update of updates) {
        console.log(\`[QuestionService] Updating option \${update.id} to display_order \${update.display_order}\`);
        
        const { data, error } = await supabase
          .from('dropdown_options')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
          .select();
        
        if (error) {
          console.error(\`[QuestionService] Error updating option \${update.id}:\`, error);
          throw error;
        }
        
        console.log(\`[QuestionService] Successfully updated option \${update.id}\`, data);
      }
      
      console.log('[QuestionService] Successfully reordered all dropdown options');
    } catch (err) {
      console.error('[QuestionService] Error in reorderDropdownOptions:', err);
      throw err;
    }
  }`;
    
    // Find and replace the reorderDropdownOptions method
    // Use a more precise regex to ensure we're replacing the entire method
    const methodRegex = /\/\*\*\s*\*\s*Reorder dropdown options[\s\S]*?static async reorderDropdownOptions[\s\S]*?}\s*}/;
    
    if (!methodRegex.test(content)) {
      console.log("Method not found with the expected pattern. Trying alternative approach...");
      
      // If the regex doesn't match, try to find the method by its signature
      const signatureRegex = /static\s+async\s+reorderDropdownOptions\s*\(/;
      const match = signatureRegex.exec(content);
      
      if (!match) {
        console.error("❌ Could not find the reorderDropdownOptions method");
        throw new Error("Method not found");
      }
      
      // Find the start of the method
      const startIndex = match.index;
      
      // Find the end of the method (this is approximate and may need adjustment)
      let braceCount = 0;
      let endIndex = startIndex;
      let foundOpeningBrace = false;
      
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
          braceCount++;
          foundOpeningBrace = true;
        } else if (content[i] === '}') {
          braceCount--;
          if (foundOpeningBrace && braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      // If we couldn't find the end, use a more aggressive approach
      if (endIndex === startIndex) {
        console.log("Could not find the end of the method. Using a more aggressive approach...");
        
        // Look for the next static method
        const nextMethodRegex = /static\s+async/g;
        nextMethodRegex.lastIndex = startIndex + 1;
        const nextMatch = nextMethodRegex.exec(content);
        
        if (nextMatch) {
          endIndex = nextMatch.index;
        } else {
          // If there's no next method, look for the end of the class
          const classEndRegex = /}\s*$/;
          const classEndMatch = classEndRegex.exec(content);
          
          if (classEndMatch) {
            endIndex = classEndMatch.index;
          } else {
            console.error("❌ Could not determine the end of the method");
            throw new Error("Method end not found");
          }
        }
      }
      
      // Replace the method
      const updatedContent = 
        content.substring(0, startIndex) + 
        newReorderMethod + 
        content.substring(endIndex);
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      console.log("✅ Updated QuestionService.ts with corrected implementation");
    } else {
      // If the regex matches, use the original approach
      const updatedContent = content.replace(methodRegex, newReorderMethod);
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      console.log("✅ Updated QuestionService.ts with corrected implementation");
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 SYNTAX FIX COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nNext steps:");
    console.log("1. Restart your development server");
    console.log("2. Run the verification script: node verify-reordering.js");
    console.log("3. Test the reordering functionality in the UI");
    
  } catch (error) {
    console.error("\n❌ Error fixing syntax:", error);
    process.exit(1);
  }
}

// Run the function
fixSyntaxError()
  .then(() => {
    console.log("\nSyntax fix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during syntax fix:", err);
    process.exit(1);
  });