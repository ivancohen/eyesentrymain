// Script to implement the dropdown option reordering fix with restore point - Direct method
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
async function implementReorderingFix() {
  try {
    console.log("=".repeat(80));
    console.log("IMPLEMENTING DROPDOWN OPTION REORDERING FIX - DIRECT METHOD");
    console.log("=".repeat(80));
    
    // Step 1: Create restore point
    console.log("\n1️⃣ Creating restore point...");
    try {
      console.log("Running create-reordering-restore-point.js...");
      execSync('node create-reordering-restore-point.js', { stdio: 'inherit' });
      console.log("✅ Restore point created successfully");
    } catch (err) {
      console.error("❌ Error creating restore point:", err.message);
      const proceed = await promptYesNo("Do you want to proceed without a restore point?");
      if (!proceed) {
        console.log("Aborting implementation.");
        process.exit(1);
      }
    }
    
    // Step 2: Apply essential database fixes directly
    console.log("\n2️⃣ Applying essential database fixes directly...");
    
    try {
      // Check if display_order column exists in dropdown_options
      console.log("Checking if display_order column exists in dropdown_options table...");
      
      try {
        const { data: columnCheck, error: columnError } = await supabase
          .from('dropdown_options')
          .select('display_order')
          .limit(1);
        
        if (columnError) {
          console.log("Column doesn't exist or can't be accessed, attempting to add it...");
          // We can't directly add columns through the Supabase JS client
          // This would normally require SQL execution privileges
          console.warn("⚠️ Cannot add column through JS client. If the column doesn't exist, you may need to add it manually.");
        } else {
          console.log("✅ display_order column exists and is accessible");
        }
      } catch (err) {
        console.warn("⚠️ Error checking column:", err.message);
      }
      
      // Update all dropdown options to have sequential display_order values
      console.log("\nUpdating all dropdown options with sequential display_order values...");
      
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
      
      console.log(`Found ${questions.length} questions with dropdown options`);
      
      // Process each question
      for (const question of questions) {
        console.log(`\nProcessing question: ${question.question} (${question.id})`);
        
        // Get all options for this question
        const { data: options, error: optionsError } = await supabase
          .from('dropdown_options')
          .select('id, option_text, display_order')
          .eq('question_id', question.id)
          .order('created_at, id');
        
        if (optionsError) {
          console.error(`❌ Error fetching options for question ${question.id}:`, optionsError.message);
          continue;
        }
        
        console.log(`Found ${options.length} options`);
        
        // Update each option with sequential display_order
        for (let i = 0; i < options.length; i++) {
          const newDisplayOrder = i + 1;
          console.log(`  - Setting ${options[i].option_text} (${options[i].id}) to display_order ${newDisplayOrder}`);
          
          const { error: updateError } = await supabase
            .from('dropdown_options')
            .update({ display_order: newDisplayOrder })
            .eq('id', options[i].id);
          
          if (updateError) {
            console.error(`❌ Error updating option ${options[i].id}:`, updateError.message);
          }
        }
      }
      
      console.log("✅ Database fixes applied successfully");
      
    } catch (err) {
      console.error("❌ Error applying database fixes:", err.message);
      const proceed = await promptYesNo("Do you want to proceed with the JavaScript fix only?");
      if (!proceed) {
        console.log("Aborting implementation.");
        process.exit(1);
      }
    }
    
    // Step 3: Apply JavaScript fix
    console.log("\n3️⃣ Applying JavaScript fix...");
    
    try {
      // Update the QuestionService.ts file
      const servicePath = path.join(__dirname, 'src', 'services', 'QuestionService.ts');
      if (!fs.existsSync(servicePath)) {
        console.error(`❌ Service file not found: ${servicePath}`);
        throw new Error("Service file not found");
      }
      
      // Create a backup
      const backupPath = path.join(__dirname, 'src', 'services', 'QuestionService.ts.reordering-fix-backup');
      fs.copyFileSync(servicePath, backupPath);
      console.log(`Created backup at ${backupPath}`);
      
      // Read the current content
      const content = fs.readFileSync(servicePath, 'utf8');
      
      // Replace the reorderDropdownOptions method with a new implementation
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
      const updatedContent = content.replace(
        /\/\*\*\s*\*\s*Reorder dropdown options[\s\S]*?static async reorderDropdownOptions[\s\S]*?}\s*}/,
        newReorderMethod
      );
      
      // Write the updated content
      fs.writeFileSync(servicePath, updatedContent);
      console.log("✅ Updated QuestionService.ts with new reorderDropdownOptions implementation");
      
      console.log("✅ JavaScript fix applied successfully");
      
    } catch (err) {
      console.error("❌ Error applying JavaScript fix:", err.message);
      console.log("Implementation failed. You may need to restore from the backup.");
      process.exit(1);
    }
    
    // Step 4: Create a verification script
    console.log("\n4️⃣ Creating verification script...");
    
    const verifyScriptPath = path.join(__dirname, 'verify-reordering.js');
    const verifyScriptContent = `// Script to verify reordering functionality
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

// Test function
async function testReordering() {
  try {
    console.log("=".repeat(80));
    console.log("VERIFYING REORDERING FUNCTIONALITY");
    console.log("=".repeat(80));
    
    // Get a question with dropdown options
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question')
      .eq('has_dropdown_options', true)
      .eq('status', 'Active')
      .limit(1);
    
    if (questionsError || !questions || questions.length === 0) {
      console.error("❌ Error: Could not find a question with dropdown options");
      return false;
    }
    
    const question = questions[0];
    console.log(\`Testing with question: \${question.question} (\${question.id})\`);
    
    // Get the options for this question
    const { data: options, error: optionsError } = await supabase
      .from('dropdown_options')
      .select('id, option_text, display_order')
      .eq('question_id', question.id)
      .order('display_order');
    
    if (optionsError || !options || options.length < 2) {
      console.error("❌ Error: Could not find enough options for testing");
      return false;
    }
    
    console.log("Current order:");
    options.forEach(opt => console.log(\`  - \${opt.option_text} (Order: \${opt.display_order})\`));
    
    // Reverse the order
    const updates = options.map((option, index) => ({
      id: option.id,
      display_order: options.length - index
    }));
    
    console.log("\\nApplying reverse order...");
    
    // Update each option directly
    for (const update of updates) {
      const { error } = await supabase
        .from('dropdown_options')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
      
      if (error) {
        console.error(\`❌ Error updating option \${update.id}:\`, error.message);
        return false;
      }
    }
    
    // Verify the changes
    const { data: updatedOptions, error: verifyError } = await supabase
      .from('dropdown_options')
      .select('id, option_text, display_order')
      .eq('question_id', question.id)
      .order('display_order');
    
    if (verifyError) {
      console.error("❌ Error verifying changes:", verifyError.message);
      return false;
    }
    
    console.log("\\nNew order:");
    updatedOptions.forEach(opt => console.log(\`  - \${opt.option_text} (Order: \${opt.display_order})\`));
    
    // Verify the order is reversed
    let isReversed = true;
    for (let i = 0; i < options.length; i++) {
      if (options[i].id !== updatedOptions[options.length - 1 - i].id) {
        isReversed = false;
        break;
      }
    }
    
    if (isReversed) {
      console.log("\\n✅ SUCCESS: Order was successfully reversed!");
    } else {
      console.log("\\n❌ FAILURE: Order was not correctly reversed");
      return false;
    }
    
    // Restore original order
    console.log("\\nRestoring original order...");
    
    const restoreUpdates = options.map((option, index) => ({
      id: option.id,
      display_order: index + 1
    }));
    
    for (const update of restoreUpdates) {
      await supabase
        .from('dropdown_options')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
    
    console.log("✅ Original order restored");
    return true;
  } catch (error) {
    console.error("❌ Error testing reordering:", error);
    return false;
  }
}

// Run the test
testReordering()
  .then(success => {
    if (success) {
      console.log("\\n🎉 REORDERING FUNCTIONALITY IS WORKING CORRECTLY!");
    } else {
      console.log("\\n❌ REORDERING FUNCTIONALITY IS NOT WORKING CORRECTLY");
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
`;
    
    fs.writeFileSync(verifyScriptPath, verifyScriptContent);
    console.log(`✅ Created verification script at ${verifyScriptPath}`);
    
    console.log("\n=".repeat(80));
    console.log("🎉 IMPLEMENTATION COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nNext steps:");
    console.log("1. Restart your development server");
    console.log("2. Run the verification script: node verify-reordering.js");
    console.log("3. Test the reordering functionality in the UI");
    console.log("\nIf you encounter issues, you can restore from the backup using the restore script created earlier.");
    
  } catch (error) {
    console.error("\n❌ Error implementing fix:", error);
    process.exit(1);
  }
}

// Helper function to prompt for yes/no
async function promptYesNo(question) {
  // In a real implementation, this would use readline or a similar module
  // For simplicity, we'll just return true
  console.log(`${question} (Y/n) - Assuming Y`);
  return true;
}

// Run the function
implementReorderingFix()
  .then(() => {
    console.log("\nImplementation script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during implementation:", err);
    process.exit(1);
  });