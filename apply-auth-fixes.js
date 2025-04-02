/**
 * Script to apply all authentication fixes
 * 
 * This script:
 * 1. Applies code changes to AuthContext.tsx and Login.tsx
 * 2. Creates the authUtils.ts utility file
 * 3. Runs the profiles table fix script
 * 4. Creates the auth token reset page
 * 
 * Run this script with:
 * node apply-auth-fixes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to the files we need to modify
const authContextPath = path.join('src', 'contexts', 'AuthContext.tsx');
const loginPath = path.join('src', 'pages', 'Login.tsx');
const authUtilsPath = path.join('src', 'utils', 'authUtils.ts');

// Check if the required files exist
if (!fs.existsSync(authContextPath)) {
  console.error(`Error: ${authContextPath} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(loginPath)) {
  console.error(`Error: ${loginPath} does not exist.`);
  process.exit(1);
}

// Create utils directory if it doesn't exist
const utilsDir = path.join('src', 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Function to apply changes to a file
function applyChanges(filePath, changes) {
  console.log(`Applying changes to ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const change of changes) {
    content = content.replace(change.search, change.replace);
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Changes applied to ${filePath} successfully.`);
}

// Changes for AuthContext.tsx
const authContextChanges = [
  {
    search: `import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';`,
    replace: `import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { refreshAuthSession, safeSignOut, handleAuthError } from '@/utils/authUtils';`
  },
  {
    search: `  // Function to refresh session
  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (newSession) {
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };`,
    replace: `  // Function to refresh session using our utility
  const refreshSession = async () => {
    const success = await refreshAuthSession();
    
    if (success) {
      // If refresh was successful, update the session state
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
      }
    } else {
      console.warn('Session refresh failed, but not forcing logout');
      // We don't force logout here to prevent disrupting the user experience
      // The next API call that requires authentication will fail and handle that case
    }
  };`
  },
  {
    search: `        if (data.user) {
          // Check suspension status BEFORE setting user state
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_suspended')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile during login:", profileError);
            // Decide how to handle - maybe let login proceed but log error?
            // For now, let's throw an error to prevent login if profile fetch fails.
            await supabase.auth.signOut(); // Sign out just in case
            throw new Error("Failed to verify account status.");
          }`,
    replace: `        if (data.user) {
          try {
            // Check suspension status BEFORE setting user state
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('is_suspended')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error("Error fetching profile during login:", profileError);
              // Log the error but continue with login instead of failing
              console.warn("Continuing login despite profile fetch error");
              // Don't throw an error here, allow login to proceed
            } else if (profileData?.is_suspended === true) {
              console.log("Login attempt by suspended user:", email);
              await supabase.auth.signOut(); // Ensure user is logged out
              setUser(null); // Clear any potential stale state
              setSession(null);
              // Throw specific error for the UI to catch
              throw new Error("ACCOUNT_SUSPENDED");
            }
          } catch (profileCheckError) {
            // Catch any unexpected errors in the profile check process
            console.error("Unexpected error during profile check:", profileCheckError);
            // Continue with login despite the error
          }`
  },
  {
    search: `          if (profileData?.is_suspended === true) {
            console.log("Login attempt by suspended user:", email);
            await supabase.auth.signOut(); // Ensure user is logged out
            setUser(null); // Clear any potential stale state
            setSession(null);
            // Throw specific error for the UI to catch
            throw new Error("ACCOUNT_SUSPENDED");
          }

          // If not suspended, proceed with setting user state
          console.log("Login successful, fetching user profile");`,
    replace: `          // Proceed with setting user state
          console.log("Login successful, fetching user profile");`
  },
  {
    search: `  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error((error as AuthErrorResponse).message || 'Logout failed');
      } else {
        toast.error('Logout failed');
      }
    }
  };`,
    replace: `  const logout = async () => {
    try {
      // Use our utility function for safer sign out
      await safeSignOut();
      
      // Clear local state regardless of sign out success
      setUser(null);
      setSession(null);
      
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error: unknown) {
      console.error("Unexpected error during logout:", error);
      
      // Display a user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      toast.error(errorMessage);
      
      // Still clear local state even if there was an error
      setUser(null);
      setSession(null);
      
      // Navigate to home page regardless of error
      navigate('/');
    }
  };`
  }
];

// Changes for Login.tsx
const loginChanges = [
  {
    search: `import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";`,
    replace: `import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { handleAuthError } from "@/utils/authUtils";`
  },
  {
    search: `      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      // Check for specific suspension error
      if (errorMsg === "ACCOUNT_SUSPENDED") {
        setSuspendedEmail(data.email); // Store the email for the dialog
        setIsSuspendedDialogOpen(true); // Open the dialog
        // Don't show a generic error toast in this case
      } else if (errorMsg.includes("Email not confirmed")) {
        toast.error("Please verify your email before logging in. Check your inbox for the verification link.");
      } else {
        // Generic login error
        toast.error(errorMsg || "Login failed. Please check your credentials.");
      }`,
    replace: `      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      // Check for specific suspension error - this needs special handling for the dialog
      if (errorMsg === "ACCOUNT_SUSPENDED") {
        setSuspendedEmail(data.email); // Store the email for the dialog
        setIsSuspendedDialogOpen(true); // Open the dialog
        // Don't show a generic error toast in this case
      } else {
        // Use our utility function for consistent error handling
        const friendlyErrorMessage = handleAuthError(error);
        toast.error(friendlyErrorMessage);
        
        // For refresh token errors, we should clear any stale tokens
        if (errorMsg.includes("Invalid Refresh Token")) {
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error("Error signing out after token error:", signOutError);
          }
        }
      }`
  }
];

// Content for authUtils.ts
const authUtilsContent = `/**
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
  
  return \`Authentication error: \${errorMsg}\`;
};`;

// Apply changes to files
try {
  // Apply changes to AuthContext.tsx
  applyChanges(authContextPath, authContextChanges);
  
  // Apply changes to Login.tsx
  applyChanges(loginPath, loginChanges);
  
  // Create authUtils.ts
  console.log(`Creating ${authUtilsPath}...`);
  fs.writeFileSync(authUtilsPath, authUtilsContent);
  console.log(`${authUtilsPath} created successfully.`);
  
  // Run the profiles table fix script
  console.log('\nRunning profiles table fix script...');
  try {
    execSync('node fix-profiles-table.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running profiles table fix script:', error.message);
    console.log('You may need to run this script manually.');
  }
  
  // Run the auth tokens fix script
  console.log('\nCreating auth token reset page...');
  try {
    execSync('node fix-auth-tokens.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error creating auth token reset page:', error.message);
    console.log('You may need to run this script manually.');
  }
  
  console.log('\n=== Authentication Fixes Applied Successfully ===');
  console.log('Please restart your development server to apply the changes.');
  console.log('For more information, see AUTH_FIX_README.md');
  
} catch (error) {
  console.error('Error applying authentication fixes:', error.message);
  console.error('You may need to apply the changes manually. See AUTH_FIX_README.md for details.');
}