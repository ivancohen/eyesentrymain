// Script to fix the "Invalid Refresh Token: Refresh Token Not Found" error
// This script provides instructions to fix the auth refresh token issue

console.log('=== Auth Refresh Token Fix ===');
console.log('This script provides instructions to fix the "Invalid Refresh Token: Refresh Token Not Found" error.\n');

console.log('The error occurs when trying to refresh an auth token that doesn\'t exist or has expired.');
console.log('This is often seen when the application tries to refresh a token automatically during error handling.\n');

console.log('Step 1: Update the supabaseErrorHandler.ts file');
console.log('Modify the executeQuery method in src/utils/supabaseErrorHandler.ts to handle refresh token errors:');
console.log('```typescript');
console.log(`async executeQuery<T>(
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
        console.log(\`Retry attempt \${retries}/\${maxRetries} after \${delay}ms\`);
      }

      const { data, error } = await queryFn();

      if (error) {
        lastError = error;
        console.error(\`Supabase query error (attempt \${retries + 1}/\${maxRetries + 1}):\`, error);
        
        // Check if it's an auth error that might be fixed by refreshing the session
        if (error.message?.includes('JWT') || error.message?.includes('token')) {
          console.log('Attempting to refresh auth session...');
          try {
            // Only try to refresh if we have a session
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                // If refresh fails, don't treat it as a fatal error
                console.error('Failed to refresh session:', refreshError);
              }
            } else {
              console.log('No active session to refresh');
            }
          } catch (refreshError) {
            // Catch any errors during refresh attempt
            console.error('Error during session refresh:', refreshError);
          }
        }
        
        retries++;
        continue;
      }

      return data || fallbackValue;
    } catch (error) {
      lastError = error;
      console.error(\`Unexpected error in query (attempt \${retries + 1}/\${maxRetries + 1}):\`, error);
      retries++;
    }
  }

  // All retries failed, log the error and return fallback
  console.error(\`All \${maxRetries + 1} query attempts failed. Last error:\`, lastError);
  
  // Only show toast for network errors, not for expected 500 errors
  if (lastError?.message?.includes('network') || lastError?.code === 'NETWORK_ERROR') {
    toast.error('Network error. Please check your connection and try again.');
  }
  
  return fallbackValue;
}`);
console.log('```\n');

console.log('Step 2: Update the AuthContext.tsx file');
console.log('Modify the login method in AuthContext.tsx to handle token refresh more gracefully:');
console.log('```typescript');
console.log(`// Add this helper method to your AuthContext
const safeCheckProfile = async (userId) => {
  try {
    // First check if the user is suspended
    const suspensionCheck = await supabaseErrorHandler.executeQuery(
      () => supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', userId)
        .single(),
      { is_suspended: false } // Default to not suspended if query fails
    );

    if (suspensionCheck.is_suspended) {
      console.error("User is suspended");
      return { isSuspended: true, profile: null };
    }

    // Then fetch the full profile
    const profile = await supabaseErrorHandler.executeQuery(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      supabaseErrorHandler.createMinimalProfile(userId)
    );

    return { isSuspended: false, profile };
  } catch (error) {
    console.error("Error in safeCheckProfile:", error);
    // Return a minimal profile as fallback
    return { 
      isSuspended: false, 
      profile: supabaseErrorHandler.createMinimalProfile(userId)
    };
  }
};

// Then update your login method to use this helper
const login = async (email, password) => {
  setLoading(true);
  try {
    console.log("Login attempt for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setError(error.message);
      setLoading(false);
      return false;
    }

    console.log("Login successful, data:", data);
    
    // Use the safe profile check method
    console.log("Login successful, fetching user profile");
    const { isSuspended, profile } = await safeCheckProfile(data.user.id);
    
    if (isSuspended) {
      setError("Your account has been suspended. Please contact support.");
      await supabase.auth.signOut();
      setLoading(false);
      return false;
    }

    console.log("User profile after login:", profile);
    
    // Set user state with the profile data
    setUser({
      id: data.user.id,
      email: data.user.email,
      name: profile.full_name || profile.email || data.user.email,
      role: profile.role || 'user',
      ...profile
    });
    
    setLoading(false);
    return true;
  } catch (error) {
    console.error("Login error:", error);
    setError("An unexpected error occurred. Please try again.");
    setLoading(false);
    return false;
  }
};`);
console.log('```\n');

console.log('Step 3: Add a session check utility');
console.log('Create a new utility function in src/utils/sessionCheck.ts:');
console.log('```typescript');
console.log(`import { supabase } from '@/lib/supabase';

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
};`);
console.log('```\n');

console.log('Step 4: Use the session check utility');
console.log('Update key API calls in your services to use the session check utility:');
console.log('```typescript');
console.log(`// In FixedAdminService.ts
import { withValidSession } from '@/utils/sessionCheck';

// Example method update
static async fetchProfiles(): Promise<UserProfile[]> {
  return withValidSession(async () => {
    try {
      return await supabaseErrorHandler.executeQuery(
        () => supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        [] // Empty array as fallback
      );
    } catch (error) {
      console.error("Error in fetchProfiles:", error);
      return []; // Return empty array instead of throwing
    }
  }) || []; // Return empty array if session check fails
}`);
console.log('```\n');

console.log('Step 5: Implement a session recovery mechanism');
console.log('Add a session recovery mechanism to your application:');
console.log('```typescript');
console.log(`// In your main App component or a high-level context
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ensureValidSession } from '@/utils/sessionCheck';

// Add this to your component
useEffect(() => {
  // Check session on app load
  const checkSession = async () => {
    const isValid = await ensureValidSession();
    
    if (!isValid && user) {
      // Session is invalid but we have a user in state
      // This means the session expired or was invalidated
      console.log("Session expired, logging out");
      logout();
    }
  };
  
  checkSession();
  
  // Set up auth state change listener
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_OUT') {
        // Handle sign out
        setUser(null);
      } else if (event === 'SIGNED_IN' && session) {
        // Handle sign in
        // This is handled by your login function, but this is a backup
        if (!user) {
          // Fetch user profile and set user state
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: profileData?.full_name || profileData?.email || session.user.email,
            role: profileData?.role || 'user',
            ...profileData
          });
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Session was refreshed, no action needed
        console.log("Token refreshed successfully");
      }
    }
  );
  
  return () => {
    authListener.subscription.unsubscribe();
  };
}, [user, logout, setUser]);`);
console.log('```\n');

console.log('These changes will help address the "Invalid Refresh Token" error by:');
console.log('1. Adding more robust session checking and refresh handling');
console.log('2. Gracefully handling cases where the refresh token is missing or invalid');
console.log('3. Implementing proper session state management throughout the application');
console.log('4. Providing fallback mechanisms when authentication issues occur');