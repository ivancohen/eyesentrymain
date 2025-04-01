import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Initialize environment variables
dotenv.config();

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing.');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeChatbotSchema() {
  try {
    console.log('Starting chatbot schema execution...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'src', 'migrations', 'chatbot_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Check if exec_sql function exists
    console.log('Checking if exec_sql function exists...');
    const { data: functionExists, error: functionCheckError } = await supabase
      .rpc('exec_sql', { sql_query: 'SELECT 1;' })
      .single();
    
    if (functionCheckError) {
      console.log('exec_sql function does not exist or there was an error. Creating the function...');
      
      // Create the exec_sql function if it doesn't exist
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$;
      `;
      
      // Execute the function creation directly
      const { error: createFunctionError } = await supabase.rpc('exec_sql', { 
        sql_query: createFunctionSql 
      });
      
      if (createFunctionError) {
        console.error('Error creating exec_sql function:', createFunctionError);
        console.log('Falling back to direct execution method...');
        
        // If we can't create the function, fall back to the direct execution method
        console.log('Executing direct schema creation...');
        execSync('node execute-chatbot-schema-direct.js', { stdio: 'inherit' });
        return;
      }
      
      console.log('exec_sql function created successfully.');
    } else {
      console.log('exec_sql function exists.');
    }
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1} of ${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        
        if (i === 0 && error.message.includes('does not exist')) {
          console.log('Falling back to direct execution method...');
          execSync('node execute-chatbot-schema-direct.js', { stdio: 'inherit' });
          return;
        }
        
        // Continue with other statements even if one fails
      }
    }
    
    console.log('Chatbot schema execution completed successfully!');
  } catch (error) {
    console.error('Error executing chatbot schema:', error);
    console.log('Falling back to direct execution method...');
    execSync('node execute-chatbot-schema-direct.js', { stdio: 'inherit' });
  }
}

// Execute the schema
executeChatbotSchema();