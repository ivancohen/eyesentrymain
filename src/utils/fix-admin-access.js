// Script to fix admin access for ivan.s.cohen@gmail.com
import { supabase } from "@/lib/supabase";

const main = async () => {
  try {
    console.log('Connecting to Supabase...');
    
    const adminEmail = 'ivan.s.cohen@gmail.com';
    console.log(`Fixing admin access for ${adminEmail}...`);

    // Step 1: Get user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('email', adminEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }

    if (!userData) {
      console.error('User not found in profiles table');
      return;
    }

    console.log(`Found user with ID: ${userData.id}, current admin status: ${userData.is_admin}`);

    // Step 2: Update the is_admin flag in profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    console.log('Successfully updated is_admin flag to true in profiles table');

    // Step 3: Call Supabase function to update app_metadata (this requires a Supabase function)
    // This step requires either:
    // 1. A custom RPC function in Supabase that can update auth.users (recommended)
    // 2. Direct access to the Supabase dashboard
    // 3. Using the Admin API (requires service role key)

    console.log('Admin access should now be fixed. Please log out and log back in to refresh your session.');
    console.log('Note: The app_metadata update requires direct access to auth.users table.');
    console.log('To complete this process, please run this SQL in the Supabase dashboard SQL editor:');
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
};

main();
