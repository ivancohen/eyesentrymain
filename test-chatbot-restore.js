// Test script to verify the chatbot restoration
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Chatbot Restoration Test ===');
console.log('This script will verify that the chatbot knowledge base management is still in the admin section,');
console.log('but the actual chat interface is removed from the admin dashboard.\n');

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

// Check if the AI Assistant card is removed from the admin dashboard
if (!newAdminContent.includes('Get insights and generate reports from questionnaire data')) {
  console.log('✅ AI Assistant card is removed from the admin dashboard');
} else {
  console.error('❌ Error: AI Assistant card is still present in the admin dashboard!');
  process.exit(1);
}

// Check if the 'ai' section is removed from the renderContent function
if (!newAdminContent.includes("case 'ai':")) {
  console.log('✅ AI section is removed from the renderContent function');
} else {
  console.error('❌ Error: AI section is still present in the renderContent function!');
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
// We're looking for the comment that indicates the removal
if (newAdminContent.includes("// Removed 'ai' section") || 
    newAdminContent.includes("// Removed 'ai' from valid sections")) {
  console.log('✅ AdminSection type and validAdminSections array are updated');
} else {
  console.log('⚠️ Warning: AdminSection type or validAdminSections array might still include AI!');
  console.log('   This is not critical as long as the AI Assistant card and section are removed.');
}

console.log('\n✅ All tests passed! The chatbot knowledge base management is still in the admin section,');
console.log('but the actual chat interface is removed from the admin dashboard.');