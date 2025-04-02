/**
 * Script to check and fix the profiles table structure
 * 
 * This script addresses the 500 error when fetching profiles by:
 * 1. Checking if the profiles table exists
 * 2. Checking if the is_suspended column exists
 * 3. Adding the is_suspended column if it doesn't exist
 * 4. Setting default values for the is_suspended column
 * 
 * Run this script with:
 * node fix-profiles-table.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing.');
  process.exit(1);
}

// Create Supabase client with service role key if available, otherwise use anon key
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Check if a table exists in the database
 */
async function checkTableExists(tableName) {
  try {
    // Use system tables to check if the table exists
    const { data, error } = await supabase.rpc('check_table_exists', {
      table_name: tableName
    });

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error.message);
      
      // If the RPC function doesn't exist, try a direct query
      console.log('Trying alternative method to check table existence...');
      
      // Try to query the table with a limit of 0 to see if it exists
      const { error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (queryError && queryError.code === '42P01') {
        // Error code 42P01 means the table doesn't exist
        console.log(`Table ${tableName} does not exist.`);
        return false;
      } else if (!queryError) {
        console.log(`Table ${tableName} exists.`);
        return true;
      } else {
        console.error('Error with alternative check:', queryError.message);
        return null; // Unknown status
      }
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error checking table existence:', error);
    return null; // Unknown status
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName, columnName) {
  try {
    // Use system tables to check if the column exists
    const { data, error } = await supabase.rpc('check_column_exists', {
      table_name: tableName,
      column_name: columnName
    });

    if (error) {
      console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error.message);
      
      // If the RPC function doesn't exist, try a direct query
      console.log('Trying alternative method to check column existence...');
      
      // Try to query the specific column to see if it exists
      const { error: queryError } = await supabase
        .from(tableName)
        .select(columnName)
        .limit(0);
      
      if (queryError && queryError.message.includes(`column "${columnName}" does not exist`)) {
        console.log(`Column ${columnName} does not exist in table ${tableName}.`);
        return false;
      } else if (!queryError) {
        console.log(`Column ${columnName} exists in table ${tableName}.`);
        return true;
      } else {
        console.error('Error with alternative check:', queryError.message);
        return null; // Unknown status
      }
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error checking column existence:', error);
    return null; // Unknown status
  }
}

/**
 * Add the is_suspended column to the profiles table
 */
async function addIsSuspendedColumn() {
  try {
    console.log('Adding is_suspended column to profiles table...');
    
    // Execute SQL to add the column
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
      `
    });

    if (error) {
      console.error('Error adding is_suspended column:', error.message);
      
      // If the RPC function doesn't exist, try using Supabase's REST API
      console.log('Trying alternative method to add column...');
      
      // Unfortunately, Supabase JS client doesn't support direct SQL execution
      // We'll need to use the REST API or another method
      console.error('Cannot add column without direct SQL access or RPC function.');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
      `);
      
      return false;
    }
    
    console.log('is_suspended column added successfully.');
    return true;
  } catch (error) {
    console.error('Unexpected error adding is_suspended column:', error);
    return false;
  }
}

/**
 * Create the profiles table if it doesn't exist
 */
async function createProfilesTable() {
  try {
    console.log('Creating profiles table...');
    
    // Execute SQL to create the table
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT,
          name TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          is_doctor BOOLEAN DEFAULT FALSE,
          is_suspended BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('Error creating profiles table:', error.message);
      
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT,
          name TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          is_doctor BOOLEAN DEFAULT FALSE,
          is_suspended BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      return false;
    }
    
    console.log('Profiles table created successfully.');
    return true;
  } catch (error) {
    console.error('Unexpected error creating profiles table:', error);
    return false;
  }
}

/**
 * Main function to check and fix the profiles table
 */
async function fixProfilesTable() {
  console.log('=== Starting Profiles Table Fix ===');
  
  // Check if the profiles table exists
  const tableExists = await checkTableExists('profiles');
  
  if (tableExists === null) {
    console.error('Could not determine if profiles table exists. Exiting.');
    return;
  }
  
  if (!tableExists) {
    console.log('Profiles table does not exist. Creating it...');
    const created = await createProfilesTable();
    
    if (!created) {
      console.error('Failed to create profiles table. Exiting.');
      return;
    }
  }
  
  // Check if the is_suspended column exists
  const columnExists = await checkColumnExists('profiles', 'is_suspended');
  
  if (columnExists === null) {
    console.error('Could not determine if is_suspended column exists. Exiting.');
    return;
  }
  
  if (!columnExists) {
    console.log('is_suspended column does not exist. Adding it...');
    const added = await addIsSuspendedColumn();
    
    if (!added) {
      console.error('Failed to add is_suspended column. Exiting.');
      return;
    }
  }
  
  console.log('=== Profiles Table Fix Completed ===');
  console.log('The profiles table now has the is_suspended column.');
  console.log('This should resolve the 500 error when fetching profiles.');
}

// Run the fix
fixProfilesTable().catch(error => {
  console.error('Script execution error:', error);
});