// Script to fix component import paths in React components
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base directory for component scanning
const baseDir = path.join(__dirname, 'src');

// Paths to components that need fixing
const componentPaths = [
  // EnhancedQuestionManager import fix
  {
    path: path.join(__dirname, 'src', 'components', 'admin', 'EnhancedQuestionManager.tsx'),
    importFixes: [
      {
        from: 'import QuestionFormManager from "@/components/questions/QuestionFormManager";',
        to: 'import QuestionFormManager from "../questions/QuestionFormManager";'
      }
    ]
  },
  // Look for SpecialistQuestionManager import issues
  {
    path: path.join(__dirname, 'src', 'components', 'admin', 'SpecialistQuestionManager.tsx'),
    importFixes: [
      {
        from: 'import SpecialistQuestionForm from "@/components/admin/specialist/SpecialistQuestionForm";',
        to: 'import SpecialistQuestionForm from "./specialist/SpecialistQuestionForm";'
      }
    ]
  },
  // Fix any other components we can find with problematic imports
];

// Find all TS/TSX files recursively
function findAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Scan files for problematic import patterns
function scanForProblematicImports() {
  console.log("Scanning for problematic import patterns...");
  const tsFiles = findAllTsFiles(baseDir);
  const problematicPatterns = [
    { regex: /import .* from ["']@\/components\/questions\/QuestionFormManager["'];/, description: "QuestionFormManager absolute import" },
    { regex: /import .* from ["']@\/components\/admin\/specialist\/SpecialistQuestionForm["'];/, description: "SpecialistQuestionForm absolute import" }
  ];
  
  let additionalFixes = [];
  
  tsFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      problematicPatterns.forEach(pattern => {
        if (pattern.regex.test(content)) {
          console.log(`Found problematic import in ${file}: ${pattern.description}`);
          
          // Determine relative path fix
          const relativeDir = path.relative(path.dirname(file), baseDir);
          const componentDir = path.dirname(file);
          const targetImportDir = pattern.description.includes("QuestionFormManager") 
            ? path.join(baseDir, 'components', 'questions')
            : path.join(baseDir, 'components', 'admin', 'specialist');
          
          const relativePath = path.relative(componentDir, targetImportDir);
          const relativeImportPath = relativePath.replace(/\\/g, '/');
          
          const fix = {
            path: file,
            importFixes: []
          };
          
          if (pattern.description.includes("QuestionFormManager")) {
            fix.importFixes.push({
              from: /import (.*) from ["']@\/components\/questions\/QuestionFormManager["'];/,
              to: (match, importName) => `import ${importName} from "${relativeImportPath}/QuestionFormManager";`
            });
          } else if (pattern.description.includes("SpecialistQuestionForm")) {
            fix.importFixes.push({
              from: /import (.*) from ["']@\/components\/admin\/specialist\/SpecialistQuestionForm["'];/,
              to: (match, importName) => `import ${importName} from "${relativeImportPath}/SpecialistQuestionForm";`
            });
          }
          
          additionalFixes.push(fix);
        }
      });
      
    } catch (error) {
      console.error(`Error scanning ${file}:`, error);
    }
  });
  
  return additionalFixes;
}

// Get additional component paths detected by scanning
const additionalComponentPaths = scanForProblematicImports();
const allComponentPaths = [...componentPaths, ...additionalComponentPaths];

// Function to check if a component file exists
function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

// Function to fix imports in a component file
function fixComponentImports(componentPath, importFixes) {
  if (!fileExists(componentPath)) {
    console.error(`File not found: ${componentPath}`);
    return false;
  }

  try {
    // Read the file content
    let content = fs.readFileSync(componentPath, 'utf8');
    let modified = false;

    // Apply each import fix
    for (const fix of importFixes) {
      if (fix.from instanceof RegExp) {
        // Handle regex-based replacements
        const oldContent = content;
        content = content.replace(fix.from, fix.to);
        if (oldContent !== content) {
          modified = true;
          console.log(`Fixed regex import in ${path.basename(componentPath)}`);
        }
      } else if (typeof fix.from === 'string' && content.includes(fix.from)) {
        // Handle string-based replacements
        content = content.replace(fix.from, fix.to);
        modified = true;
        console.log(`Fixed import in ${path.basename(componentPath)}: ${fix.from} -> ${fix.to}`);
      }
    }

    // Only write the file if modifications were made
    if (modified) {
      fs.writeFileSync(componentPath, content, 'utf8');
      console.log(`Successfully updated ${path.basename(componentPath)}`);
      return true;
    } else {
      console.log(`No changes needed in ${path.basename(componentPath)}`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing imports in ${componentPath}:`, error);
    return false;
  }
}

// Main function to fix all component imports
function fixAllComponentImports() {
  console.log("=".repeat(80));
  console.log("FIXING COMPONENT IMPORT PATHS");
  console.log("=".repeat(80));

  let successCount = 0;
  let failureCount = 0;

  // Add additional path for direct creation of SpecialistQuestionForm if needed
  const specialistFormDir = path.join(__dirname, 'src', 'components', 'admin', 'specialist');
  if (!fs.existsSync(specialistFormDir)) {
    console.log(`Creating specialist directory: ${specialistFormDir}`);
    fs.mkdirSync(specialistFormDir, { recursive: true });
  }

  // Process both hardcoded and dynamically detected components
  for (const component of allComponentPaths) {
    try {
      const success = fixComponentImports(component.path, component.importFixes);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`Error processing component ${component.path}:`, error);
      failureCount++;
    }
  }

  console.log("\n=".repeat(80));
  console.log(`IMPORT FIX COMPLETED: ${successCount} success, ${failureCount} failures`);
  console.log("=".repeat(80));
  
  console.log("\nRecommendations for fixing remaining issues:");
  console.log("1. Run: npm run dev");
  console.log("2. Check console for import errors");
  console.log("3. If SpecialistQuestionForm.tsx is missing, create the missing component");
  console.log("4. Update vite.config.js to properly support '@/' alias imports if needed");
}

// Run the function
fixAllComponentImports();
