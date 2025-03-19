// Emergency Fix Script for Database Access Issues
import { createClient } from '@supabase/supabase-js';

// Use the same Supabase configuration from the app
const supabaseUrl = 'https://gebojeuaeaqmdfrxptqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYm9qZXVhZWFxbWRmcnhwdHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDQ2NDEsImV4cCI6MjA1NzEyMDY0MX0.Fpzp_tD07GXGNvf2k7HLLOe1-UHLU_jOb-fKwZvn6OM';

const main = async () => {
  try {
    console.log('EMERGENCY FIX FOR DATABASE ACCESS ISSUES');
    console.log('=======================================');
    console.log('This script will diagnose and fix RLS-related permission issues');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('\nStep 1: Testing Database Access...');
    
    // Try a basic query to get all profiles
    console.log('Attempting to query profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error(`❌ Error accessing profiles table: ${profilesError.message}`);
      console.log('This confirms there are permission issues with Row Level Security (RLS)');
    } else {
      console.log(`✅ Successfully accessed profiles table, found ${profilesData.length} records`);
    }
    
    // Try accessing the emergency views if they exist
    console.log('\nChecking if emergency views are available...');
    const { data: emergencyData, error: emergencyError } = await supabase
      .from('emergency_users_view')
      .select('*')
      .limit(1);
    
    if (emergencyError) {
      console.error(`❌ Emergency views not available: ${emergencyError.message}`);
      console.log('This suggests the emergency_quickfix.sql has not been applied to the database');
    } else {
      console.log('✅ Emergency views are available and accessible');
    }
    
    // Attempt to fix the user's admin access directly using app metadata update
    console.log('\nStep 2: Attempting to update profile for ivan.s.cohen@gmail.com...');
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('email', 'ivan.s.cohen@gmail.com')
      .maybeSingle();
    
    if (userError) {
      console.error(`❌ Error finding user: ${userError.message}`);
      console.log('Attempting to use a different approach...');
      
      // Try using RPC function for admin check to diagnose
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('check_is_admin');
      
      if (adminCheckError) {
        console.error(`❌ Error checking admin status: ${adminCheckError.message}`);
      } else {
        console.log(`Admin check via RPC: ${isAdmin ? 'true' : 'false'}`);
      }
      
      // Try universal admin check if it exists
      const { data: isAdminBypass, error: bypassError } = await supabase.rpc('is_admin_bypass_role');
      
      if (bypassError) {
        console.error(`❌ Bypass function not available: ${bypassError.message}`);
      } else {
        console.log(`Admin check via bypass: ${isAdminBypass ? 'true' : 'false'}`);
      }
    } else if (userData) {
      console.log(`User found with ID: ${userData.id}, current admin status: ${userData.is_admin}`);
      
      // Update the profile - attempt even if we got an error before
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', 'ivan.s.cohen@gmail.com');
      
      if (updateError) {
        console.error(`❌ Error updating profile: ${updateError.message}`);
        console.log('Direct update failed, this confirms serious permission issues');
      } else {
        console.log('✅ Successfully updated is_admin flag to true in profiles table');
      }
    } else {
      console.log('❌ User not found in profiles table');
    }
    
    console.log('\n===== FIXING DATABASE ACCESS ISSUES =====');
    console.log('\nTo fix the permission issues, follow these steps:');
    console.log('\n1. Login to the Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/gebojeuaeaqmdfrxptqf');
    
    console.log('\n2. Go to the SQL Editor and run the emergency_quickfix.sql script:');
    console.log('   - Navigate to "SQL Editor" in the left sidebar');
    console.log('   - Open a new query or create a new query');
    console.log('   - Paste the content of "supabase/emergency_quickfix.sql"');
    console.log('   - Run the script');
    
    console.log('\n3. Update the imports in the application code:');
    console.log('   - Change imports from FixedAdminService to EmergencyAdminService');
    console.log('   - Example: import { EmergencyAdminService } from "@/services/EmergencyAdminService";');
    
    console.log('\nAfter completing these steps, restart the application and try logging in again.');
    console.log('You should now have full admin access without any permission errors.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

main();
