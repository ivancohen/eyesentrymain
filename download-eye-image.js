// Script to download an eye image for the home page
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function downloadEyeImage() {
  try {
    console.log("=".repeat(80));
    console.log("DOWNLOADING EYE IMAGE FOR HOME PAGE");
    console.log("=".repeat(80));
    
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(__dirname, 'src', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
      console.log(`✅ Created assets directory: ${assetsDir}`);
    }
    
    // Define the image URL and destination path
    const imageUrl = 'https://images.unsplash.com/photo-1559076294-ad5d5f6478a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
    const imagePath = path.join(assetsDir, 'eye-image.jpg');
    
    // Download the image
    console.log(`\nDownloading eye image from: ${imageUrl}`);
    console.log(`Saving to: ${imagePath}`);
    
    await downloadFile(imageUrl, imagePath);
    
    console.log("\n=".repeat(80));
    console.log("🎉 EYE IMAGE DOWNLOADED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log(`\nImage saved to: ${imagePath}`);
    console.log("This image will be used in the home page hero section.");
    
  } catch (error) {
    console.error("\n❌ Error downloading eye image:", error);
    process.exit(1);
  }
}

// Helper function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log("✅ Image downloaded successfully");
        resolve();
      });
    }).on('error', (error) => {
      fs.unlink(destination, () => {}); // Delete the file if there's an error
      reject(error);
    });
  });
}

// Run the function
downloadEyeImage()
  .then(() => {
    console.log("\nEye image download completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during eye image download:", err);
    process.exit(1);
  });