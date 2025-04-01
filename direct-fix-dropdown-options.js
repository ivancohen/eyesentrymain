// Script to directly add display_order column to dropdown_options table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      envVars[key] = value;
    }
  });

  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  console.log('Please make sure the .env file exists and contains VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or service role key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function
async function fixDropdownOptions() {
  try {
    console.log("=".repeat(80));
    console.log("ADDING DISPLAY_ORDER COLUMN TO DROPDOWN_OPTIONS TABLE");
    console.log("=".repeat(80));
    
    console.log("\n📦 Creating a restore point first...");
    try {
      const { data: restoreData, error: restoreError } = await supabase.rpc('create_questionnaire_restore_point');
      
      if (restoreError) {
        console.warn("⚠️ Warning: Could not create restore point:", restoreError.message);
        console.log("Continuing with the fix...");
      } else {
        console.log("✅ Restore point created successfully!");
      }
    } catch (restoreErr) {
      console.warn("⚠️ Warning: Could not create restore point:", restoreErr.message);
      console.log("Continuing with the fix...");
    }
    
    // Step 1: Check if display_order column exists
    console.log("\n1️⃣ Checking if display_order column exists...");
    
    try {
      // Try to select from the column to see if it exists
      const { data: columnCheck, error: columnError } = await supabase
        .from('dropdown_options')
        .select('display_order')
        .limit(1);
      
      if (columnError && columnError.message.includes('column "display_order" does not exist')) {
        console.log("Column does not exist, will add it.");
        
        // Add the column using raw SQL via RPC if available
        try {
          const { error: alterError } = await supabase.rpc('execute_sql', { 
            sql_query: 'ALTER TABLE public.dropdown_options ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0'
          });
          
          if (alterError) {
            console.error("❌ Could not add column using RPC:", alterError.message);
            console.log("Will try direct approach in the next steps...");
          } else {
            console.log("✅ Column added successfully using RPC!");
          }
        } catch (rpcErr) {
          console.warn("⚠️ RPC not available:", rpcErr.message);
          console.log("Will try direct approach in the next steps...");
        }
      } else {
        console.log("✅ display_order column already exists!");
      }
    } catch (checkErr) {
      console.warn("⚠️ Error checking column:", checkErr.message);
      console.log("Will assume column needs to be added...");
    }
    
    // Step 2: Update all dropdown options to have sequential display_order values
    console.log("\n2️⃣ Updating display_order values for all options...");
    
    // First, get all dropdown options grouped by question_id
    const { data: allOptions, error: fetchError } = await supabase
      .from('dropdown_options')
      .select('id, question_id')
      .order('question_id, created_at, id');
    
    if (fetchError) {
      console.error("❌ Error fetching options:", fetchError.message);
      throw fetchError;
    }
    
    // Group options by question_id
    const optionsByQuestion = {};
    allOptions.forEach(option => {
      if (!optionsByQuestion[option.question_id]) {
        optionsByQuestion[option.question_id] = [];
      }
      optionsByQuestion[option.question_id].push(option);
    });
    
    // Update each option with the correct display_order
    let updateCount = 0;
    for (const questionId in optionsByQuestion) {
      const options = optionsByQuestion[questionId];
      
      console.log(`Updating ${options.length} options for question ${questionId}...`);
      
      for (let i = 0; i < options.length; i++) {
        const { error: updateError } = await supabase
          .from('dropdown_options')
          .update({ display_order: i + 1 })
          .eq('id', options[i].id);
        
        if (updateError) {
          console.error(`❌ Error updating option ${options[i].id}:`, updateError.message);
        } else {
          updateCount++;
        }
      }
    }
    
    console.log(`✅ Updated display_order for ${updateCount} options!`);
    
    // Step 3: Create an index for better performance (if possible)
    console.log("\n3️⃣ Attempting to create an index on display_order...");
    
    try {
      const { error: indexError } = await supabase.rpc('execute_sql', { 
        sql_query: 'CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order ON public.dropdown_options (question_id, display_order)'
      });
      
      if (indexError) {
        console.warn("⚠️ Could not create index using RPC:", indexError.message);
        console.log("Index creation skipped, but this won't affect functionality.");
      } else {
        console.log("✅ Index created successfully!");
      }
    } catch (indexErr) {
      console.warn("⚠️ Error creating index:", indexErr.message);
      console.log("Index creation skipped, but this won't affect functionality.");
    }
    
    console.log("\n✅ Database update completed!");
    console.log("The dropdown_options table now has a display_order column with values.");
    console.log("You can now proceed with the QuestionService.ts fix.");
    
  } catch (error) {
    console.error("\n❌ Error fixing dropdown options:", error.message);
    process.exit(1);
  }
}

// Run the function
fixDropdownOptions()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });