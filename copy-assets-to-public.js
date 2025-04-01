// Script to copy assets to the public directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const sourceAssetsPath = path.join(__dirname, 'src', 'assets');
const targetPublicPath = path.join(__dirname, 'public');

// Copy all files from src/assets to public
try {
  const files = fs.readdirSync(sourceAssetsPath);
  
  for (const file of files) {
    const sourcePath = path.join(sourceAssetsPath, file);
    const targetPath = path.join(targetPublicPath, file);
    
    // Skip if it's a directory
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      continue;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to ${targetPath}`);
  }
  
  console.log('All assets copied to public directory successfully!');
} catch (error) {
  console.error('Error copying assets to public directory:', error);
}