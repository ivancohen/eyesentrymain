// Test script to verify the chatbot revert
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Chatbot Revert Test ===');
console.log('This script will verify that the AI Assistant has been restored to the admin dashboard.\n');

// Check if the NewAdmin.tsx file exists
const newAdminPath = path.join(__dirname, 'src', 'pages', 'NewAdmin.tsx');
if (!fs.existsSync(newAdminPath)) {
  console.error('❌ Error: NewAdmin.tsx file not found!');
  process.exit(1);
}

// Read the NewAdmin.tsx file
const newAdminContent = fs.readFileSync(newAdminPath, 'utf8');

// Check if the chatbot knowledge base management is still in the admin section
if (newAdminContent.includes('chatbot-faq') && 
    newAdminContent.includes('Chatbot Knowledge Base') && 
    newAdminContent.includes('Manage the knowledge base for the doctor chatbot assistant')) {
  console.log('✅ Chatbot knowledge base management is still in the admin section');
} else {
  console.error('❌ Error: Chatbot knowledge base management is missing from the admin section!');
  process.exit(1);
}

// Check if the AI Assistant card is restored to the admin dashboard
if (newAdminContent.includes('AI Assistant') && 
    newAdminContent.includes('Get insights and generate reports from questionnaire data')) {
  console.log('✅ AI Assistant card is restored to the admin dashboard');
} else {
  console.error('❌ Error: AI Assistant card is not restored to the admin dashboard!');
  process.exit(1);
}

// Check if the 'ai' section is restored to the renderContent function
if (newAdminContent.includes("case 'ai':")) {
  console.log('✅ AI section is restored to the renderContent function');
} else {
  console.error('❌ Error: AI section is not restored to the renderContent function!');
  process.exit(1);
}

// Check if the clinical resources and website FAQ features are still intact
if (newAdminContent.includes('Clinical Resources') && 
    newAdminContent.includes('Website FAQs')) {
  console.log('✅ Clinical resources and website FAQ features are still intact');
} else {
  console.error('❌ Error: Clinical resources or website FAQ features are missing!');
  process.exit(1);
}

// Check if the AdminSection type and validAdminSections array are updated
if (newAdminContent.includes("'ai'")) {
  console.log('✅ AdminSection type and validAdminSections array are updated');
} else {
  console.error('❌ Error: AdminSection type or validAdminSections array does not include AI!');
  process.exit(1);
}

console.log('\n✅ All tests passed! The AI Assistant has been successfully restored to the admin dashboard.');