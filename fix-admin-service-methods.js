// Script to fix static methods in the FixedAdminService.ts file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the file with errors
const fixedAdminServicePath = path.join(__dirname, 'src', 'services', 'FixedAdminService.ts');

console.log("Fixing static methods in FixedAdminService.ts...");

if (!fs.existsSync(fixedAdminServicePath)) {
  console.error(`Error: File not found at ${fixedAdminServicePath}`);
  process.exit(1);
}

// Create a backup of the file
const backupPath = path.join(__dirname, 'typescript-fix-backups', 'FixedAdminService.ts.backup4');
fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.copyFileSync(fixedAdminServicePath, backupPath);
console.log(`Created backup at: ${backupPath}`);

// Read the file content
let content = fs.readFileSync(fixedAdminServicePath, 'utf8');

// Replace 'static async' with just 'async' for all method definitions
content = content.replace(/static async/g, 'async');

// Make sure all methods at the end have a proper comma syntax
const staticMethodPatterns = [
  'updateDoctorOffice',
  'diagnosePendingApprovals',
  'setAdminStatus',
  'createUser',
  'fetchPatientData',
  'fetchQuestionScores',
  'updateQuestionScore',
  'fetchAnonymousPatientData'
];

// Create proper method definitions
const properMethodDefinitions = {};
for (const methodName of staticMethodPatterns) {
  // Find the original method definition
  const regex = new RegExp(`async ${methodName}\\([^)]*\\)\\s*{[^}]*}`, 's');
  const match = content.match(regex);
  
  if (match) {
    const originalMethod = match[0];
    // Create a proper method definition with a comma at the end
    properMethodDefinitions[methodName] = originalMethod + ',';
  }
}

// Replace each method with its proper definition
for (const [methodName, properDefinition] of Object.entries(properMethodDefinitions)) {
  // Use a regex that matches the method name and everything until the closing brace
  const regex = new RegExp(`async ${methodName}\\([^)]*\\)\\s*{[^}]*}(,)*`, 's');
  content = content.replace(regex, properDefinition);
}

// Make sure the object literal ends properly
content = content.replace(/,(\s*};)/, '$1');

// Write the fixed content back to the file
fs.writeFileSync(fixedAdminServicePath, content);
console.log(`✅ Fixed static methods in FixedAdminService.ts`);

console.log("All errors fixed successfully!");