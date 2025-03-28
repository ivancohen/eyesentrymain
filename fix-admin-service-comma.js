// Script to fix the specific comma issue in FixedAdminService.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the file with errors
const fixedAdminServicePath = path.join(__dirname, 'src', 'services', 'FixedAdminService.ts');

console.log("Fixing comma issue in FixedAdminService.ts...");

if (!fs.existsSync(fixedAdminServicePath)) {
  console.error(`Error: File not found at ${fixedAdminServicePath}`);
  process.exit(1);
}

// Create a backup of the file
const backupPath = path.join(__dirname, 'typescript-fix-backups', 'FixedAdminService.ts.backup6');
fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.copyFileSync(fixedAdminServicePath, backupPath);
console.log(`Created backup at: ${backupPath}`);

// Read the file content
let content = fs.readFileSync(fixedAdminServicePath, 'utf8');

// Find the last method before the problematic section
const lastMethodIndex = content.lastIndexOf("getUniqueLocations");
if (lastMethodIndex === -1) {
  console.error("Could not find the getUniqueLocations method");
  process.exit(1);
}

// Find the end of the getUniqueLocations method
const methodEndRegex = /getUniqueLocations.*?}(\s*)\}/s;
const methodEndMatch = content.match(methodEndRegex);
if (!methodEndMatch) {
  console.error("Could not find the end of the getUniqueLocations method");
  process.exit(1);
}

// Get the position right after the method ends
const endOfMethod = content.indexOf(methodEndMatch[0]) + methodEndMatch[0].length;

// Split the content at that position
const beforeMethods = content.substring(0, endOfMethod);
const afterMethods = content.substring(endOfMethod);

// Insert a comma after the getUniqueLocations method
const fixedContent = beforeMethods + "," + afterMethods;

// Write the fixed content back to the file
fs.writeFileSync(fixedAdminServicePath, fixedContent);
console.log(`✅ Fixed comma issue in FixedAdminService.ts`);

console.log("All errors fixed successfully!");