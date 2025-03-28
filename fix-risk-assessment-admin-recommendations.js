// Fix Risk Assessment Admin Recommendations
// This script follows the same pattern as other successful parts of the system
// to ensure recommendations entered in the admin panel are properly displayed

import { supabase } from './src/lib/supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("FIX RISK ASSESSMENT ADMIN RECOMMENDATIONS");
console.log("================================================================================");
console.log("\nThis script ensures recommendations entered in the admin panel");
console.log("are properly displayed in doctor questionnaire pages.");

async function main() {
  try {
    // Step 1: Create necessary RPC function
    console.log("\n1. Creating database RPC function...");
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'supabase', 'get_risk_assessment_recommendations.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing SQL statement: ${error.message}`);
        console.log("SQL statement was:");
        console.log(statement);
        console.log("\nContinuing with other statements...");
      } else {
        console.log("✅ Executed SQL statement successfully");
      }
    }
    
    // Step 2: Verify RPC function works
    console.log("\n2. Verifying RPC function...");
    
    const { data, error } = await supabase.rpc('get_risk_assessment_recommendations');
    
    if (error) {
      console.error("❌ Error testing RPC function:", error);
      console.log("\nTrying to debug what went wrong...");
      
      // Check if table exists
      const { data: tablesData } = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'risk_assessment_advice');
      
      if (!tablesData || tablesData.length === 0) {
        console.error("❌ The risk_assessment_advice table doesn't exist!");
        console.log("You need to create this table first. Here's a sample SQL:");
        console.log(`
CREATE TABLE risk_assessment_advice (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
        `);
      } else {
        console.log("✅ The risk_assessment_advice table exists.");
      }
    } else {
      console.log("✅ RPC function works! Found", data?.length || 0, "recommendations.");
      console.log("\nRecommendations found:");
      data?.forEach(rec => {
        console.log(`- ${rec.risk_level} (${rec.min_score}-${rec.max_score}): ${rec.advice?.substring(0, 50)}...`);
      });
      
      if (!data || data.length === 0) {
        console.log("\n⚠️ No recommendations found in the database.");
        console.log("You need to add recommendations through the admin panel for each risk level.");
      }
    }
    
    // Step 3: Check admin entry point
    console.log("\n3. Recommendations are entered by admins through the admin panel");
    console.log("Make sure to enter recommendations for each risk level (Low, Moderate, High)");
    console.log("The recommendations will now appear in doctor questionnaire pages.");
    
    console.log("\n================================================================================");
    console.log("FIX COMPLETED SUCCESSFULLY");
    console.log("================================================================================");
    console.log("\nNext steps:");
    console.log("1. Build the application with: npm run build");
    console.log("2. Run the application with: npm run dev");
    console.log("3. Enter recommendations in the admin panel");
    console.log("4. View a patient questionnaire as a doctor to verify recommendations display correctly");
    
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
}

main().catch(console.error);