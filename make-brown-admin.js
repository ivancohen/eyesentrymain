// Direct script to make brownh@eyesentrymed.com an admin
// Run with: node make-brown-admin.js

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (same as the app)
const supabaseUrl = 'https://gebojeuaeaqmdfrxptqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYm9qZXVhZWFxbWRmcnhwdHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDQ2NDEsImV4cCI6MjA1NzEyMDY0MX0.Fpzp_tD07GXGNvf2k7HLLOe1-UHLU_jOb-fKwZvn6OM';

// Email of the user to make admin
const adminEmail = 'brownh@eyesentrymed.com';

async function makeAdmin() {
  console.log(`Starting admin promotion for ${adminEmail}`);
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Connected to Supabase');
    
    // Step 1: Get the user's ID from profiles table
    console.log('Looking up user in profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('email', adminEmail)
      .single();
    
    if (profileError) {
      console.error('Error finding user profile:', profileError.message);
      return;
    }
    
    if (!profileData) {
      console.error('User not found in profiles table');
      return;
    }
    
    console.log(`Found user with ID: ${profileData.id}, current admin status: ${profileData.is_admin}`);
    
    // Step 2: Update the is_admin flag in profiles
    console.log('Updating is_admin flag in profiles table...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', profileData.id);
    
    if (updateError) {
      console.error('Error updating profile:', updateError.message);
      return;
    }
    
    console.log('Successfully updated is_admin flag to true in profiles table');
    
    // Step 3: Try to use the create_admin RPC function
    console.log('Attempting to call create_admin RPC function...');
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'create_admin',
        { 
          admin_email: adminEmail,
          admin_name: adminEmail.split('@')[0]
        }
      );
      
      if (rpcError) {
        console.warn('RPC function call failed:', rpcError.message);
      } else {
        console.log('RPC function call successful');
      }
    } catch (rpcError) {
      console.warn('RPC function exception:', rpcError);
    }
    
    // Final verification
    console.log('Verifying admin status...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', profileData.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying admin status:', verifyError.message);
      return;
    }
    
    console.log(`Final admin status: ${verifyData.is_admin}`);
    
    console.log('\nAdmin access should now be granted. User should log out and log back in.');
    console.log('Note: Auth metadata updates might require direct database access.');
    console.log('If problems persist, run this SQL in the Supabase dashboard SQL editor:');
    console.log(`
UPDATE auth.users 
SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    '{"role": "admin"}'::jsonb
WHERE email = '${adminEmail}';
    `);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
makeAdmin();
