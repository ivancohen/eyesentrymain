// Script to copy the Cloudflare build files to the local build directory
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const sourcePath = path.join(__dirname, 'cloudflare-build');
const targetPath = path.join(__dirname, 'dist');

// Create the target directory if it doesn't exist
if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath, { recursive: true });
  console.log(`Created target directory: ${targetPath}`);
}

// Create the assets directory if it doesn't exist
const assetsDir = path.join(targetPath, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created assets directory: ${assetsDir}`);
}

// Copy files from cloudflare-build to dist
try {
  // Copy index.html
  fs.copyFileSync(
    path.join(sourcePath, 'index.html'),
    path.join(targetPath, 'index.html')
  );
  console.log('Copied index.html');

  // Copy assets
  fs.copyFileSync(
    path.join(sourcePath, 'assets', 'index-C9CEEzPH.js'),
    path.join(targetPath, 'assets', 'index-C9CEEzPH.js')
  );
  console.log('Copied index-C9CEEzPH.js');

  fs.copyFileSync(
    path.join(sourcePath, 'assets', 'index-DWtQFRly.css'),
    path.join(targetPath, 'assets', 'index-DWtQFRly.css')
  );
  console.log('Copied index-DWtQFRly.css');

  // Copy environment.js
  fs.copyFileSync(
    path.join(sourcePath, 'environment.js'),
    path.join(targetPath, 'environment.js')
  );
  console.log('Copied environment.js');

  // Copy _redirects
  fs.copyFileSync(
    path.join(sourcePath, '_redirects'),
    path.join(targetPath, '_redirects')
  );
  console.log('Copied _redirects');

  // Copy favicon.ico
  fs.copyFileSync(
    path.join(sourcePath, 'favicon.ico'),
    path.join(targetPath, 'favicon.ico')
  );
  console.log('Copied favicon.ico');

  // Copy og-image.png
  fs.copyFileSync(
    path.join(sourcePath, 'og-image.png'),
    path.join(targetPath, 'og-image.png')
  );
  console.log('Copied og-image.png');

  console.log('\nSuccessfully copied all files from Cloudflare build to local dist directory.');
  console.log(`You can now serve the application from: ${targetPath}`);
} catch (error) {
  console.error('Error copying files:', error);
  process.exit(1);
}