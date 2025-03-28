// Script to apply the fixed RiskAssessmentService.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("================================================================================");
console.log("APPLYING RISK ASSESSMENT SERVICE FIX");
console.log("================================================================================");

// Path to the original and fixed files
const originalFilePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const fixedFilePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.fixed.ts');

// Check if the files exist
if (!fs.existsSync(originalFilePath)) {
  console.error(`Original file not found: ${originalFilePath}`);
  process.exit(1);
}

if (!fs.existsSync(fixedFilePath)) {
  console.error(`Fixed file not found: ${fixedFilePath}`);
  process.exit(1);
}

try {
  // Create backup of the original file
  const backupPath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts.backup');
  fs.copyFileSync(originalFilePath, backupPath);
  console.log(`✅ Created backup: ${backupPath}`);

  // Copy the fixed file to replace the original
  fs.copyFileSync(fixedFilePath, originalFilePath);
  console.log(`✅ Replaced original file with fixed version`);

  console.log("\n================================================================================");
  console.log("RISK ASSESSMENT SERVICE FIX APPLIED SUCCESSFULLY");
  console.log("================================================================================");

  console.log("\nThe RiskAssessmentService.ts file has been updated with the following improvements:");
  console.log("1. Added client-side caching to provide fallback when database operations fail");
  console.log("2. Added error handling to prevent 403 permission errors from breaking the UI");
  console.log("3. Implemented fallback advice data for when database isn't accessible");
  console.log("4. Improved error messages and logging");
  console.log("\nYou should now rebuild and redeploy the application to apply these changes.");
} catch (error) {
  console.error(`Error applying fix: ${error.message}`);
  process.exit(1);
}