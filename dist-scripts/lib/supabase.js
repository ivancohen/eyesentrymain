import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
// Use process.env instead of import.meta.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    // Provide a more informative error message
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing.');
    console.error('Ensure you have a .env file in the project root with these variables defined.');
    throw new Error('Missing Supabase environment variables. Check console for details.');
}
// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Export a function to get the client instance
export const getSupabaseClient = () => supabase;
