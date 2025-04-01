// Script to kill any process using port 3000 and restart the server
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killAndRestartServer() {
  try {
    console.log("=".repeat(80));
    console.log("KILLING PROCESS ON PORT 3000 AND RESTARTING SERVER");
    console.log("=".repeat(80));
    
    // Find process using port 3000
    console.log("\n1️⃣ Finding process using port 3000...");
    
    try {
      // On Windows, use netstat to find the process
      const { stdout: netstatOutput } = await execAsync('netstat -ano | findstr :3000');
      console.log("Found processes using port 3000:");
      console.log(netstatOutput);
      
      // Extract PID(s)
      const lines = netstatOutput.split('\n').filter(line => line.includes(':3000'));
      const pids = new Set();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[4];
          pids.add(pid);
        }
      }
      
      if (pids.size === 0) {
        console.log("No processes found using port 3000");
      } else {
        console.log(`Found ${pids.size} process(es) using port 3000: ${[...pids].join(', ')}`);
        
        // Kill each process
        for (const pid of pids) {
          console.log(`Killing process with PID ${pid}...`);
          await execAsync(`taskkill /F /PID ${pid}`);
        }
        
        console.log("✅ Successfully killed processes using port 3000");
      }
    } catch (findError) {
      console.warn("⚠️ Could not find processes using port 3000:", findError.message);
    }
    
    // Wait a moment for the port to be released
    console.log("\nWaiting for port to be released...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start the server
    console.log("\n2️⃣ Starting the server...");
    
    try {
      const { stdout, stderr } = await execAsync('node serve-local.js');
      console.log("Server output:", stdout);
      if (stderr) {
        console.error("Server error:", stderr);
      }
    } catch (startError) {
      console.error("❌ Error starting server:", startError.message);
      throw startError;
    }
    
  } catch (error) {
    console.error("\n❌ Error in kill-and-restart-server:", error.message);
    process.exit(1);
  }
}

// Run the function
killAndRestartServer()
  .then(() => {
    console.log("\nServer restart script completed.");
  })
  .catch(err => {
    console.error("\nFatal error during server restart:", err);
    process.exit(1);
  });