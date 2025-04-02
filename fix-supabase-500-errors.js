/**
 * Fix for Supabase 500 Errors
 * 
 * This script addresses the 500 server errors when fetching profiles from Supabase by:
 * 1. Adding a robust error handling utility for Supabase queries
 * 2. Implementing retry logic with exponential backoff
 * 3. Providing fallback mechanisms to maintain app functionality
 * 4. Updating profile fetching code in AuthContext and FixedAdminService
 * 
 * Run this script with:
 * node fix-supabase-500-errors.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to files we need to create or modify
const utilsDir = path.join(__dirname, 'src', 'utils');
const errorHandlerPath = path.join(utilsDir, 'supabaseErrorHandler.ts');
const authContextPath = path.join(__dirname, 'src', 'contexts', 'AuthContext.tsx');
const adminServicePath = path.join(__dirname, 'src', 'services', 'FixedAdminService.ts');

// Create utils directory if it doesn't exist
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Content for the supabaseErrorHandler.ts file
const errorHandlerContent = `/**
 * Utility functions for handling Supabase errors gracefully
 * Provides fallback mechanisms and retry logic for common Supabase issues
 *
 * Note: If you encounter a 500 error when loading AuthContext.tsx, run:
 * node fix-authcontext-loading.js
 */

import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Error types
export enum SupabaseErrorType {
  SERVER_ERROR = "SERVER_ERROR",
  AUTH_ERROR = "AUTH_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

// Interface for error details
export interface ErrorDetails {
  type: SupabaseErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * Safely execute a Supabase query with retry logic and fallback
 * @param queryFn Function that returns a Supabase query builder
 * @param fallbackData Default data to return if all retries fail
 * @param maxRetries Number of retry attempts (default: 2)
 * @param silent Whether to suppress toast notifications (default: false)
 * @returns Query result or fallback data
 */
export async function safeQueryWithFallback<T>(
  queryFn: () => any, // Accept any Supabase query builder
  fallbackData: T,
  maxRetries = 2,
  silent = false
): Promise<T> {
  let retries = 0;
  let lastError: ErrorDetails | null = null;

  while (retries <= maxRetries) {
    try {
      // Execute the query - Supabase query builders return { data, error } when awaited
      const query = queryFn();
      const { data, error } = await query;
      
      if (error) {
        // Categorize the error
        const errorDetails = categorizeError(error);
        lastError = errorDetails;
        
        // For server errors (500), retry after a delay
        if (errorDetails.type === SupabaseErrorType.SERVER_ERROR) {
          retries++;
          if (retries <= maxRetries) {
            // Exponential backoff: 1s, 2s, 4s, etc.
            const delay = Math.pow(2, retries - 1) * 1000;
            console.warn(\`Supabase server error, retrying in \${delay}ms (attempt \${retries}/\${maxRetries})\`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For auth errors, attempt to refresh the session
        if (errorDetails.type === SupabaseErrorType.AUTH_ERROR) {
          console.warn("Auth error detected, attempting to refresh session", error);
          await supabase.auth.refreshSession();
          retries++;
          continue;
        }

        // Log the error
        console.error("Supabase query error:", errorDetails);
        
        // Return fallback data for any error after retries
        if (!silent) {
          toast.error(\`Database error: \${errorDetails.message}\`);
        }
        return fallbackData;
      }
      
      // Success - return the data or fallback if null
      return data || fallbackData;
    } catch (error) {
      // Unexpected error outside of Supabase's error handling
      lastError = {
        type: SupabaseErrorType.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        originalError: error
      };
      console.error("Unexpected error in Supabase query:", error);
      retries++;
      
      if (retries <= maxRetries) {
        // Simple retry with delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  // All retries failed
  if (!silent && lastError) {
    toast.error(\`Database error: \${lastError.message}\`);
  }
  
  return fallbackData;
}

/**
 * Categorize a Supabase error into a specific type
 * @param error The error from Supabase
 * @returns Categorized error details
 */
function categorizeError(error: any): ErrorDetails {
  // Check for server errors (5xx)
  if (error.status >= 500) {
    return {
      type: SupabaseErrorType.SERVER_ERROR,
      message: "Database server error. Please try again later.",
      originalError: error
    };
  }
  
  // Check for auth errors
  if (
    error.status === 401 || 
    error.status === 403 || 
    error.code === "PGRST301" ||
    (error.message && (
      error.message.includes("JWT") || 
      error.message.includes("token") || 
      error.message.includes("auth")
    ))
  ) {
    return {
      type: SupabaseErrorType.AUTH_ERROR,
      message: "Authentication error. Please try logging in again.",
      originalError: error
    };
  }
  
  // Check for network errors
  if (error.code === "NETWORK_ERROR" || error.message?.includes("network")) {
    return {
      type: SupabaseErrorType.NETWORK_ERROR,
      message: "Network error. Please check your connection.",
      originalError: error
    };
  }
  
  // Default to unknown error
  return {
    type: SupabaseErrorType.UNKNOWN_ERROR,
    message: error.message || "An unknown database error occurred",
    originalError: error
  };
}

/**
 * Create a cached profile fallback for the current user
 * Helps maintain app functionality even when profile fetching fails
 */
export function createProfileFallback(userId: string, email: string, userData?: any): any {
  // Create a minimal profile with essential fields
  return {
    id: userId,
    email: email || '',
    name: userData?.name || email?.split('@')[0] || '',
    is_admin: userData?.is_admin || false,
    is_approved: userData?.is_approved || false,
    is_suspended: false, // Default to not suspended to prevent lockouts
    created_at: new Date().toISOString(),
    // Add other fields with sensible defaults
    location: userData?.location || '',
    state: userData?.state || '',
    zip_code: userData?.zip_code || '',
    specialty: userData?.specialty || '',
    phone_number: userData?.phone_number || '',
    address: userData?.address || '',
    street_address: userData?.street_address || '',
    city: userData?.city || ''
  };
}`;

// Write the error handler file
fs.writeFileSync(errorHandlerPath, errorHandlerContent);
console.log(`Created error handler utility at: ${errorHandlerPath}`);

// Function to modify AuthContext.tsx
function updateAuthContext() {
  if (!fs.existsSync(authContextPath)) {
    console.error(`AuthContext.tsx not found at: ${authContextPath}`);
    return false;
  }

  let content = fs.readFileSync(authContextPath, 'utf8');

  // Add import for our new utility
  content = content.replace(
    `import { refreshAuthSession, safeSignOut, handleAuthError } from '@/utils/authUtils';`,
    `import { refreshAuthSession, safeSignOut, handleAuthError } from '@/utils/authUtils';
import { safeQueryWithFallback, createProfileFallback } from '@/utils/supabaseErrorHandler';`
  );

  // Update profile fetching in updateUserProfile
  content = content.replace(
    /\/\/ Method 3: Check against profiles table is_admin flag\s+let isAdminInProfile = false;\s+try {\s+const { data: profile, error } = await supabase\s+\.from\('profiles'\)\s+\.select\('\*'\)\s+\.eq\('id', sessionUser\.id\)\s+\.single\(\);\s+if \(!error && profile\) {\s+isAdminInProfile = profile\.is_admin === true;\s+}\s+} catch \(profileError\) {\s+console\.error\("Error fetching profile:", profileError\);\s+}/,
    `// Method 3: Check against profiles table is_admin flag with error handling
      let isAdminInProfile = false;
      
      // Use safe query with fallback to handle potential 500 errors
      const profile = await safeQueryWithFallback(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single(),
        createProfileFallback(sessionUser.id, userEmail, sessionUser.user_metadata),
        2, // 2 retries
        true // silent mode (no toasts)
      );
      
      if (profile) {
        isAdminInProfile = profile.is_admin === true;
      }`
  );

  // Update suspension check during login
  content = content.replace(
    /\/\/ Check suspension status BEFORE setting user state\s+const { data: profileData, error: profileError } = await supabase\s+\.from\('profiles'\)\s+\.select\('is_suspended'\)\s+\.eq\('id', data\.user\.id\)\s+\.single\(\);\s+if \(profileError\) {\s+console\.error\("Error fetching profile during login:", profileError\);\s+\/\/ Log the error but continue with login instead of failing\s+console\.warn\("Continuing login despite profile fetch error"\);\s+\/\/ Don't throw an error here, allow login to proceed\s+} else if \(profileData\?\.is_suspended === true\) {/,
    `// Check suspension status BEFORE setting user state with error handling
          const profileData = await safeQueryWithFallback(
            () => supabase
              .from('profiles')
              .select('is_suspended')
              .eq('id', data.user.id)
              .single(),
            { is_suspended: false }, // Default to not suspended if query fails
            2, // 2 retries
            true // silent mode (no toasts)
          );
          
          if (profileData?.is_suspended === true) {`
  );

  fs.writeFileSync(authContextPath, content);
  console.log(`Updated AuthContext.tsx with error handling improvements`);
  return true;
}

// Function to modify FixedAdminService.ts
function updateAdminService() {
  if (!fs.existsSync(adminServicePath)) {
    console.error(`FixedAdminService.ts not found at: ${adminServicePath}`);
    return false;
  }

  let content = fs.readFileSync(adminServicePath, 'utf8');

  // Add import for our new utility
  content = content.replace(
    `import { supabase } from "@/lib/supabase";
import { toast } from "sonner";`,
    `import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";`
  );

  // Update fetchUsers method
  content = content.replace(
    /async fetchUsers\(\): Promise<UserProfile\[\]> {\s+try {\s+console\.log\("Fetching users from Supabase\.\.\."\);\s+const { data, error } = await supabase\s+\.from\('profiles'\)\s+\.select\('\*'\)\s+\.order\('created_at', { ascending: false }\);\s+if \(error\) {\s+console\.error\("Error fetching profiles:", error\);\s+throw error;\s+}\s+\/\/ eslint-disable-next-line @typescript\/eslint\/no-explicit-any\s+const userProfiles: UserProfile\[\] = \(data \|\| \[\]\)\.map\(\(profile: any\) => \({\s+.*?\s+}\)\);\s+console\.log\("Users fetched successfully:", userProfiles\.length, "results"\);\s+return userProfiles;\s+} catch \(error: unknown\) {\s+console\.error\("Error fetching users:", error\);\s+const errorMessage = error instanceof Error \? error\.message : 'Unknown error occurred';\s+toast\.error\(`Error fetching users: \${errorMessage}`\);\s+return \[\];\s+}/s,
    `async fetchUsers(): Promise<UserProfile[]> {
    console.log("Fetching users from Supabase...");
    
    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProfiles: UserProfile[] = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      is_admin: profile.is_admin || false,
      is_approved: profile.is_approved || false,
      created_at: profile.created_at,
      location: profile.location || '',
      state: profile.state || '',
      zip_code: profile.zip_code || '',
      specialty: profile.specialty || '',
      phone_number: profile.phone_number || '',
      address: profile.address || '',
      street_address: profile.street_address || '',
      city: profile.city || '',
      is_suspended: profile.is_suspended || false // Include suspended flag
    }));
    
    console.log("Users fetched successfully:", userProfiles.length, "results");
    return userProfiles;`
  );

  // Update fetchDoctorOffices method
  content = content.replace(
    /async fetchDoctorOffices\(\): Promise<DoctorOffice\[\]> {\s+try {\s+console\.log\("Fetching doctor offices\.\.\."\);\s+const { data, error } = await supabase\s+\.from\('profiles'\)\s+\.select\('\*'\)\s+\.eq\('is_admin', false\)\s+\.order\('created_at', { ascending: false }\);\s+if \(error\) {\s+console\.error\("Error fetching doctor offices:", error\);\s+throw error;\s+}\s+\/\/ eslint-disable-next-line @typescript\/eslint\/no-explicit-any\s+const doctorOffices = \(data \|\| \[\]\)\.map\(\(profile: any\) => \({\s+.*?\s+}\)\);\s+console\.log\("Doctor offices fetched successfully:", doctorOffices\.length, "results"\);\s+return doctorOffices;\s+} catch \(error: unknown\) {\s+console\.error\("Error fetching doctor offices:", error\);\s+const errorMessage = error instanceof Error \? error\.message : 'Unknown error occurred';\s+toast\.error\(`Error fetching doctor offices: \${errorMessage}`\);\s+return \[\];\s+}/s,
    `async fetchDoctorOffices(): Promise<DoctorOffice[]> {
    console.log("Fetching doctor offices...");
    
    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doctorOffices = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email || '',
      name: profile.name || '',
      is_admin: profile.is_admin || false,
      is_approved: profile.is_approved || false,
      created_at: profile.created_at,
      specialty: profile.specialty || '',
      phone_number: profile.phone_number || '',
      address: profile.address || '',
      location: profile.location || '',
      state: profile.state || '',
      zip_code: profile.zip_code || '',
      street_address: profile.street_address || '',
      city: profile.city || '',
      is_suspended: profile.is_suspended || false, // Include suspended flag
      // DoctorOffice specific fields
      office_name: profile.name ? \`Dr. \${profile.name.split(' ').pop() || ''} Medical Office\` : 'Medical Office',
      office_hours: "Monday-Friday: 9:00 AM - 5:00 PM",
      fax_number: "",
      website: "",
      accepting_new_patients: true,
      insurance_accepted: "Major insurance plans accepted",
      additional_notes: ""
    }));
    
    console.log("Doctor offices fetched successfully:", doctorOffices.length, "results");
    return doctorOffices;`
  );

  // Update fetchApprovedDoctors method
  content = content.replace(
    /async fetchApprovedDoctors\(\): Promise<UserProfile\[\]> {\s+try {\s+console\.log\("Fetching approved doctors\.\.\."\);\s+const { data, error } = await supabase\s+\.from\('profiles'\)\s+\.select\('\*'\)\s+\.eq\('is_admin', false\)\s+\.eq\('is_approved', true\)\s+\.order\('created_at', { ascending: false }\);\s+if \(error\) {\s+console\.error\("Error fetching approved doctors:", error\);\s+throw error;\s+}\s+\/\/ eslint-disable-next-line @typescript\/eslint\/no-explicit-any\s+const approvedDoctors = \(data \|\| \[\]\)\.map\(\(profile: any\) => \({\s+.*?\s+}\)\);\s+console\.log\("Approved doctors fetched successfully:", approvedDoctors\.length, "results"\);\s+return approvedDoctors;\s+} catch \(error: unknown\) {\s+console\.error\("Error fetching approved doctors:", error\);\s+const errorMessage = error instanceof Error \? error\.message : 'Unknown error occurred';\s+toast\.error\(`Error fetching approved doctors: \${errorMessage}`\);\s+return \[\];\s+}/s,
    `async fetchApprovedDoctors(): Promise<UserProfile[]> {
    console.log("Fetching approved doctors...");
    
    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', true)
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approvedDoctors = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email || '',
      name: profile.name || '',
      is_admin: profile.is_admin || false,
      is_approved: profile.is_approved || false,
      created_at: profile.created_at,
      location: profile.location || '',
      state: profile.state || '',
      zip_code: profile.zip_code || '',
      specialty: profile.specialty || '',
      phone_number: profile.phone_number || '',
      address: profile.address || '',
      street_address: profile.street_address || '',
      city: profile.city || '',
      is_suspended: profile.is_suspended || false // Include suspended flag
    }));
    
    console.log("Approved doctors fetched successfully:", approvedDoctors.length, "results");
    return approvedDoctors;`
  );

  // Update fetchPendingDoctorApprovals method
  content = content.replace(
    /async fetchPendingDoctorApprovals\(\): Promise<DoctorApproval\[\]> {\s+try {\s+console\.log\("Fetching pending doctor approvals\.\.\."\);\s+const { data, error } = await supabase\s+\.from\('profiles'\)\s+\.select\('\*'\)\s+\.eq\('is_admin', false\)\s+\.eq\('is_approved', false\)\s+\.order\('created_at', { ascending: false }\);\s+if \(error\) {\s+console\.error\("Error fetching pending approvals:", error\);\s+throw error;\s+}\s+\/\/ eslint-disable-next-line @typescript\/eslint\/no-explicit-any\s+const pendingApprovals: DoctorApproval\[\] = \(data \|\| \[\]\)\.map\(\(profile: any\) => \({\s+.*?\s+}\)\);\s+console\.log\("Pending approvals fetched successfully:", pendingApprovals\.length, "results"\);\s+return pendingApprovals;\s+} catch \(error: unknown\) {\s+console\.error\("Error fetching pending approvals:", error\);\s+const errorMessage = error instanceof Error \? error\.message : 'Unknown error occurred';\s+toast\.error\(`Error fetching pending approvals: \${errorMessage}`\);\s+return \[\];\s+}/s,
    `async fetchPendingDoctorApprovals(): Promise<DoctorApproval[]> {
    console.log("Fetching pending doctor approvals...");
    
    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', false)
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingApprovals: DoctorApproval[] = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      is_admin: false,
      is_approved: false,
      created_at: profile.created_at,
      location: profile.location || '',
      state: profile.state || '',
      zip_code: profile.zip_code || '',
      specialty: profile.specialty || '',
      phone_number: profile.phone_number || '',
      address: profile.address || '',
      street_address: profile.street_address || '',
      city: profile.city || '',
      is_suspended: profile.is_suspended || false, // Include suspended flag
      contact: profile.phone_number || profile.email || ''
    }));
    
    console.log("Pending approvals fetched successfully:", pendingApprovals.length, "results");
    return pendingApprovals;`
  );

  fs.writeFileSync(adminServicePath, content);
  console.log(`Updated FixedAdminService.ts with error handling improvements`);
  return true;
}

// Apply the changes
const authContextUpdated = updateAuthContext();
const adminServiceUpdated = updateAdminService();

// Print summary
console.log('\n=== Supabase 500 Error Fix Summary ===');
console.log('1. Created supabaseErrorHandler.ts utility with:');
console.log('   - Retry logic with exponential backoff');
console.log('   - Error categorization and handling');
console.log('   - Fallback mechanisms for failed queries');

if (authContextUpdated) {
  console.log('2. Updated AuthContext.tsx with improved error handling for:');
  console.log('   - Profile fetching during login');
  console.log('   - Suspension status checks');
} else {
  console.log('2. Failed to update AuthContext.tsx');
}

if (adminServiceUpdated) {
  console.log('3. Updated FixedAdminService.ts with improved error handling for:');
  console.log('   - User profile fetching');
  console.log('   - Doctor office fetching');
  console.log('   - Approved doctors fetching');
  console.log('   - Pending approvals fetching');
} else {
  console.log('3. Failed to update FixedAdminService.ts');
}

console.log('\n=== Testing Instructions ===');
console.log('1. Build the application with:');
console.log('   npm run build');
console.log('');
console.log('2. Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('3. Test the application by:');
console.log('   - Logging in with a test account');
console.log('   - Navigating to the admin page to verify profile fetching');
console.log('   - Checking the browser console for any remaining errors');
console.log('');
console.log('The application should now be more resilient to Supabase 500 errors,');
console.log('with automatic retries and graceful fallbacks to maintain functionality.');
console.log('');
console.log('If you encounter a 500 error when loading AuthContext.tsx, run:');
console.log('node fix-authcontext-loading.js');