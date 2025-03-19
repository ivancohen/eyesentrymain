
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// These environment variables are available after connecting Supabase to your project
const supabaseUrl = 'https://gebojeuaeaqmdfrxptqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYm9qZXVhZWFxbWRmcnhwdHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDQ2NDEsImV4cCI6MjA1NzEyMDY0MX0.Fpzp_tD07GXGNvf2k7HLLOe1-UHLU_jOb-fKwZvn6OM';

// Get current origin for redirects
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce',
    detectSessionInUrl: true,
    // Use the current domain for redirects
    redirectTo: `${origin}/login`
  }
});

// Helper function to check if Supabase connection is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey;
};
