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