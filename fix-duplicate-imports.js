/**
 * Fix for Duplicate Imports in AuthContext.tsx
 * 
 * This script addresses the duplicate import errors:
 * "the name `safeQueryWithFallback` is defined multiple times"
 * "the name `createProfileFallback` is defined multiple times"
 * 
 * Run this script with:
 * node fix-duplicate-imports.js
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

// Create a backup of the original file
const backupPath = `${authContextPath}.backup-${Date.now()}`;
fs.copyFileSync(authContextPath, backupPath);
console.log(`Created backup at: ${backupPath}`);

// Read the current content
let content = fs.readFileSync(authContextPath, 'utf8');

// Fix duplicate imports
const importRegex = /import\s+{\s*safeQueryWithFallback,\s*createProfileFallback\s*}\s+from\s+['"]@\/utils\/supabaseErrorHandler['"]/g;
const matches = content.match(importRegex) || [];

if (matches.length > 1) {
  // Keep only the first occurrence and remove the rest
  let firstOccurrence = true;
  content = content.replace(importRegex, (match) => {
    if (firstOccurrence) {
      firstOccurrence = false;
      return match;
    }
    return '// Removed duplicate import';
  });
  
  console.log(`Removed ${matches.length - 1} duplicate imports from AuthContext.tsx`);
} else {
  console.log('No duplicate imports found in AuthContext.tsx');
}

// Fix any other import issues
// Check for incorrect import paths
content = content.replace(/from\s+['"]lib\/supabase['"]/g, 'from "@/lib/supabase"');
content = content.replace(/from\s+['"]utils\/authUtils['"]/g, 'from "@/utils/authUtils"');
content = content.replace(/from\s+['"]utils\/supabaseErrorHandler['"]/g, 'from "@/utils/supabaseErrorHandler"');

// Write the updated content back to the file
fs.writeFileSync(authContextPath, content);
console.log(`Updated AuthContext.tsx with fixed imports`);

// Create a simple test script to verify the fix
const testPath = path.join(__dirname, 'test-imports-fixed.js');
const testContent = `
/**
 * Test script to verify that the import issues in AuthContext.tsx are fixed
 */

import { exec } from 'child_process';

// Run TypeScript check on the file
exec('npx tsc --noEmit src/contexts/AuthContext.tsx', (error, stdout, stderr) => {
  if (error) {
    console.error('TypeScript check failed:');
    console.error(stdout || stderr);
    process.exit(1);
  } else {
    console.log('TypeScript check passed! No duplicate import errors.');
    process.exit(0);
  }
});
`;

fs.writeFileSync(testPath, testContent);
console.log(`Created test script at: ${testPath}`);

console.log('\nFix complete! To verify:');
console.log('1. Run the TypeScript check:');
console.log('   npx tsc --noEmit src/contexts/AuthContext.tsx');
console.log('');
console.log('2. Or restart the development server:');
console.log('   npm run dev');
console.log('');
console.log('The duplicate import errors should now be resolved.');