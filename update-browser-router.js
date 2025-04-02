/**
 * Script to update BrowserRouter implementation to use future flags
 * This script will search for BrowserRouter usage and update it to use the future flags
 */

import fs from 'fs';
import path from 'path';

// Define the file to update
const filePath = path.resolve('src/index.tsx');

// Check if the file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Check if the router config is already imported
if (!content.includes('import { routerConfig } from')) {
  // Add the import for routerConfig
  content = content.replace(
    /import {(.+?)} from ['"]react-router-dom['"];/,
    `import {$1, BrowserRouter } from 'react-router-dom';\nimport { routerConfig } from './router/config';`
  );
}

// Update the BrowserRouter usage
if (content.includes('<BrowserRouter>')) {
  content = content.replace(
    /<BrowserRouter>/g,
    '<BrowserRouter future={routerConfig.future}>'
  );
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Updated ${filePath} to use future flags`);

// Now check for createBrowserRouter usage
const appFilePath = path.resolve('src/App.tsx');
if (fs.existsSync(appFilePath)) {
  let appContent = fs.readFileSync(appFilePath, 'utf8');
  
  // Check if createBrowserRouter is used
  if (appContent.includes('createBrowserRouter')) {
    // Check if the router config is already imported
    if (!appContent.includes('import { routerConfig } from')) {
      // Add the import for routerConfig
      appContent = appContent.replace(
        /import {(.+?)} from ['"]react-router-dom['"];/,
        `import {$1} from 'react-router-dom';\nimport { routerConfig } from './router/config';`
      );
    }
    
    // Update the createBrowserRouter usage
    appContent = appContent.replace(
      /createBrowserRouter\(\[/g,
      'createBrowserRouter([',
    );
    
    // Add the future flags to the options
    appContent = appContent.replace(
      /createBrowserRouter\(\[(.+?)\]\)/s,
      'createBrowserRouter([$1], { future: routerConfig.future })'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(appFilePath, appContent, 'utf8');
    console.log(`Updated ${appFilePath} to use future flags`);
  }
}

console.log('React Router future flags have been successfully applied!');