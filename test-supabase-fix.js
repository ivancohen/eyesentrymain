/**
 * Test Script for Supabase 500 Error Fix
 * 
 * This script tests the error handling improvements for Supabase profile fetching.
 * It simulates various error scenarios and verifies that the application can handle them gracefully.
 * 
 * Run this script with:
 * node test-supabase-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk'; // For colored console output

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing.'));
  console.error('Make sure you have a .env file with these variables or they are set in your environment.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock implementation of safeQueryWithFallback for testing
async function safeQueryWithFallback(queryFn, fallbackData, maxRetries = 2, silent = false) {
  console.log(chalk.blue('Testing safeQueryWithFallback...'));
  console.log(`Max retries: ${maxRetries}, Silent mode: ${silent}`);
  
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      console.log(chalk.yellow(`Attempt ${retries + 1}/${maxRetries + 1}...`));
      
      // Execute the query
      const query = queryFn();
      const { data, error } = await query;
      
      if (error) {
        console.log(chalk.red(`Error encountered: ${error.message}`));
        
        // For server errors (500), retry after a delay
        if (error.status >= 500) {
          retries++;
          if (retries <= maxRetries) {
            const delay = Math.pow(2, retries - 1) * 1000;
            console.log(chalk.yellow(`Server error, retrying in ${delay}ms...`));
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Return fallback data for any error after retries
        console.log(chalk.yellow(`All retries failed or non-retryable error. Using fallback data.`));
        return fallbackData;
      }
      
      // Success
      console.log(chalk.green('Query successful!'));
      return data || fallbackData;
    } catch (error) {
      console.log(chalk.red(`Unexpected error: ${error.message}`));
      retries++;
      
      if (retries <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }
  
  // All retries failed
  console.log(chalk.yellow(`All retries exhausted. Using fallback data.`));
  return fallbackData;
}

// Test functions
async function testProfileFetching() {
  console.log(chalk.green('\n=== Testing Profile Fetching ==='));
  
  try {
    // Test 1: Normal profile fetching
    console.log(chalk.blue('\nTest 1: Normal profile fetching'));
    const result1 = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .limit(1),
      []
    );
    console.log(`Result: ${result1.length > 0 ? 'Success' : 'No profiles found'}`);
    
    // Test 2: Simulated 500 error (invalid table name)
    console.log(chalk.blue('\nTest 2: Simulated server error (invalid table)'));
    const result2 = await safeQueryWithFallback(
      () => supabase
        .from('nonexistent_table') // This should cause an error
        .select('*'),
      [{ id: 'fallback-id', name: 'Fallback User' }]
    );
    console.log(`Result: ${JSON.stringify(result2)}`);
    
    // Test 3: Malformed query
    console.log(chalk.blue('\nTest 3: Malformed query'));
    const result3 = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('invalid.column'), // This should cause an error
      [{ id: 'fallback-id', name: 'Fallback User' }]
    );
    console.log(`Result: ${JSON.stringify(result3)}`);
    
    // Test 4: Timeout simulation
    console.log(chalk.blue('\nTest 4: Timeout simulation'));
    const result4 = await safeQueryWithFallback(
      () => {
        // Create a promise that will timeout
        return {
          then: (resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Request timed out'));
            }, 100);
          }
        };
      },
      [{ id: 'timeout-fallback', name: 'Timeout Fallback' }]
    );
    console.log(`Result: ${JSON.stringify(result4)}`);
    
    console.log(chalk.green('\nAll tests completed!'));
  } catch (error) {
    console.error(chalk.red(`Unexpected error in tests: ${error.message}`));
  }
}

// Run tests
async function runTests() {
  console.log(chalk.green('=== Supabase Error Handling Test ==='));
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
  
  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error(chalk.red(`Failed to connect to Supabase: ${error.message}`));
      console.log(chalk.yellow('Proceeding with tests anyway...'));
    } else {
      console.log(chalk.green('Successfully connected to Supabase!'));
    }
    
    await testProfileFetching();
    
  } catch (error) {
    console.error(chalk.red(`Test failed: ${error.message}`));
  }
}

// Execute tests
runTests().catch(console.error);

console.log(chalk.blue('\nManual Testing Instructions:'));
console.log('1. Run the application with npm run dev');
console.log('2. Open the browser and navigate to the login page');
console.log('3. Log in with valid credentials');
console.log('4. Check the console for any 500 errors');
console.log('5. Navigate to the admin page to test profile listing');
console.log('6. Verify that the application works even if Supabase returns errors');