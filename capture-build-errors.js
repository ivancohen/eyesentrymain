// Script to capture and analyze build errors
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function captureBuildErrors() {
  try {
    console.log("=".repeat(80));
    console.log("CAPTURING BUILD ERRORS");
    console.log("=".repeat(80));
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    // File to save build output
    const buildLogFile = path.join(logsDir, 'build-log.txt');
    
    console.log("\n📋 Attempting build with detailed logging...");
    try {
      // Run build with output redirected to file
      execSync('npm run build', { 
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      }).toString();
      
      console.log("✅ Build succeeded! No errors to capture.");
      return;
    } catch (error) {
      // Save error output to file
      const errorOutput = error.stdout + '\n' + error.stderr;
      fs.writeFileSync(buildLogFile, errorOutput);
      console.log(`✅ Build errors captured and saved to ${buildLogFile}`);
      
      // Analyze the error output
      console.log("\n📊 Analyzing build errors...");
      analyzeErrors(errorOutput, buildLogFile);
    }
    
  } catch (error) {
    console.error("\n❌ Error capturing build errors:", error.message);
    process.exit(1);
  }
}

// Function to analyze errors and provide solutions
function analyzeErrors(errorOutput, logFile) {
  // Common error patterns and their solutions
  const errorPatterns = [
    {
      pattern: /Module not found: Error: Can't resolve '(.+?)'/g,
      type: "Missing Module",
      solution: (match) => `Missing module: ${match[1]}. Try installing it with: npm install ${match[1]}`
    },
    {
      pattern: /TypeScript error in (.+?):(\d+):(\d+):\s*(.+)/g,
      type: "TypeScript Error",
      solution: (match) => `TypeScript error in ${match[1]} (line ${match[2]}, column ${match[3]}): ${match[4]}`
    },
    {
      pattern: /Property '(.+?)' does not exist on type/g,
      type: "TypeScript Property Error",
      solution: (match) => `Property '${match[1]}' does not exist on the type. Check if you've removed this property or need to update the type definition.`
    },
    {
      pattern: /Cannot find module '(.+?)' or its corresponding type declarations/g,
      type: "Missing Type Declarations",
      solution: (match) => `Missing type declarations for '${match[1]}'. Try installing @types package: npm install --save-dev @types/${match[1].replace('@', '').split('/')[0]}`
    },
    {
      pattern: /Cannot find name '(.+?)'/g,
      type: "Undefined Variable",
      solution: (match) => `Undefined variable: '${match[1]}'. Make sure it's imported or defined.`
    },
    {
      pattern: /No overload matches this call/g,
      type: "Function Call Error",
      solution: () => "Function call with incorrect parameters. Check the function signature and ensure you're passing the correct arguments."
    },
    {
      pattern: /error during build:/g,
      type: "Vite Build Error",
      solution: () => "Vite encountered an error during the build process. Check the full error message for details."
    },
    {
      pattern: /QuestionnaireEdit/g,
      type: "Removed Component Reference",
      solution: () => "Reference to removed QuestionnaireEdit component. Remove all imports and usages of this component."
    },
    {
      pattern: /updateQuestionnaire/g,
      type: "Removed Function Reference",
      solution: () => "Reference to removed updateQuestionnaire function. Remove all imports and usages of this function."
    },
    {
      pattern: /out of memory/i,
      type: "Memory Error",
      solution: () => "Build process ran out of memory. Try increasing Node.js memory limit: NODE_OPTIONS=--max_old_space_size=4096 npm run build"
    }
  ];
  
  // Extract and categorize errors
  const foundErrors = [];
  errorPatterns.forEach(({ pattern, type, solution }) => {
    let match;
    while ((match = pattern.exec(errorOutput)) !== null) {
      foundErrors.push({
        type,
        solution: solution(match),
        context: match[0]
      });
    }
  });
  
  // Check for specific files with errors
  const fileErrorPattern = /(?:Error|error) in (.+?\.[jt]sx?)/g;
  const filesWithErrors = new Set();
  let fileMatch;
  while ((fileMatch = fileErrorPattern.exec(errorOutput)) !== null) {
    filesWithErrors.add(fileMatch[1]);
  }
  
  // Output analysis
  console.log("\n=".repeat(80));
  console.log("BUILD ERROR ANALYSIS");
  console.log("=".repeat(80));
  
  if (foundErrors.length === 0) {
    console.log("\n⚠️ No specific error patterns recognized. Please check the full log file for details.");
  } else {
    console.log(`\n🔍 Found ${foundErrors.length} specific errors:`);
    
    // Group errors by type
    const errorsByType = {};
    foundErrors.forEach(error => {
      if (!errorsByType[error.type]) {
        errorsByType[error.type] = [];
      }
      errorsByType[error.type].push(error);
    });
    
    // Display errors by type
    Object.entries(errorsByType).forEach(([type, errors]) => {
      console.log(`\n${type} (${errors.length}):`);
      // Show unique solutions
      const uniqueSolutions = [...new Set(errors.map(e => e.solution))];
      uniqueSolutions.forEach(solution => {
        console.log(`  - ${solution}`);
      });
    });
  }
  
  if (filesWithErrors.size > 0) {
    console.log(`\n📁 Files with errors (${filesWithErrors.size}):`);
    [...filesWithErrors].forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  // Check for QuestionnaireEdit references
  if (errorOutput.includes('QuestionnaireEdit')) {
    console.log("\n⚠️ Found references to removed QuestionnaireEdit component. This is likely causing build errors.");
    console.log("   Run the fix-build-issues.js script to automatically fix these references.");
  }
  
  // Check for updateQuestionnaire references
  if (errorOutput.includes('updateQuestionnaire')) {
    console.log("\n⚠️ Found references to removed updateQuestionnaire function. This is likely causing build errors.");
    console.log("   Run the fix-build-issues.js script to automatically fix these references.");
  }
  
  console.log("\n=".repeat(80));
  console.log(`Full build log saved to: ${logFile}`);
  console.log("Run fix-build-issues.js to automatically fix common build errors.");
  console.log("=".repeat(80));
}

// Run the function
captureBuildErrors()
  .then(() => {
    console.log("\nBuild error capture script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during build error capture:", err);
    process.exit(1);
  });