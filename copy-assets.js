// Script to copy assets to the dist directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const sourceAssetsPath = path.join(__dirname, 'src', 'assets');
const targetAssetsPath = path.join(__dirname, 'dist', 'assets');

// Create the target directory if it doesn't exist
if (!fs.existsSync(targetAssetsPath)) {
  fs.mkdirSync(targetAssetsPath, { recursive: true });
  console.log(`Created target assets directory: ${targetAssetsPath}`);
}

// Copy all files from src/assets to dist/assets
try {
  const files = fs.readdirSync(sourceAssetsPath);
  
  for (const file of files) {
    const sourcePath = path.join(sourceAssetsPath, file);
    const targetPath = path.join(targetAssetsPath, file);
    
    // Skip if it's a directory
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      continue;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to ${targetPath}`);
  }
  
  console.log('All assets copied successfully!');
} catch (error) {
  console.error('Error copying assets:', error);
}