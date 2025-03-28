// Script to fix risk assessment score saving permissions
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixRiskScoreSaving() {
  console.log("================================================================================");
  console.log("FIXING RISK ASSESSMENT SCORE SAVING PERMISSIONS");
  console.log("================================================================================");

  try {
    // Load the SQL file content
    const sqlFilePath = path.join(__dirname, 'fix-risk-score-saving.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log(`Loaded SQL file (${sqlContent.length} characters)`);
    console.log("Executing SQL to fix risk assessment table permissions...");
    
    // Execute the SQL using a stored procedure or RPC
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_statement: sqlContent
    });
    
    if (error) {
      console.error("Error executing SQL with RPC:", error);
      
      // Try alternative approach - using individual statements
      console.log("Trying alternative approach - executing SQL directly...");
      
      // Direct execution through fetch API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          sql_statement: sqlContent
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SQL execution failed: ${JSON.stringify(errorData)}`);
      }
      
      console.log("✅ SQL executed successfully via direct API call");
    } else {
      console.log("✅ SQL executed successfully via RPC");
      console.log("Result:", data);
    }
    
    console.log("\n================================================================================");
    console.log("RISK ASSESSMENT SCORE SAVING FIXED SUCCESSFULLY");
    console.log("================================================================================");
    
    console.log("\nThe following changes have been made:");
    console.log("1. Fixed Row Level Security policies for risk_assessment_advice table");
    console.log("2. Added policies to allow authenticated users to insert and update records");
    console.log("3. Inserted default risk assessment advice data");
    
  } catch (error) {
    console.error("Error fixing risk score saving:", error);
    process.exit(1);
  }
}

// Execute the fix
fixRiskScoreSaving();