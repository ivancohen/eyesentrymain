// Script to apply a minimal fix to the reordering functionality
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function applyMinimalFix() {
  try {
    console.log("=".repeat(80));
    console.log("APPLYING MINIMAL FIX TO REORDERING FUNCTIONALITY");
    console.log("=".repeat(80));
    
    // Step 1: Check for backups and restore if available
    console.log("\n1️⃣ Checking for backups...");
    
    const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
    const backupPaths = [
      path.join(__dirname, 'src', 'services', 'QuestionService.ts.reordering-fix-backup'),
      path.join(__dirname, 'src', 'services', 'QuestionService.ts.syntax-fix-backup')
    ];
    
    let restoredFromBackup = false;
    
    for (const backupPath of backupPaths) {
      if (fs.existsSync(backupPath)) {
        console.log(`Found backup at ${backupPath}`);
        
        // Create a new backup of the current file
        const currentBackupPath = path.join(__dirname, 'src', 'services', `QuestionService.ts.before-minimal-fix-${Date.now()}`);
        fs.copyFileSync(servicePath, currentBackupPath);
        console.log(`Created backup of current file at ${currentBackupPath}`);
        
        // Restore from the backup
        fs.copyFileSync(backupPath, servicePath);
        console.log(`✅ Restored from backup at ${backupPath}`);
        restoredFromBackup = true;
        break;
      }
    }
    
    if (!restoredFromBackup) {
      console.log("No backups found. Will apply fix to current file.");
      
      // Create a backup of the current file
      const currentBackupPath = path.join(__dirname, 'src', 'services', `QuestionService.ts.before-minimal-fix-${Date.now()}`);
      fs.copyFileSync(servicePath, currentBackupPath);
      console.log(`Created backup of current file at ${currentBackupPath}`);
    }
    
    // Step 2: Read the current content
    console.log("\n2️⃣ Reading current file...");
    
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Service file not found: ${servicePath}`);
      throw new Error("Service file not found");
    }
    
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Step 3: Apply the minimal fix
    console.log("\n3️⃣ Applying minimal fix...");
    
    // Find the reorderDropdownOptions method
    const methodRegex = /\/\*\*\s*\*\s*Reorder dropdown options[\s\S]*?static async reorderDropdownOptions[\s\S]*?}\s*}/;
    const match = methodRegex.exec(content);
    
    if (!match) {
      console.log("Method not found with the expected pattern. Looking for method signature...");
      
      // Try to find the method by its signature
      const signatureRegex = /static\s+async\s+reorderDropdownOptions\s*\(/;
      const signatureMatch = signatureRegex.exec(content);
      
      if (!signatureMatch) {
        console.error("❌ Could not find the reorderDropdownOptions method");
        console.log("Attempting to add the method at the end of the class...");
        
        // Find the end of the class
        const classEndRegex = /}\s*$/;
        const classEndMatch = classEndRegex.exec(content);
        
        if (!classEndMatch) {
          console.error("❌ Could not find the end of the class");
          throw new Error("Class end not found");
        }
        
        // Add the method before the end of the class
        const minimalMethod = `
  /**
   * Reorder dropdown options - Minimal implementation
   */
  static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    try {
      if (!updates || updates.length === 0) return;
      
      for (const update of updates) {
        await supabase
          .from('dropdown_options')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Error in reorderDropdownOptions:', err);
    }
  }
`;
        
        const updatedContent = content.substring(0, classEndMatch.index) + minimalMethod + content.substring(classEndMatch.index);
        
        // Write the updated content
        fs.writeFileSync(servicePath, updatedContent);
        console.log("✅ Added minimal reorderDropdownOptions method to the end of the class");
      } else {
        // Found the method signature, now find the method body
        const startIndex = signatureMatch.index;
        let braceCount = 0;
        let foundOpeningBrace = false;
        let endIndex = content.length;
        
        // Find the end of the method
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
        
        // Replace the method with a minimal implementation
        const minimalMethod = `static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    try {
      if (!updates || updates.length === 0) return;
      
      for (const update of updates) {
        await supabase
          .from('dropdown_options')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Error in reorderDropdownOptions:', err);
    }
  }`;
        
        const updatedContent = content.substring(0, startIndex) + minimalMethod + content.substring(endIndex);
        
        // Write the updated content
        fs.writeFileSync(servicePath, updatedContent);
        console.log("✅ Replaced reorderDropdownOptions method with minimal implementation");
      }
    } else {
      // Found the method with the expected pattern, replace it
      const minimalMethod = `/**
   * Reorder dropdown options - Minimal implementation
   */
  static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    try {
      if (!updates || updates.length === 0) return;
      
      for (const update of updates) {
        await supabase
          .from('dropdown_options')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Error in reorderDropdownOptions:', err);
    }
  }`;
      
      const updatedContent = content.replace(match[0], minimalMethod);
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      console.log("✅ Replaced reorderDropdownOptions method with minimal implementation");
    }
    
    // Step 4: Update dropdown options with sequential display_order values
    console.log("\n4️⃣ Creating a script to update dropdown options...");
    
    const updateScriptPath = path.join(__dirname, 'update-dropdown-orders.js');
    const updateScriptContent = `// Script to update dropdown options with sequential display_order values
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Main function
async function updateDropdownOrders() {
  try {
    console.log("=".repeat(80));
    console.log("UPDATING DROPDOWN OPTIONS WITH SEQUENTIAL DISPLAY_ORDER VALUES");
    console.log("=".repeat(80));
    
    // Get all questions with dropdown options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question')
      .eq('has_dropdown_options', true)
      .eq('status', 'Active');
    
    if (questionsError) {
      console.error("❌ Error fetching questions:", questionsError.message);
      throw questionsError;
    }
    
    console.log(\`Found \${questions.length} questions with dropdown options\`);
    
    // Process each question
    for (const question of questions) {
      console.log(\`\\nProcessing question: \${question.question} (\${question.id})\`);
      
      // Get all options for this question
      const { data: options, error: optionsError } = await supabase
        .from('dropdown_options')
        .select('id, option_text, display_order')
        .eq('question_id', question.id)
        .order('created_at, id');
      
      if (optionsError) {
        console.error(\`❌ Error fetching options for question \${question.id}:\`, optionsError.message);
        continue;
      }
      
      console.log(\`Found \${options.length} options\`);
      
      // Update each option with sequential display_order
      for (let i = 0; i < options.length; i++) {
        const newDisplayOrder = i + 1;
        console.log(\`  - Setting \${options[i].option_text} (\${options[i].id}) to display_order \${newDisplayOrder}\`);
        
        const { error: updateError } = await supabase
          .from('dropdown_options')
          .update({ display_order: newDisplayOrder })
          .eq('id', options[i].id);
        
        if (updateError) {
          console.error(\`❌ Error updating option \${options[i].id}:\`, updateError.message);
        }
      }
    }
    
    console.log("\\n✅ All dropdown options updated with sequential display_order values");
  } catch (error) {
    console.error("\\n❌ Error updating dropdown options:", error);
    process.exit(1);
  }
}

// Run the function
updateDropdownOrders()
  .then(() => {
    console.log("\\nUpdate script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\\nFatal error during update:", err);
    process.exit(1);
  });
`;
    
    fs.writeFileSync(updateScriptPath, updateScriptContent);
    console.log(`✅ Created update script at ${updateScriptPath}`);
    
    console.log("\n=".repeat(80));
    console.log("🎉 MINIMAL FIX APPLIED!");
    console.log("=".repeat(80));
    console.log("\nNext steps:");
    console.log("1. Restart your development server");
    console.log("2. Run the update script: node update-dropdown-orders.js");
    console.log("3. Test the reordering functionality in the UI");
    
  } catch (error) {
    console.error("\n❌ Error applying minimal fix:", error);
    process.exit(1);
  }
}

// Run the function
applyMinimalFix()
  .then(() => {
    console.log("\nMinimal fix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during minimal fix:", err);
    process.exit(1);
  });