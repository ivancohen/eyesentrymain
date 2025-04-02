/**
 * Authentication utilities for handling Supabase auth operations
 */
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Attempts to refresh the authentication session
 * @returns A promise that resolves to a boolean indicating if the refresh was successful
 */
export const refreshAuthSession = async (): Promise<boolean> => {
  try {
    // First try to get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return false;
    }
    
    if (sessionData.session) {
      console.log('Session exists, no need to refresh');
      return true;
    }
    
    // If no session, try to refresh
    console.log('No session found, attempting to refresh');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('Error refreshing session:', refreshError);
      return false;
    }
    
    if (refreshData.session) {
      console.log('Session refreshed successfully');
      return true;
    }
    
    console.warn('No session after refresh attempt');
    return false;
  } catch (error) {
    console.error('Exception in refreshAuthSession:', error);
    return false;
  }
};

/**
 * Checks if a user is currently authenticated
 * @returns A promise that resolves to a boolean indicating if the user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('Exception in isAuthenticated:', error);
    return false;
  }
};

/**
 * Safely signs out the user, handling any errors
 * @returns A promise that resolves when the sign out is complete
 */
export const safeSignOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
    } else {
      console.log('Signed out successfully');
    }
  } catch (error) {
    console.error('Exception in safeSignOut:', error);
    toast.error('An unexpected error occurred while signing out.');
  }
};

/**
 * Handles common authentication errors and displays appropriate messages
 * @param error The error to handle
 * @returns A user-friendly error message
 */
export const handleAuthError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  // Map common error messages to user-friendly messages
  if (errorMsg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  } else if (errorMsg.includes('Email not confirmed')) {
    return 'Please verify your email before logging in. Check your inbox for the verification link.';
  } else if (errorMsg.includes('Invalid Refresh Token')) {
    return 'Your session has expired. Please log in again.';
  } else if (errorMsg === 'ACCOUNT_SUSPENDED') {
    return 'Your account has been suspended. Please contact support for assistance.';
  } else if (errorMsg.includes('Failed to verify account status')) {
    return 'Unable to verify account status. Please try again later.';
  }
  
  return `Authentication error: ${errorMsg}`;
};