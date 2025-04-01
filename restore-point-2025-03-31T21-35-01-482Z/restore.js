
// Restore script for dropdown option reordering fix
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
async function restoreFromBackup() {
  try {
    console.log("=".repeat(80));
    console.log("RESTORING FROM BACKUP");
    console.log("=".repeat(80));
    
    // Step 1: Restore code files
    console.log("\n1️⃣ Restoring code files...");
    
    const filesToRestore = [
      { source: path.join(__dirname, 'QuestionService.ts'), target: path.join(__dirname, '..', 'src', 'services', 'QuestionService.ts') },
      { source: path.join(__dirname, 'QuestionFormManager.tsx'), target: path.join(__dirname, '..', 'src', 'components', 'questions', 'QuestionFormManager.tsx') }
    ];
    
    for (const file of filesToRestore) {
      try {
        if (fs.existsSync(file.source)) {
          fs.copyFileSync(file.source, file.target);
          console.log(`✅ Restored ${path.basename(file.target)}`);
        } else {
          console.warn(`⚠️ Backup file not found: ${file.source}`);
        }
      } catch (err) {
        console.error(`❌ Error restoring ${file.target}:`, err.message);
      }
    }
    
    // Step 2: Restore dropdown options
    console.log("\n2️⃣ Restoring dropdown options...");
    
    try {
      const dropdownOptionsPath = path.join(__dirname, 'dropdown_options_backup.json');
      if (fs.existsSync(dropdownOptionsPath)) {
        const dropdownOptions = JSON.parse(fs.readFileSync(dropdownOptionsPath, 'utf8'));
        
        // First delete all existing options
        console.log("Deleting existing dropdown options...");
        const { error: deleteError } = await supabase
          .from('dropdown_options')
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
          console.error("❌ Error deleting existing dropdown options:", deleteError.message);
        } else {
          console.log("✅ Deleted existing dropdown options");
          
          // Then insert the backup data
          console.log(`Restoring ${dropdownOptions.length} dropdown options...`);
          
          // Insert in batches to avoid payload size limits
          const batchSize = 100;
          for (let i = 0; i < dropdownOptions.length; i += batchSize) {
            const batch = dropdownOptions.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from('dropdown_options')
              .insert(batch);
            
            if (insertError) {
              console.error(`❌ Error restoring dropdown options batch ${i/batchSize + 1}:`, insertError.message);
            } else {
              console.log(`✅ Restored dropdown options batch ${i/batchSize + 1} (${batch.length} items)`);
            }
          }
        }
      } else {
        console.warn("⚠️ Dropdown options backup file not found");
      }
    } catch (err) {
      console.error("❌ Error restoring dropdown options:", err.message);
    }
    
    console.log("\n=".repeat(80));
    console.log("🎉 RESTORE COMPLETED!");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Error during restore:", error);
    process.exit(1);
  }
}

// Run the function
restoreFromBackup()
  .then(() => {
    console.log("\nRestore script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during restore:", err);
    process.exit(1);
  });
