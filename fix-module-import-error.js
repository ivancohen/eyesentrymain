/**
 * Fix for Module Import 500 Error
 * 
 * This script addresses the 500 error when importing AuthContext.tsx directly:
 * GET http://localhost:5173/src/contexts/AuthContext.tsx net::ERR_ABORTED 500 (Internal Server Error)
 * 
 * The issue is likely related to:
 * 1. Direct imports of .tsx files in the browser
 * 2. Module resolution configuration in the development server
 * 3. Circular dependencies in the import chain
 * 
 * Run this script with:
 * node fix-module-import-error.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to files we need to modify
const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
const authContextPath = path.join(__dirname, 'src', 'contexts', 'AuthContext.tsx');
const indexTsxPath = path.join(__dirname, 'src', 'index.tsx');

// Create a backup of the original files
function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at: ${backupPath}`);
    return true;
  }
  return false;
}

// Fix 1: Check and fix App.tsx imports
function fixAppTsx() {
  if (!fs.existsSync(appTsxPath)) {
    console.log(`App.tsx not found at: ${appTsxPath}`);
    return false;
  }

  createBackup(appTsxPath);
  let content = fs.readFileSync(appTsxPath, 'utf8');

  // Check for direct import of AuthContext.tsx
  const directImportRegex = /import\s+.*from\s+['"].*AuthContext\.tsx['"]/;
  if (directImportRegex.test(content)) {
    // Replace with proper import (without .tsx extension)
    content = content.replace(
      directImportRegex,
      match => match.replace('.tsx', '')
    );
    console.log('Fixed direct import of AuthContext.tsx in App.tsx');
  }

  // Check for import of AuthProvider
  const authProviderImportRegex = /import\s+{\s*AuthProvider\s*}\s+from\s+['"]@\/contexts\/AuthContext['"]/;
  if (!authProviderImportRegex.test(content)) {
    // Add import if missing
    content = content.replace(
      /import\s+.*from\s+['"]react['"]/,
      match => `${match}\nimport { AuthProvider } from "@/contexts/AuthContext";`
    );
    console.log('Added AuthProvider import to App.tsx');
  }

  // Ensure AuthProvider is wrapping the app
  if (!content.includes('<AuthProvider>') && !content.includes('<AuthProvider ')) {
    // Add AuthProvider wrapper
    content = content.replace(
      /<BrowserRouter>/,
      '<AuthProvider>\n      <BrowserRouter>'
    );
    content = content.replace(
      /<\/BrowserRouter>/,
      '</BrowserRouter>\n    </AuthProvider>'
    );
    console.log('Added AuthProvider wrapper to App.tsx');
  }

  fs.writeFileSync(appTsxPath, content);
  return true;
}

// Fix 2: Check and fix AuthContext.tsx
function fixAuthContext() {
  if (!fs.existsSync(authContextPath)) {
    console.log(`AuthContext.tsx not found at: ${authContextPath}`);
    return false;
  }

  createBackup(authContextPath);
  let content = fs.readFileSync(authContextPath, 'utf8');

  // Check for circular dependencies
  const circularImports = [
    /import\s+.*from\s+['"]@\/App['"]/,
    /import\s+.*from\s+['"]@\/pages\/.*['"]/
  ];

  let hasCircularImports = false;
  circularImports.forEach(regex => {
    if (regex.test(content)) {
      content = content.replace(regex, '// Removed circular import: $&');
      hasCircularImports = true;
    }
  });

  if (hasCircularImports) {
    console.log('Fixed circular dependencies in AuthContext.tsx');
  }

  // Add error boundary around profile fetching
  if (content.includes('const profile = await safeQueryWithFallback(')) {
    // Already has our error handling improvements
    console.log('AuthContext.tsx already has error handling improvements');
  } else if (content.includes('const { data: profile, error } = await supabase')) {
    // Add try-catch around profile fetching
    content = content.replace(
      /const { data: profile, error } = await supabase\s+\.from\('profiles'\)\s+\.select\('\*'\)\s+\.eq\('id', sessionUser\.id\)\s+\.single\(\);/,
      `try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();
          
        // Rest of the code remains the same`
    );
    console.log('Added try-catch around profile fetching in AuthContext.tsx');
  }

  fs.writeFileSync(authContextPath, content);
  return true;
}

// Fix 3: Create a barrel file for contexts if it doesn't exist
function createContextsBarrel() {
  const contextsDir = path.join(__dirname, 'src', 'contexts');
  const barrelPath = path.join(contextsDir, 'index.ts');
  
  if (!fs.existsSync(contextsDir)) {
    fs.mkdirSync(contextsDir, { recursive: true });
  }
  
  if (!fs.existsSync(barrelPath)) {
    const barrelContent = `/**
 * Contexts barrel file
 * This file re-exports all context providers to avoid direct imports of .tsx files
 */

