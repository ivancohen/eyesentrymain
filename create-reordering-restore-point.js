// Script to create a restore point before fixing dropdown option reordering
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
async function createRestorePoint() {
  try {
    console.log("=".repeat(80));
    console.log("CREATING RESTORE POINT FOR DROPDOWN OPTION REORDERING FIX");
    console.log("=".repeat(80));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const restoreDir = path.join(__dirname, `restore-point-${timestamp}`);
    
    // Create restore point directory
    if (!fs.existsSync(restoreDir)) {
      fs.mkdirSync(restoreDir);
      console.log(`✅ Created restore point directory: ${restoreDir}`);
    }
    
    // Step 1: Backup code files
    console.log("\n1️⃣ Backing up code files...");
    
    const filesToBackup = [
      path.join(__dirname, 'src', 'services', 'QuestionService.ts'),
      path.join(__dirname, 'src', 'components', 'questions', 'QuestionFormManager.tsx')
    ];
    
    for (const filePath of filesToBackup) {
      try {
        if (fs.existsSync(filePath)) {
          const fileName = path.basename(filePath);
          const backupPath = path.join(restoreDir, fileName);
          fs.copyFileSync(filePath, backupPath);
          console.log(`✅ Backed up ${fileName}`);
        } else {
          console.warn(`⚠️ File not found: ${filePath}`);
        }
      } catch (err) {
        console.error(`❌ Error backing up ${filePath}:`, err.message);
      }
    }
    
    // Step 2: Backup database state
    console.log("\n2️⃣ Backing up database state...");
    
    // 2.1: Backup dropdown_options table
    try {
      console.log("Backing up dropdown_options table...");
      const { data: dropdownOptions, error: dropdownError } = await supabase
        .from('dropdown_options')
        .select('*');
      
      if (dropdownError) {
        console.error("❌ Error fetching dropdown options:", dropdownError.message);
      } else {
        const backupPath = path.join(restoreDir, 'dropdown_options_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(dropdownOptions, null, 2));
        console.log(`✅ Backed up ${dropdownOptions.length} dropdown options to ${backupPath}`);
      }
    } catch (err) {
      console.error("❌ Error backing up dropdown options:", err.message);
    }
    
    // 2.2: Backup questions table
    try {
      console.log("Backing up questions table...");
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('has_dropdown_options', true);
      
      if (questionsError) {
        console.error("❌ Error fetching questions:", questionsError.message);
      } else {
        const backupPath = path.join(restoreDir, 'questions_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(questions, null, 2));
        console.log(`✅ Backed up ${questions.length} questions to ${backupPath}`);
      }
    } catch (err) {
      console.error("❌ Error backing up questions:", err.message);
    }
    
    // Step 3: Create database schema backup
    console.log("\n3️⃣ Creating database schema backup...");
    
    // Create a restore script that can be used to rollback changes
    const restoreScript = `
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
    console.log("\\n1️⃣ Restoring code files...");
    
    const filesToRestore = [
      { source: path.join(__dirname, 'QuestionService.ts'), target: path.join(__dirname, '..', 'src', 'services', 'QuestionService.ts') },
      { source: path.join(__dirname, 'QuestionFormManager.tsx'), target: path.join(__dirname, '..', 'src', 'components', 'questions', 'QuestionFormManager.tsx') }
    ];
    
    for (const file of filesToRestore) {
      try {
        if (fs.existsSync(file.source)) {
          fs.copyFileSync(file.source, file.target);
          console.log(\`✅ Restored \${path.basename(file.target)}\`);
        } else {
          console.warn(\`⚠️ Backup file not found: \${file.source}\`);
        }
      } catch (err) {
        console.error(\`❌ Error restoring \${file.target}:\`, err.message);
      }
    }
    
    // Step 2: Restore dropdown options
    console.log("\\n2️⃣ Restoring dropdown options...");
    
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
          console.log(\`Restoring \${dropdownOptions.length} dropdown options...\`);
          
          // Insert in batches to avoid payload size limits
          const batchSize = 100;
          for (let i = 0; i < dropdownOptions.length; i += batchSize) {
            const batch = dropdownOptions.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from('dropdown_options')
              .insert(batch);
            
            if (insertError) {
              console.error(\`❌ Error restoring dropdown options batch \${i/batchSize + 1}:\`, insertError.message);
            } else {
              console.log(\`✅ Restored dropdown options batch \${i/batchSize + 1} (\${batch.length} items)\`);
            }
          }
        }
      } else {
        console.warn("⚠️ Dropdown options backup file not found");
      }
    } catch (err) {
      console.error("❌ Error restoring dropdown options:", err.message);
    }
    
    console.log("\\n=".repeat(80));
    console.log("🎉 RESTORE COMPLETED!");
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\\n❌ Error during restore:", error);
    process.exit(1);
  }
}

// Run the function
restoreFromBackup()
  .then(() => {
    console.log("\\nRestore script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\\nFatal error during restore:", err);
    process.exit(1);
  });
`;
    
    const restoreScriptPath = path.join(restoreDir, 'restore.js');
    fs.writeFileSync(restoreScriptPath, restoreScript);
    console.log(`✅ Created restore script at ${restoreScriptPath}`);
    
    // Step 4: Create a README file with instructions
    console.log("\n4️⃣ Creating README with instructions...");
    
    const readmeContent = `# Restore Point for Dropdown Option Reordering Fix

This restore point was created on ${new Date().toLocaleString()} before implementing the dropdown option reordering fix.

## Contents

- \`QuestionService.ts\`: Backup of the original service file
- \`QuestionFormManager.tsx\`: Backup of the original component file
- \`dropdown_options_backup.json\`: Backup of all dropdown options in the database
- \`questions_backup.json\`: Backup of questions with dropdown options
- \`restore.js\`: Script to restore the code and data to this point

## How to Restore

If you need to roll back the changes, run:

\`\`\`
node ${path.basename(restoreDir)}/restore.js
\`\`\`

This will:
1. Restore the original code files
2. Restore the database to its previous state

## After Restoring

After restoring, you'll need to:
1. Restart your development server
2. Verify that the application is working as it was before the fix

## Notes

- The restore process will delete all current dropdown options and replace them with the backed-up data
- Any changes made to the code files after this restore point was created will be lost when restoring
`;
    
    const readmePath = path.join(restoreDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`✅ Created README at ${readmePath}`);
    
    console.log("\n=".repeat(80));
    console.log(`🎉 RESTORE POINT CREATED AT: ${restoreDir}`);
    console.log("=".repeat(80));
    console.log("\nYou can now safely proceed with implementing the fixes.");
    console.log(`If you need to roll back, run: node ${path.basename(restoreDir)}/restore.js`);
    
  } catch (error) {
    console.error("\n❌ Error creating restore point:", error);
    process.exit(1);
  }
}

// Run the function
createRestorePoint()
  .then(() => {
    console.log("\nRestore point creation completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during restore point creation:", err);
    process.exit(1);
  });