// Script to fix deployment environment issues (ES Module version)
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

// Create public/_redirects file for SPA routing
console.log("\n📝 Creating _redirects file for SPA routing...");
const redirectsDir = path.join(__dirname, 'public');
const redirectsPath = path.join(redirectsDir, '_redirects');

try {
  if (!fs.existsSync(redirectsDir)) {
    fs.mkdirSync(redirectsDir, { recursive: true });
  }
  fs.writeFileSync(redirectsPath, '/*    /index.html   200\n');
  console.log("✅ Created _redirects file");
} catch (error) {
  console.error("Error creating _redirects file:", error.message);
}

// Create environment.js file in public folder to provide environment variables at runtime
console.log("\n📝 Creating environment.js for runtime configuration...");
const envJsPath = path.join(redirectsDir, 'environment.js');
const envJsContent = `
// Runtime environment configuration
window.RUNTIME_ENV = {
  VITE_API_URL: "https://881e66e4.eyesentry.pages.dev"
};
`;
try {
  fs.writeFileSync(envJsPath, envJsContent);
  console.log("✅ Created environment.js file");
} catch (error) {
  console.error("Error creating environment.js file:", error.message);
}

// Add script tag to index.html to load environment.js
console.log("\n🔧 Updating index.html to load environment.js...");
const indexHtmlPath = path.join(__dirname, 'index.html');
try {
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
} catch (error) {
  console.error("Error updating index.html:", error.message);
}

console.log("\n================================================================================");
console.log("DEPLOYMENT FIXES COMPLETED");
console.log("================================================================================");

console.log("\nNow you need to rebuild and redeploy the application:");
console.log("1. Run 'node max-bypass.js' to build with fixed environment settings");
console.log("2. Run 'node deploy-to-cloudflare.js --skip-build' to deploy the fixed build");