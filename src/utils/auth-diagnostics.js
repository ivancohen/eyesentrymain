/**
 * EyeSentry Authentication Diagnostics Tool
 * 
 * This utility helps diagnose authentication issues, particularly:
 * - Auth state stuck in loading
 * - Admin redirection issues
 * - Supabase session problems
 */

// Run this in the browser console to diagnose auth issues
(function runAuthDiagnostics() {
  console.log('========== EyeSentry Auth Diagnostics ==========');
  
  // Check if Supabase is loaded
  if (!window.supabase) {
    console.error('❌ Supabase client not found on window object');
    console.log('Solution: Make sure the supabase client is properly initialized');
    return;
  }
  
  // Check localStorage for any Supabase session
  const localStorageKeys = Object.keys(localStorage);
  const supabaseKeys = localStorageKeys.filter(k => k.includes('supabase'));
  
  console.log('🔍 Found Supabase localStorage keys:', supabaseKeys);
  
  // Extract current session from localStorage
  let currentSession = null;
  const sessionKey = supabaseKeys.find(k => k.includes('session'));
  
  if (sessionKey) {
    try {
      const sessionData = JSON.parse(localStorage.getItem(sessionKey));
      console.log('✅ Found session data:', sessionData);
      currentSession = sessionData;
      
      // Verify session expiry
      const expiresAt = new Date(sessionData.expires_at * 1000);
      const now = new Date();
      
      if (expiresAt < now) {
        console.error(`❌ Session expired at ${expiresAt.toLocaleString()}`);
        console.log('Solution: Log out and log back in to refresh your session');
      } else {
        console.log(`✅ Session valid until ${expiresAt.toLocaleString()}`);
      }
      
      // Check user data
      if (sessionData.user) {
        console.log('✅ User data found in session:', {
          id: sessionData.user.id,
          email: sessionData.user.email,
          role: sessionData.user.role,
          aud: sessionData.user.aud
        });
        
        // Check for admin role/email
        const userEmail = sessionData.user.email;
        const userRole = sessionData.user.role;
        const adminEmails = ['ivan.s.cohen@gmail.com']; // Add all admin emails here
        
        if (userRole === 'admin' || adminEmails.includes(userEmail)) {
          console.log('✅ User should have admin privileges');
        } else {
          console.log('ℹ️ User does not have admin privileges based on email/role');
        }
      } else {
        console.error('❌ No user data in session');
      }
    } catch (error) {
      console.error('❌ Error parsing session data:', error);
    }
  } else {
    console.error('❌ No session found in localStorage');
    console.log('Solution: You may need to log in again');
  }
  
  // Check for auth context in React devtools
  console.log('🔍 Checking for React context issues...');
  console.log('ℹ️ To debug React context, use React DevTools and check:');
  console.log('   1. Find <AuthProvider> in the component tree');
  console.log('   2. Verify its state includes: user, loading, isAdmin, etc.');
  console.log('   3. If loading is stuck true, it may indicate an issue with Supabase auth callbacks');
  
  // Check for React Router issues
  console.log('🔍 Checking React Router navigation...');
  console.log('Current location:', window.location.pathname);
  
  // Suggest history debug
  console.log('ℹ️ To check React Router history:');
  console.log('   Run this in console: window.history');
  
  // Network request checking
  console.log('🔍 Check Network tab for auth issues:');
  console.log('   1. Look for any 401 Unauthorized responses');
  console.log('   2. Check for CORS errors that might affect authentication');
  console.log('   3. Verify Supabase API requests are completing successfully');
  
  // Remediation steps
  console.log('\n========== Remediation Steps ==========');
  console.log('1. Clear localStorage and log in again:');
  console.log('   localStorage.clear(); window.location.href="/login"');
  console.log('2. Ensure no browser extensions are blocking authentication:');
  console.log('   Try in incognito mode or with extensions disabled');
  console.log('3. Verify Supabase project settings:');
  console.log('   Check URL and API keys in supabase-client.ts');
  console.log('4. Check for issues with browser storage:');
  console.log('   Some privacy settings/extensions may block localStorage');
  
  console.log('========== Diagnostics Complete ==========');
  
  return {
    sessionFound: !!sessionKey,
    sessionActive: currentSession && new Date(currentSession.expires_at * 1000) > new Date(),
    userFound: currentSession && !!currentSession.user,
    location: window.location.pathname
  };
})();
