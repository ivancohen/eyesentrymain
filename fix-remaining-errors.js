// Script to fix the remaining TypeScript errors in the FixedAdminService.ts file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the file with errors
const fixedAdminServicePath = path.join(__dirname, 'src', 'services', 'FixedAdminService.ts');

console.log("Fixing remaining errors in FixedAdminService.ts...");

if (!fs.existsSync(fixedAdminServicePath)) {
  console.error(`Error: File not found at ${fixedAdminServicePath}`);
  process.exit(1);
}

// Create a backup of the file
const backupPath = path.join(__dirname, 'typescript-fix-backups', 'FixedAdminService.ts.backup2');
fs.copyFileSync(fixedAdminServicePath, backupPath);
console.log(`Created backup at: ${backupPath}`);

// Read the file content
let content = fs.readFileSync(fixedAdminServicePath, 'utf8');

// Fix the missing commas between method definitions
// The issue is that we added methods without commas between them
const methodDeclarations = [
  '  static async updateDoctorOffice',
  '  static async diagnosePendingApprovals',
  '  static async setAdminStatus',
  '  static async createUser',
  '  static async fetchPatientData',
  '  static async fetchQuestionScores',
  '  static async updateQuestionScore',
  '  static async fetchAnonymousPatientData'
];

// For each method declaration, add a comma after the closing brace of the method
for (const declaration of methodDeclarations) {
  // Find the method and add a comma after its closing brace
  const methodPattern = new RegExp(`(${declaration}.*?\\n  \\})`, 's');
  content = content.replace(methodPattern, '$1,');
}

// Write the fixed content back to the file
fs.writeFileSync(fixedAdminServicePath, content);
console.log(`✅ Fixed missing commas in FixedAdminService.ts`);

console.log("Remaining errors fixed successfully!");