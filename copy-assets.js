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
const targetRootPath = path.join(__dirname, 'dist');

// Create the target directories if they don't exist
if (!fs.existsSync(targetAssetsPath)) {
  fs.mkdirSync(targetAssetsPath, { recursive: true });
  console.log(`Created target assets directory: ${targetAssetsPath}`);
}

// Copy all files from src/assets to dist/assets and dist
try {
  const files = fs.readdirSync(sourceAssetsPath);
  
  for (const file of files) {
    const sourcePath = path.join(sourceAssetsPath, file);
    
    // Skip if it's a directory
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      continue;
    }
    
    // Copy to dist/assets
    const targetAssetsFilePath = path.join(targetAssetsPath, file);
    fs.copyFileSync(sourcePath, targetAssetsFilePath);
    console.log(`Copied ${file} to ${targetAssetsFilePath}`);
    
    // Copy to dist root
    const targetRootFilePath = path.join(targetRootPath, file);
    fs.copyFileSync(sourcePath, targetRootFilePath);
    console.log(`Copied ${file} to ${targetRootFilePath}`);
  }
  
  console.log('All assets copied successfully!');
} catch (error) {
  console.error('Error copying assets:', error);
}