// Script to fix extra commas in the FixedAdminService.ts file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the file with errors
const fixedAdminServicePath = path.join(__dirname, 'src', 'services', 'FixedAdminService.ts');

console.log("Fixing extra commas in FixedAdminService.ts...");

if (!fs.existsSync(fixedAdminServicePath)) {
  console.error(`Error: File not found at ${fixedAdminServicePath}`);
  process.exit(1);
}

// Create a backup of the file
const backupPath = path.join(__dirname, 'typescript-fix-backups', 'FixedAdminService.ts.backup3');
fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.copyFileSync(fixedAdminServicePath, backupPath);
console.log(`Created backup at: ${backupPath}`);

// Read the file content
let content = fs.readFileSync(fixedAdminServicePath, 'utf8');

// Fix the triple commas (replace },, with a single comma)
content = content.replace(/\},,,/g, '},');

// Write the fixed content back to the file
fs.writeFileSync(fixedAdminServicePath, content);
console.log(`✅ Fixed extra commas in FixedAdminService.ts`);

console.log("All errors fixed successfully!");