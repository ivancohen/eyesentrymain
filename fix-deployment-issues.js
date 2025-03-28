// Script to fix deployment environment issues
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("================================================================================");
console.log("FIXING DEPLOYMENT ENVIRONMENT ISSUES");
console.log("================================================================================");

// Check for .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env file not found. Please create an .env file with your Supabase credentials.");
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Ensure VITE_API_URL is set to the production URL instead of localhost
let hasApiUrl = false;
let updatedEnv = envLines.map(line => {
  if (line.startsWith('VITE_API_URL=')) {
    hasApiUrl = true;
    // Make sure it's not pointing to localhost
    if (line.includes('localhost') || line.includes('127.0.0.1')) {
      console.log("⚠️ Found localhost API URL, updating to deployed URL...");
      return 'VITE_API_URL=https://881e66e4.eyesentry.pages.dev';
    }
    return line;
  }
  return line;
});

// Add the API URL if it doesn't exist
if (!hasApiUrl) {
  console.log("⚠️ No API URL found, adding production URL...");
  updatedEnv.push('VITE_API_URL=https://881e66e4.eyesentry.pages.dev');
}

// Write updated .env file
fs.writeFileSync(envPath, updatedEnv.join('\n'));
console.log("✅ Updated environment variables");

// Function to update any hardcoded localhost URLs in a file
function updateLocalhostUrls(filePath, isTypescript = false) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  console.log(`Processing file: ${filePath}`);
  
  // Create backup
  fs.copyFileSync(filePath, `${filePath}.urlbackup`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace hardcoded localhost URLs with environment variable or direct production URL
  const replacements = [
    {
      pattern: /'http:\/\/localhost:3000/g,
      replacement: isTypescript 
        ? '(import.meta.env.VITE_API_URL || \'https://881e66e4.eyesentry.pages.dev\''
        : '\'https://881e66e4.eyesentry.pages.dev'
    },
    {
      pattern: /"http:\/\/localhost:3000/g,
      replacement: isTypescript 
        ? '(import.meta.env.VITE_API_URL || "https://881e66e4.eyesentry.pages.dev"'
        : '"https://881e66e4.eyesentry.pages.dev'
    },
    {
      pattern: /http:\/\/localhost:3000/g,
      replacement: isTypescript 
        ? '${import.meta.env.VITE_API_URL || "https://881e66e4.eyesentry.pages.dev"}'
        : 'https://881e66e4.eyesentry.pages.dev'
    }
  ];
  
  for (const { pattern, replacement } of replacements) {
    content = content.replace(pattern, replacement);
  }
  
  // Write updated content
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated file: ${filePath}`);
}

// Create a public/_redirects file for SPA routing
console.log("\n📝 Creating _redirects file for SPA routing...");
const redirectsPath = path.join(__dirname, 'public', '_redirects');
fs.mkdirSync(path.dirname(redirectsPath), { recursive: true });
fs.writeFileSync(redirectsPath, '/*    /index.html   200\n');
console.log("✅ Created _redirects file");

// Update key configuration files to fix API URLs
console.log("\n🔧 Updating API URLs in key files...");
const filesToUpdate = [
  { path: path.join(__dirname, 'src', 'lib', 'api.ts'), isTs: true },
  { path: path.join(__dirname, 'src', 'services', 'AdminNotificationService.ts'), isTs: true },
  { path: path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts'), isTs: true },
  { path: path.join(__dirname, 'src', 'services', 'AuthService.ts'), isTs: true },
  { path: path.join(__dirname, 'src', 'lib', 'supabase.ts'), isTs: true }
];

for (const file of filesToUpdate) {
  updateLocalhostUrls(file.path, file.isTs);
}

// Create environment.js file in public folder to provide environment variables at runtime
console.log("\n📝 Creating environment.js for runtime configuration...");
const envJsPath = path.join(__dirname, 'public', 'environment.js');
const envJsContent = `
// Runtime environment configuration
window.RUNTIME_ENV = {
  VITE_API_URL: "https://881e66e4.eyesentry.pages.dev",
  VITE_SUPABASE_URL: "${process.env.VITE_SUPABASE_URL || ''}",
  VITE_SUPABASE_ANON_KEY: "${process.env.VITE_SUPABASE_ANON_KEY || ''}"
};
`;
fs.writeFileSync(envJsPath, envJsContent);
console.log("✅ Created environment.js file");

// Add script tag to index.html to load environment.js
console.log("\n🔧 Updating index.html to load environment.js...");
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!indexHtml.includes('environment.js')) {
    indexHtml = indexHtml.replace(
      '<head>',
      '<head>\n    <script src="/environment.js"></script>'
    );
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log("✅ Updated index.html");
  } else {
    console.log("⚠️ environment.js script already in index.html");
  }
} else {
  console.log("⚠️ index.html not found");
}

console.log("\n================================================================================");
console.log("DEPLOYMENT FIXES COMPLETED");
console.log("================================================================================");

console.log("\nNow you need to rebuild and redeploy the application:");
console.log("1. Run 'node max-bypass.js' to build with fixed environment settings");
console.log("2. Run 'node deploy-to-cloudflare.js --skip-build' to deploy the fixed build");