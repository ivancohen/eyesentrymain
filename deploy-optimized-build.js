import { execSync } from 'child_process';
import path from 'path';

// Function to execute commands and log output
function runCommand(command) {
  console.log(`\n> Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

// Main deployment function
async function deploy() {
  console.log('Starting deployment process...');
  
  // 1. Git operations
  console.log('\n--- Git Operations ---');
  runCommand('git add .');
  runCommand('git commit -m "Optimize doctor page loading performance"');
  runCommand('git push origin main');
  
  // 2. Build the application
  console.log('\n--- Building Application ---');
  runCommand('npm run build');
  
  // 3. Deploy to Cloudflare
  console.log('\n--- Deploying to Cloudflare ---');
  runCommand('npm run deploy');
  
  console.log('\n✅ Deployment completed successfully!');
}

// Execute the deployment
deploy().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});