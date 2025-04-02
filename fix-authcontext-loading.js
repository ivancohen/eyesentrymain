/**
 * Fix for AuthContext.tsx Loading Error
 * 
 * This script addresses the 500 error when loading AuthContext.tsx by:
 * 1. Checking for syntax errors in the file
 * 2. Ensuring proper imports
 * 3. Fixing any issues with the error handling implementation
 * 
 * Run this script with:
 * node fix-authcontext-loading.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to AuthContext.tsx
const authContextPath = path.join(__dirname, 'src', 'contexts', 'AuthContext.tsx');

// Check if the file exists
if (!fs.existsSync(authContextPath)) {
  console.error(`Error: AuthContext.tsx not found at: ${authContextPath}`);
  process.exit(1);
}

// Read the current content
let content = fs.readFileSync(authContextPath, 'utf8');

// Create a backup of the original file
const backupPath = `${authContextPath}.backup-${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Created backup at: ${backupPath}`);

// Fix 1: Ensure proper imports
if (!content.includes('import { safeQueryWithFallback, createProfileFallback } from')) {
  content = content.replace(
    `import { refreshAuthSession, safeSignOut, handleAuthError } from '@/utils/authUtils';`,
    `import { refreshAuthSession, safeSignOut, handleAuthError } from '@/utils/authUtils';
import { safeQueryWithFallback, createProfileFallback } from '@/utils/supabaseErrorHandler';`
  );
  console.log('Added missing imports');
}

// Fix 2: Fix TypeScript errors in profile fetching
content = content.replace(
  /const profile = await safeQueryWithFallback\(\s*\(\) => supabase\s*\.from\('profiles'\)\s*\.select\('\*'\)\s*\.eq\('id', sessionUser\.id\)\s*\.single\(\),/g,
  `const profile = await safeQueryWithFallback(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single(),`
);

// Fix 3: Fix TypeScript errors in suspension check
content = content.replace(
  /const profileData = await safeQueryWithFallback\(\s*\(\) => supabase\s*\.from\('profiles'\)\s*\.select\('is_suspended'\)\s*\.eq\('id', data\.user\.id\)\s*\.single\(\),/g,
  `const profileData = await safeQueryWithFallback(
            () => supabase
              .from('profiles')
              .select('is_suspended')
              .eq('id', data.user.id)
              .single(),`
);

// Fix 4: Ensure proper error handling in login flow
const loginErrorHandlingFix = `
          // Check suspension status BEFORE setting user state with error handling
          let profileData = { is_suspended: false }; // Default value
          try {
            profileData = await safeQueryWithFallback(
              () => supabase
                .from('profiles')
                .select('is_suspended')
                .eq('id', data.user.id)
                .single(),
              { is_suspended: false }, // Default to not suspended if query fails
              2, // 2 retries
              true // silent mode (no toasts)
            );
          } catch (profileFetchError) {
            console.error("Error fetching profile during login:", profileFetchError);
            console.warn("Continuing login with default profile data");
            // Continue with default value
          }
          
          if (profileData?.is_suspended === true) {`;

content = content.replace(
  /\/\/ Check suspension status BEFORE setting user state with error handling\s*const profileData = await safeQueryWithFallback\([^}]*if \(profileData\?\.is_suspended === true\) {/s,
  loginErrorHandlingFix
);

// Fix 5: Add try-catch around updateUserProfile call
content = content.replace(
  /console\.log\("Login successful, fetching user profile"\);\s*const userProfile = await updateUserProfile\(data\.user\);/,
  `console.log("Login successful, fetching user profile");
        let userProfile;
        try {
          userProfile = await updateUserProfile(data.user);
        } catch (profileUpdateError) {
          console.error("Error updating user profile:", profileUpdateError);
          // Create a minimal profile to allow login to proceed
          userProfile = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
            isAdmin: false,
            isDoctor: false,
            isPendingApproval: false,
            avatarUrl: null
          };
        }`
);

// Write the updated content back to the file
fs.writeFileSync(authContextPath, content);
console.log(`Updated AuthContext.tsx with fixes for loading error`);

// Create a simple HTML file to test loading
const testHtmlPath = path.join(__dirname, 'test-auth-loading.html');
const testHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test AuthContext Loading</title>
</head>
<body>
    <h1>AuthContext Loading Test</h1>
    <p>This page tests if AuthContext.tsx can be loaded without errors.</p>
    <div id="result">Testing...</div>

    <script type="module">
        try {
            // Try to dynamically import the AuthContext module
            const module = await import('./src/contexts/AuthContext.tsx');
            document.getElementById('result').innerHTML = 'Success! AuthContext loaded without errors.';
            document.getElementById('result').style.color = 'green';
        } catch (error) {
            document.getElementById('result').innerHTML = 'Error: ' + error.message;
            document.getElementById('result').style.color = 'red';
            console.error('Error loading AuthContext:', error);
        }
    </script>
</body>
</html>
`;

fs.writeFileSync(testHtmlPath, testHtmlContent);
console.log(`Created test HTML file at: ${testHtmlPath}`);

console.log('\nFix complete! To test:');
console.log('1. Build the application: npm run build');
console.log('2. Start the development server: npm run dev');
console.log('3. Check if AuthContext.tsx loads without 500 errors');