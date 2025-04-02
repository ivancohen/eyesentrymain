/**
 * Test script for authentication flow
 * 
 * This script tests various authentication scenarios to ensure the fixes
 * for refresh token and profile fetching issues are working correctly.
 * 
 * Run this script with:
 * npm run ts-node src/scripts/testAuthFlow.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test login functionality
 */
async function testLogin(email: string, password: string) {
  console.log(`\n=== Testing login for ${email} ===`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return null;
    }
    
    console.log('Login successful');
    console.log('User ID:', data.user?.id);
    console.log('Session expires at:', new Date(data.session?.expires_at! * 1000).toLocaleString());
    
    return data;
  } catch (error) {
    console.error('Unexpected login error:', error);
    return null;
  }
}

/**
 * Test profile fetching
 */
async function testProfileFetch(userId: string) {
  console.log(`\n=== Testing profile fetch for user ${userId} ===`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Profile fetch error:', error.message);
      return null;
    }
    
    console.log('Profile fetch successful');
    console.log('Profile data:', data);
    
    return data;
  } catch (error) {
    console.error('Unexpected profile fetch error:', error);
    return null;
  }
}

/**
 * Test session refresh
 */
async function testSessionRefresh() {
  console.log('\n=== Testing session refresh ===');
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error.message);
      return false;
    }
    
    console.log('Session refresh successful');
    console.log('New session expires at:', new Date(data.session?.expires_at! * 1000).toLocaleString());
    
    return true;
  } catch (error) {
    console.error('Unexpected session refresh error:', error);
    return false;
  }
}

/**
 * Test sign out
 */
async function testSignOut() {
  console.log('\n=== Testing sign out ===');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error.message);
      return false;
    }
    
    console.log('Sign out successful');
    
    return true;
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('=== Starting Authentication Flow Tests ===');
  
  // Test login with valid credentials
  // Replace with actual test credentials
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  
  const loginData = await testLogin(testEmail, testPassword);
  
  if (loginData?.user) {
    // Test profile fetching
    await testProfileFetch(loginData.user.id);
    
    // Test session refresh
    await testSessionRefresh();
    
    // Test sign out
    await testSignOut();
  }
  
  console.log('\n=== Authentication Flow Tests Completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution error:', error);
});