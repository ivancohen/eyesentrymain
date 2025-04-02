# Comprehensive Guide to Fix All Issues

This guide provides a step-by-step approach to fix all the issues you're encountering in the patient questionnaire, in order of priority.

## Priority Order for Fixes

1. **Supabase 500 Error (Database-Level Fix)** - This is the most critical issue as it's causing actual failures in API calls and affecting core functionality.
2. **Auth Refresh Token Error** - This causes authentication issues when the application tries to refresh expired tokens.
3. **Application-Level Error Handling** - Implement robust error handling to make the application resilient even when Supabase issues occur.
4. **React Router Warnings** - These are just warnings about future changes, not actual errors, so they have the lowest priority.

## Step 1: Fix the Supabase Infinite Recursion Issue (Database-Level)

The 500 errors are caused by an infinite recursion in the Row Level Security (RLS) policy for the profiles table. Follow these steps to fix it:

1. **Access the Supabase Dashboard**
   - Log in to your Supabase dashboard at https://app.supabase.io/
   - Select your project (`gebojeuaeaqmdfrxptqf`)
   - Navigate to the SQL Editor

2. **Identify the Problematic Policy**
   - Run this SQL query:
     ```sql
     SELECT
       schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
     FROM
       pg_policies
     WHERE
       tablename = 'profiles';
     ```
   - Look for policies that might be causing recursion (e.g., policies that reference the profiles table in their conditions)

3. **Drop the Recursive Policy**
   - Replace `policy_name_here` with the actual policy name from Step 2:
     ```sql
     DROP POLICY IF EXISTS "policy_name_here" ON "public"."profiles";
     ```

4. **Create a New, Non-Recursive Policy**
   - Implement a simpler policy that doesn't cause recursion:
     ```sql
     -- Create a simple SELECT policy
     CREATE POLICY "profiles_select_policy" 
     ON "public"."profiles"
     FOR SELECT
     USING (
       -- Simple condition that doesn't cause recursion
       auth.uid() = id OR 
       -- For admins to see all profiles
       EXISTS (
         SELECT 1 FROM auth.users 
         WHERE auth.users.id = auth.uid() 
         AND auth.users.raw_app_meta_data->>'role' = 'admin'
       )
     );

     -- Create separate policies for other operations if needed
     CREATE POLICY "profiles_insert_policy" 
     ON "public"."profiles"
     FOR INSERT
     WITH CHECK (auth.uid() = id);

     CREATE POLICY "profiles_update_policy" 
     ON "public"."profiles"
     FOR UPDATE
     USING (auth.uid() = id)
     WITH CHECK (auth.uid() = id);
     ```

5. **Test the Fix**
   - Run a simple query to test:
     ```sql
     SELECT * FROM profiles LIMIT 1;
     ```
   - Refresh your application and check if the 500 errors are resolved

## Step 2: Fix the Auth Refresh Token Error

The application is encountering an "Invalid Refresh Token: Refresh Token Not Found" error when trying to refresh the authentication token. Follow these steps to fix it:

1. **Update the supabaseErrorHandler.ts file**
   - Modify the executeQuery method to handle refresh token errors more gracefully:
     ```typescript
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
     }
     ```

2. **Create a Session Check Utility**
   - Create a new file named `src/utils/sessionCheck.ts`:
     ```typescript
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
     ```

3. **Update the AuthContext.tsx file**
   - Add a safe profile check method to handle token refresh errors:
     ```typescript
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
     ```

4. **Implement Session Recovery**
   - Add a session recovery mechanism to your main App component:
     ```typescript
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
     }, [user, logout, setUser]);
     ```

## Step 3: Implement Application-Level Error Handling

Even after fixing the database issue, it's good practice to implement robust error handling to make your application resilient to future issues:

1. **Create the Error Handling Utility**
   - Create a file named `src/utils/supabaseErrorHandler.ts` with the content from the `implement-supabase-error-handling.js` script

2. **Update AuthContext.tsx**
   - Modify your AuthContext.tsx file to use the supabaseErrorHandler for profile fetching
   - This will provide fallback functionality when profile queries fail

3. **Update FixedAdminService.ts**
   - Modify your FixedAdminService.ts file to use the supabaseErrorHandler for all profile-related queries
   - This will ensure admin functionality continues to work even during database issues

4. **Test the Changes**
   - Restart your development server
   - Verify that the application works correctly even if you temporarily break the database connection

## Step 4: Fix React Router Warnings

These warnings don't affect functionality but can be addressed to prepare for future React Router versions:

1. **Create a Router Configuration File**
   - Create a file named `src/router/config.js` with the content from the `fix-react-router-warnings.js` script

2. **Update Your BrowserRouter Implementation**
   - Locate where you create your BrowserRouter (likely in your main App.js or index.js file)
   - Update it to use the configuration with future flags

3. **Test the Changes**
   - Restart your development server
   - Check if the warnings are gone from the console

## Verification Steps

After implementing all fixes, perform these verification steps:

1. **Verify Database Fix**
   - Check that no 500 errors appear in the console when fetching profiles
   - Verify that user profiles load correctly

2. **Verify Application Resilience**
   - Temporarily modify a policy in Supabase to cause an error
   - Verify that the application continues to function with fallback values
   - Restore the correct policy

3. **Verify React Router Warnings**
   - Check that no React Router warnings appear in the console

## Conclusion

By following this guide, you've addressed all the issues in order of priority:

1. Fixed the critical Supabase 500 error at the database level
2. Resolved the auth refresh token issues with proper session handling
3. Implemented robust application-level error handling for resilience
4. Addressed React Router warnings to prepare for future versions

This comprehensive approach ensures your application is both functional and future-proof.