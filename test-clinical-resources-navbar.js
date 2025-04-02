// Test script to verify the navbar has been added to the clinical resources page
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Clinical Resources Navbar Test ===');
console.log('This script will verify that the navbar has been added to the clinical resources page.\n');

// Check if the clinical resources page exists
const clinicalResourcesPath = path.join(__dirname, 'src', 'app', 'admin', 'clinical-resources', 'page.tsx');
if (!fs.existsSync(clinicalResourcesPath)) {
  console.error('❌ Error: Clinical resources page not found!');
  process.exit(1);
}

// Read the clinical resources page
const clinicalResourcesContent = fs.readFileSync(clinicalResourcesPath, 'utf8');

// Check if the navbar component is imported
if (clinicalResourcesContent.includes("import Navbar from '@/components/Navbar'")) {
  console.log('✅ Navbar component is imported');
} else {
  console.error('❌ Error: Navbar component is not imported!');
  process.exit(1);
}

// Check if the navbar component is used in the JSX
if (clinicalResourcesContent.includes("<Navbar showProfile={true} />")) {
  console.log('✅ Navbar component is used in the JSX');
} else {
  console.error('❌ Error: Navbar component is not used in the JSX!');
  process.exit(1);
}

// Check if the back button is added
if (clinicalResourcesContent.includes("<ArrowLeft") && 
    clinicalResourcesContent.includes("Back to Dashboard")) {
  console.log('✅ Back button is added');
} else {
  console.error('❌ Error: Back button is not added!');
  process.exit(1);
}

// Check if the page structure is updated to match other admin pages
if (clinicalResourcesContent.includes("<div className=\"min-h-screen flex flex-col bg-blue-50\">") &&
    clinicalResourcesContent.includes("<main className=\"flex-1 container px-6 py-6 mx-auto\">")) {
  console.log('✅ Page structure is updated to match other admin pages');
} else {
  console.error('❌ Error: Page structure is not updated to match other admin pages!');
  process.exit(1);
}

console.log('\n✅ All tests passed! The navbar has been successfully added to the clinical resources page.');