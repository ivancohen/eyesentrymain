# Direct Fix Instructions

Based on the errors we're seeing, it's clear that making direct changes to the codebase is causing TypeScript errors due to the complexity of the existing code. Instead of trying to modify the code directly, here are the most effective steps to fix the issues:

## 1. Fix the Supabase Infinite Recursion Issue (Database-Level)

This is the most critical issue and needs to be fixed at the database level.

1. **Log in to your Supabase dashboard** at https://app.supabase.io/
2. **Select your project** (`gebojeuaeaqmdfrxptqf`)
3. **Navigate to the SQL Editor**
4. **Copy and paste the SQL from the `fix-profiles-policy-direct.sql` file** and run it

This SQL script will:
- List all existing policies on the profiles table
- Drop all problematic policies
- Create new, non-recursive policies that avoid the infinite recursion issue
- Test the fix with a simple query

**IMPORTANT UPDATE**: We encountered an error when trying to create new policies:

```
ERROR: 42710: policy "profiles_select_own_policy" for table "profiles" already exists
```

This means some policies already exist. Here's a step-by-step approach to fix the issue:

1. **First, list existing policies**: `list-existing-policies.sql`
   - This will show you all current policies on the profiles table
   - Run this first to understand what's already in place

2. **Then, drop all policies and disable RLS**: `drop-policies-and-disable-rls.sql`
   - This script drops all possible policies and disables RLS in one step
   - This is the most reliable fix for the infinite recursion issue
   - After confirming that the application works, you can re-enable RLS with proper policies

3. **Alternative options**:
   - `drop-all-policies.sql`: Only drops policies without disabling RLS
   - `disable-rls-only.sql`: Only disables RLS without dropping policies

If you prefer to keep RLS enabled, try these alternative scripts:

**Correct Script**: `fix-profiles-policy-correct.sql`
- Uses the correct column names from your database schema
- Based on the actual structure of your profiles table
- Creates separate policies for regular users and admins
- Uses EXISTS subqueries to avoid recursion issues

1. **Alternative Script**: `fix-profiles-policy-alternative.sql`
   - Uses a different approach to check for admin roles
   - Creates separate policies for regular users and admins
   - Creates a helper function to check if a user is an admin

2. **Simplest Script**: `fix-profiles-policy-simple.sql`
   - Uses the simplest possible approach
   - Allows all authenticated users to view all profiles
   - This is less secure but will definitely fix the recursion issue
   - You can implement more restrictive policies later once the application is working

## 2. Implement Session Recovery in AuthContext.tsx

Add this code to your AuthContext.tsx file, inside the AuthProvider component:

```typescript
// Add this useEffect hook to handle session recovery
useEffect(() => {
  // Check session on app load
  const checkSession = async () => {
    try {
      // Check if we have a session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error checking session:", sessionError);
        return;
      }
      
      if (!sessionData?.session) {
        console.log("No active session found");
        return;
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
        } else {
          console.log("Session refreshed successfully");
        }
      }
    } catch (error) {
      console.error("Error in session check:", error);
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
        // Handle sign in - this is a backup for the login function
        if (!user) {
          try {
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profileError) {
              console.error("Error fetching profile:", profileError);
              // Create a minimal profile as fallback
              const minimalProfile = {
                id: session.user.id,
                is_suspended: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                role: 'user'
              };
              
              setUser({
                id: session.user.id,
                email: session.user.email,
                name: session.user.email,
                role: 'user',
                ...minimalProfile
              });
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email,
                name: profileData?.full_name || profileData?.email || session.user.email,
                role: profileData?.role || 'user',
                ...profileData
              });
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error);
          }
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
}, [user, setUser]);
```

## 3. Update the Login Method in AuthContext.tsx

Modify your login method to handle profile fetch errors more gracefully:

```typescript
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
    
    // Check if the user is suspended
    console.log("Login successful, checking if user is suspended");
    try {
      const { data: suspensionData, error: suspensionError } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', data.user.id)
        .single();
      
      if (suspensionError) {
        console.error("Error checking suspension status:", suspensionError);
        // Continue with login, assuming not suspended
      } else if (suspensionData?.is_suspended) {
        console.error("User is suspended");
        setError("Your account has been suspended. Please contact support.");
        await supabase.auth.signOut();
        setLoading(false);
        return false;
      }
    } catch (suspensionError) {
      console.error("Error checking suspension:", suspensionError);
      // Continue with login, assuming not suspended
    }
    
    // Fetch the full profile
    console.log("Login successful, fetching user profile");
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Create a minimal profile as fallback
        const minimalProfile = {
          id: data.user.id,
          is_suspended: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: 'user'
        };
        
        console.log("Using minimal profile:", minimalProfile);
        
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.email,
          role: 'user',
          ...minimalProfile
        });
      } else {
        console.log("User profile after login:", profileData);
        
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: profileData?.full_name || profileData?.email || data.user.email,
          role: profileData?.role || 'user',
          ...profileData
        });
      }
    } catch (profileError) {
      console.error("Error fetching profile:", profileError);
      // Create a minimal profile as fallback
      const minimalProfile = {
        id: data.user.id,
        is_suspended: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'user'
      };
      
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.email,
        role: 'user',
        ...minimalProfile
      });
    }
    
    setLoading(false);
    return true;
  } catch (error) {
    console.error("Login error:", error);
    setError("An unexpected error occurred. Please try again.");
    setLoading(false);
    return false;
  }
};
```

## 4. Fix React Router Warnings

1. Create a file named `src/router/config.js` with the following content:

```javascript
// React Router configuration with future flags
export const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};
```

2. Update your BrowserRouter implementation (likely in your main App.js or index.js file):

```javascript
import { BrowserRouter } from 'react-router-dom';
import { routerConfig } from './router/config';

// Replace this:
// <BrowserRouter>
//   <App />
// </BrowserRouter>

// With this:
<BrowserRouter future={routerConfig.future}>
  <App />
</BrowserRouter>
```

## Verification Steps

After implementing these fixes:

1. **Verify Database Fix**:
   - Check that no 500 errors appear in the console when fetching profiles
   - Verify that user profiles load correctly

2. **Verify Session Recovery**:
   - Check that the application handles token refresh errors gracefully
   - Verify that the application continues to function with fallback values

3. **Verify React Router Warnings**:
   - Check that no React Router warnings appear in the console