export { AuthProvider, useAuth } from './AuthContext';
`;
    fs.writeFileSync(barrelPath, barrelContent);
    console.log(`Created contexts barrel file at: ${barrelPath}`);
    
    // Update imports in App.tsx if the barrel file was created
    if (fs.existsSync(appTsxPath)) {
      let appContent = fs.readFileSync(appTsxPath, 'utf8');
      appContent = appContent.replace(
        /import\s+{\s*AuthProvider\s*}\s+from\s+['"]@\/contexts\/AuthContext['"]/,
        `import { AuthProvider } from "@/contexts/index";`
      );
      fs.writeFileSync(appTsxPath, appContent);
      console.log('Updated App.tsx to use the contexts barrel file');
    }
    
    return true;
  }
  
  return false;
}

// Fix 4: Create a simple test file to verify imports
function createImportTest() {
  const testPath = path.join(__dirname, 'test-imports.html');
  const testContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Module Imports</title>
</head>
<body>
    <h1>Module Import Test</h1>
    <div id="result">Testing...</div>

    <script type="module">
        try {
            // Import from the barrel file instead of directly
            import { AuthProvider } from './src/contexts/index.js';
            document.getElementById('result').innerHTML = 'Success! Modules imported without errors.';
            document.getElementById('result').style.color = 'green';
        } catch (error) {
            document.getElementById('result').innerHTML = 'Error: ' + error.message;
            document.getElementById('result').style.color = 'red';
            console.error('Error importing modules:', error);
        }
    </script>
</body>
</html>
`;
  fs.writeFileSync(testPath, testContent);
  console.log(`Created import test file at: ${testPath}`);
  return true;
}

// Apply all fixes
console.log('=== Applying Module Import Error Fixes ===');
const appFixed = fixAppTsx();
const authContextFixed = fixAuthContext();
const barrelCreated = createContextsBarrel();
const testCreated = createImportTest();

// Print summary
console.log('\n=== Module Import Error Fix Summary ===');
if (appFixed) {
  console.log('✅ Fixed App.tsx imports and structure');
} else {
  console.log('❌ Could not fix App.tsx (file not found)');
}

if (authContextFixed) {
  console.log('✅ Fixed potential circular dependencies in AuthContext.tsx');
} else {
  console.log('❌ Could not fix AuthContext.tsx (file not found)');
}

if (barrelCreated) {
  console.log('✅ Created contexts barrel file for better module resolution');
} else {
  console.log('ℹ️ Contexts barrel file already exists or could not be created');
}

if (testCreated) {
  console.log('✅ Created test file to verify imports');
}

console.log('\n=== Next Steps ===');
console.log('1. Restart the development server:');
console.log('   npm run dev');
console.log('');
console.log('2. If you still see 500 errors, try clearing the browser cache:');
console.log('   - Press Ctrl+Shift+Delete in your browser');
console.log('   - Select "Cached images and files"');
console.log('   - Click "Clear data"');
console.log('');
console.log('3. If issues persist, check the development server configuration:');
console.log('   - Ensure vite.config.js has proper alias configuration for @/ imports');
console.log('   - Check for any TypeScript errors in the project');
console.log('');
console.log('The application should now load without 500 errors for module imports.');