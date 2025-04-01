// Script to restart the server with the QuestionService fix
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function restartServer() {
  try {
    console.log("=".repeat(80));
    console.log("RESTARTING SERVER WITH QUESTIONSERVICE FIX");
    console.log("=".repeat(80));
    
    // Serve the application
    console.log("\n🚀 Starting the server...");
    console.log("Press Ctrl+C to stop the server");
    execSync('node serve-local.js', { stdio: 'inherit' });
    
  } catch (error) {
    console.error("\n❌ Error restarting server:", error.message);
    process.exit(1);
  }
}

// Run the function
restartServer()
  .then(() => {
    console.log("\nRestart script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during restart:", err);
    process.exit(1);
  });