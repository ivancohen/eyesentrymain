import { supabase } from '@/lib/supabase';
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
          console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms`);
        }

        const { data, error } = await queryFn();

        if (error) {
          lastError = error;
          console.error(`Supabase query error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
          
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
export const createProfileFallback = supabaseErrorHandler.createProfileFallback.bind(supabaseErrorHandler);