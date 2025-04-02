#!/bin/bash

echo "===== Eye Sentry Application Fix Script ====="
echo "This script will guide you through fixing all issues in the application."
echo

echo "Step 1: Fix the Supabase Infinite Recursion Issue (Database-Level)"
echo "-------------------------------------------------------------"
echo "Please follow these steps in the Supabase SQL Editor:"
echo "1. Run the SQL query to identify problematic policies"
echo "2. Drop the recursive policy"
echo "3. Create a new, non-recursive policy"
echo
echo "For detailed instructions, see fix-supabase-policy-recursion.js"
echo
read -p "Press Enter when you've completed this step..."

echo
echo "Step 2: Fix the Auth Refresh Token Error"
echo "-------------------------------------------------------------"
echo "1. Creating the session check utility..."
echo

echo "Creating directory if it doesn't exist..."
mkdir -p src/utils

echo "Creating sessionCheck.ts..."
cat > src/utils/sessionCheck.ts << 'EOL'
import { supabase } from '@/lib/supabase';

/**
 * Utility to check if there's a valid session and refresh it if needed
 * @returns True if a valid session exists or was refreshed successfully
 */
export const ensureValidSession = async (): Promise<boolean> => {
  try {
    // Check if we have a session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error checking session:", sessionError);
      return false;
    }
    
    if (!sessionData?.session) {
      console.log("No active session found");
      return false;
    }
    
    // Check if the session is expired or about to expire (within 5 minutes)
    const expiresAt = sessionData.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    if (expiresAt && expiresAt < now + fiveMinutes) {
      console.log("Session is expired or about to expire, attempting to refresh");
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        return false;
      }
      
      console.log("Session refreshed successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error in ensureValidSession:", error);
    return false;
  }
};

/**
 * Call this function before making important API calls
 * @param callback Function to execute if session is valid
 * @returns The result of the callback or null if session is invalid
 */
export const withValidSession = async <T>(callback: () => Promise<T>): Promise<T | null> => {
  const isValid = await ensureValidSession();
  
  if (!isValid) {
    console.error("No valid session available");
    return null;
  }
  
  return await callback();
};
EOL

echo
echo "2. Now you need to update AuthContext.tsx to handle token refresh errors."
echo "For detailed instructions, see fix-auth-refresh-token.js"
echo
read -p "Press Enter when you've completed this step..."

echo
echo "Step 3: Implement Application-Level Error Handling"
echo "-------------------------------------------------------------"
echo "1. Creating the error handling utility..."
echo

echo "Creating directory if it doesn't exist..."
mkdir -p src/utils

echo "Creating supabaseErrorHandler.ts..."
cat > src/utils/supabaseErrorHandler.ts << 'EOL'
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Utility for handling Supabase errors with retry logic and fallbacks
 */
export const supabaseErrorHandler = {
  /**
   * Execute a Supabase query with retry logic and error handling
   * @param queryFn Function that returns a Supabase query
   * @param fallbackValue Value to return if all retries fail
   * @param maxRetries Maximum number of retry attempts
   * @returns Query result or fallback value
   */
  async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallbackValue: T,
    maxRetries = 3
  ): Promise<T> {
    let retries = 0;
    let lastError: any = null;

    while (retries <= maxRetries) {
      try {
        // Add exponential backoff delay after first attempt
        if (retries > 0) {
          const delay = Math.pow(2, retries - 1) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms`);
        }

        const { data, error } = await queryFn();

        if (error) {
          lastError = error;
          console.error(`Supabase query error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
          
          // Check if it's an auth error that might be fixed by refreshing the session
          if (error.message?.includes('JWT') || error.message?.includes('token')) {
            console.log('Attempting to refresh auth session...');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Failed to refresh session:', refreshError);
            }
          }
          
          retries++;
          continue;
        }

        return data || fallbackValue;
      } catch (error) {
        lastError = error;
        console.error(`Unexpected error in query (attempt ${retries + 1}/${maxRetries + 1}):`, error);
        retries++;
      }
    }

    // All retries failed, log the error and return fallback
    console.error(`All ${maxRetries + 1} query attempts failed. Last error:`, lastError);
    
    // Only show toast for network errors, not for expected 500 errors
    if (lastError?.message?.includes('network') || lastError?.code === 'NETWORK_ERROR') {
      toast.error('Network error. Please check your connection and try again.');
    }
    
    return fallbackValue;
  },

  /**
   * Categorize an error for better handling
   * @param error The error to categorize
   * @returns The error category
   */
  categorizeError(error: any): 'server' | 'auth' | 'network' | 'unknown' {
    if (!error) return 'unknown';
    
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.status || error.statusCode || 0;
    
    if (statusCode >= 500 || errorMessage.includes('500')) {
      return 'server';
    }
    
    if (statusCode === 401 || statusCode === 403 || 
        errorMessage.includes('jwt') || errorMessage.includes('token') || 
        errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      return 'auth';
    }
    
    if (errorMessage.includes('network') || error.code === 'NETWORK_ERROR') {
      return 'network';
    }
    
    return 'unknown';
  },

  /**
   * Create a minimal profile with default values
   * @param userId The user ID
   * @returns A minimal profile object
   */
  createMinimalProfile(userId: string) {
    return {
      id: userId,
      is_suspended: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'user'
    };
  }
};
EOL

echo
echo "2. Now you need to update AuthContext.tsx and FixedAdminService.ts to use the error handler."
echo "For detailed instructions, see implement-supabase-error-handling.js"
echo
read -p "Press Enter when you've completed this step..."

echo
echo "Step 4: Fix React Router Warnings"
echo "-------------------------------------------------------------"
echo "1. Creating router configuration..."
echo

echo "Creating directory if it doesn't exist..."
mkdir -p src/router

echo "Creating config.js..."
cat > src/router/config.js << 'EOL'
// React Router configuration with future flags
export const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};
EOL

echo
echo "2. Now you need to update your BrowserRouter implementation."
echo "For detailed instructions, see fix-react-router-warnings.js"
echo
read -p "Press Enter when you've completed this step..."

echo
echo "===== All fixes have been applied! ====="
echo
echo "Please restart your development server and verify that:"
echo "1. No 500 errors appear in the console when fetching profiles"
echo "2. The application continues to function with fallback values if errors occur"
echo "3. No React Router warnings appear in the console"
echo
echo "For detailed verification steps, see fix-all-issues-guide.md"
echo
read -p "Press Enter to exit..."