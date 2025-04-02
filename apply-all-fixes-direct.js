/**
 * Script to apply all fixes directly
 * This script will:
 * 1. Create the session check utility
 * 2. Create the Supabase error handler
 * 3. Create the React Router config
 * 4. Update the BrowserRouter implementation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Create the utils directory if it doesn't exist
createDirIfNotExists(path.resolve('src/utils'));

// Create the router directory if it doesn't exist
createDirIfNotExists(path.resolve('src/router'));

// 1. Create the session check utility
console.log('Creating session check utility...');
const sessionCheckContent = `import { supabase } from '@/lib/supabase';

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
};`;

fs.writeFileSync(path.resolve('src/utils/sessionCheck.ts'), sessionCheckContent, 'utf8');
console.log('Created src/utils/sessionCheck.ts');

// 2. Create the Supabase error handler
console.log('Creating Supabase error handler...');
const supabaseErrorHandlerContent = `import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ensureValidSession } from './sessionCheck';

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

    // First ensure we have a valid session
    await ensureValidSession();

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
   * @param email Optional email to include in the profile
   * @param metadata Optional user metadata to include in the profile
   * @returns A minimal profile object
   */
  createMinimalProfile(userId: string, email?: string, metadata?: any) {
    return {
      id: userId,
      is_suspended: false,
      is_admin: metadata?.is_admin || false,
      is_doctor: metadata?.is_doctor || false,
      email: email || '',
      name: metadata?.name || email?.split('@')[0] || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  /**
   * Safe query with fallback - a simpler version of executeQuery for backward compatibility
   * @param queryFn Function that returns a Supabase query
   * @param fallbackValue Value to return if the query fails
   * @param maxRetries Maximum number of retry attempts
   * @param logErrors Whether to log errors to the console
   * @returns Query result or fallback value
   */
  async safeQueryWithFallback<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallbackValue: T,
    maxRetries = 0,
    logErrors = true
  ): Promise<T> {
    return this.executeQuery(queryFn, fallbackValue, maxRetries);
  },

  /**
   * Create a profile fallback - for backward compatibility
   * @param userId The user ID
   * @param email Optional email to include in the profile
   * @param metadata Optional user metadata to include in the profile
   * @returns A minimal profile object
   */
  createProfileFallback(userId: string, email?: string, metadata?: any) {
    return this.createMinimalProfile(userId, email, metadata);
  }
};

export const safeQueryWithFallback = supabaseErrorHandler.safeQueryWithFallback.bind(supabaseErrorHandler);
export const createProfileFallback = supabaseErrorHandler.createProfileFallback.bind(supabaseErrorHandler);`;

fs.writeFileSync(path.resolve('src/utils/supabaseErrorHandler.ts'), supabaseErrorHandlerContent, 'utf8');
console.log('Created src/utils/supabaseErrorHandler.ts');

// 3. Create the React Router config
console.log('Creating React Router config...');
const routerConfigContent = `// React Router configuration with future flags
export const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};`;

fs.writeFileSync(path.resolve('src/router/config.js'), routerConfigContent, 'utf8');
console.log('Created src/router/config.js');

// 4. Update the BrowserRouter implementation
console.log('Updating BrowserRouter implementation...');

// Define the file to update
const indexFilePath = path.resolve('src/index.tsx');

// Check if the file exists
if (fs.existsSync(indexFilePath)) {
  // Read the file content
  let indexContent = fs.readFileSync(indexFilePath, 'utf8');

  // Check if the router config is already imported
  if (!indexContent.includes('import { routerConfig } from')) {
    // Add the import for routerConfig
    indexContent = indexContent.replace(
      /import {(.+?)} from ['"]react-router-dom['"];/,
      `import {$1, BrowserRouter } from 'react-router-dom';\nimport { routerConfig } from './router/config';`
    );
  }

  // Update the BrowserRouter usage
  if (indexContent.includes('<BrowserRouter>')) {
    indexContent = indexContent.replace(
      /<BrowserRouter>/g,
      '<BrowserRouter future={routerConfig.future}>'
    );
  }

  // Write the updated content back to the file
  fs.writeFileSync(indexFilePath, indexContent, 'utf8');
  console.log(`Updated ${indexFilePath} to use future flags`);
} else {
  console.log(`File not found: ${indexFilePath}`);
}

// Now check for createBrowserRouter usage
const appFilePath = path.resolve('src/App.tsx');
if (fs.existsSync(appFilePath)) {
  let appContent = fs.readFileSync(appFilePath, 'utf8');
  
  // Check if createBrowserRouter is used
  if (appContent.includes('createBrowserRouter')) {
    // Check if the router config is already imported
    if (!appContent.includes('import { routerConfig } from')) {
      // Add the import for routerConfig
      appContent = appContent.replace(
        /import {(.+?)} from ['"]react-router-dom['"];/,
        `import {$1} from 'react-router-dom';\nimport { routerConfig } from './router/config';`
      );
    }
    
    // Update the createBrowserRouter usage
    appContent = appContent.replace(
      /createBrowserRouter\(\[/g,
      'createBrowserRouter([',
    );
    
    // Add the future flags to the options
    appContent = appContent.replace(
      /createBrowserRouter\(\[(.+?)\]\)/s,
      'createBrowserRouter([$1], { future: routerConfig.future })'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(appFilePath, appContent, 'utf8');
    console.log(`Updated ${appFilePath} to use future flags`);
  }
}

console.log('\n=== All fixes have been applied! ===');
console.log('1. Created session check utility');
console.log('2. Created Supabase error handler');
console.log('3. Created React Router config');
console.log('4. Updated BrowserRouter implementation');
console.log('\nPlease restart your development server to see the changes.');