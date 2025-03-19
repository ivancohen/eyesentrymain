// Script to run the admin fix SQL directly
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase credentials from the EyeSentry project
const supabaseUrl = 'https://gebojeuaeaqmdfrxptqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYm9qZXVhZWFxbWRmcnhwdHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDQ2NDEsImV4cCI6MjA1NzEyMDY0MX0.Fpzp_tD07GXGNvf2k7HLLOe1-UHLU_jOb-fKwZvn6OM';

// Read the SQL file
const sqlFilePath = path.join(process.cwd(), 'supabase', 'emergency_admin_fix.sql');
console.log(`Reading SQL file: ${sqlFilePath}`);
let sqlScript;

try {
  sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
  console.log(`SQL file loaded successfully (${sqlScript.length} bytes)`);
} catch (error) {
  console.error(`Error reading SQL file: ${error.message}`);
  process.exit(1);
}

// Split the SQL script into individual statements
// This is a simple approach - might not work for complex SQL with nested blocks
const statements = sqlScript
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);

async function executeSQL() {
  // Initialize the Supabase client
  console.log(`Connecting to Supabase: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // First check if we can authenticate
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error(`Authentication error: ${authError.message}`);
      // Try to continue anyway - some queries might work with anon key
    } else {
      console.log(`Authentication successful: ${authData.session ? 'Session found' : 'No session'}`);
    }
  } catch (error) {
    console.error(`Error checking authentication: ${error.message}`);
  }

  // Check admin status for ivan.s.cohen@gmail.com
  console.log(`\nCHECKING ADMIN STATUS FOR ivan.s.cohen@gmail.com`);
  
  try {
    const { data: diagData, error: diagError } = await supabase.rpc('check_admin_status', {
      admin_email: 'ivan.s.cohen@gmail.com'
    });
    
    if (diagError) {
      console.error(`Error checking admin status: ${diagError.message}`);
      console.log('The check_admin_status function might not exist yet');
    } else {
      console.log(`Admin status check result: ${diagData}`);
    }
  } catch (error) {
    console.error(`Error in admin status check: ${error.message}`);
  }

  // Execute a simple test query
  console.log(`\nRunning a test query...`);
  try {
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, email, is_admin')
      .eq('email', 'ivan.s.cohen@gmail.com')
      .limit(1);
    
    if (testError) {
      console.error(`Error in test query: ${testError.message}`);
      console.log('This confirms there are RLS policy issues');
    } else {
      console.log('Test query successful!');
      console.log('User data:', testData);
    }
  } catch (error) {
    console.error(`Unexpected error in test query: ${error.message}`);
  }

  // Due to RLS restrictions, we'll likely need admin credentials to run the SQL
  console.log(`\nNOTICE: To run the full SQL script, you should:`);
  console.log(`1. Login to the Supabase Dashboard: https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf`);
  console.log(`2. Go to SQL Editor and paste the contents of supabase/emergency_admin_fix.sql`);
  console.log(`3. Run the script to fix the admin access issues`);
  console.log(`\nAlternatively, log in to the application with ivan.s.cohen@gmail.com`);
  console.log(`and use the emergency admin service by modifying the imports:`);
  console.log(`import { EmergencyAdminService as AdminService } from "@/services/EmergencyAdminService";`);
}

// Run the SQL execution
executeSQL().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
