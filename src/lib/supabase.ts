import { createClient } from '@supabase/supabase-js';

// Use import.meta.env (Vite's way)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This error will likely occur when run outside Vite
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing.');
  console.error('These are typically provided by Vite. Ensure the script is run in an environment where these are defined or shimmed.');
  throw new Error('Missing Supabase environment variables via import.meta.env.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a function to get the client instance
export const getSupabaseClient = () => supabase;