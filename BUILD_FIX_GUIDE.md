# Build Fix Guide

This guide explains how to fix common build issues that may prevent successful deployment to Cloudflare Pages.

## Quick Fix

Run our automated build fix script:

- Windows: `fix-build-issues.bat`
- Unix/Linux: `./fix-build-issues.sh`

This script will:
1. Clean up previous build artifacts
2. Fix TypeScript errors
3. Check for and reinstall missing dependencies
4. Create a minimal .env file if needed
5. Fix Vite configuration issues
6. Attempt a clean build

## Common Build Issues

### 1. TypeScript Errors

**Symptoms:**
- Build fails with TypeScript type errors
- Missing imports or exports
- Type mismatches

**Fixes:**
- The script automatically fixes common TypeScript errors related to:
  - Removed QuestionnaireEdit component
  - Missing updateQuestionnaire function
  - Edit button references

### 2. Missing Dependencies

**Symptoms:**
- "Cannot find module" errors
- "Module not found" errors

**Fixes:**
- The script reinstalls all dependencies with `npm install`
- If specific dependencies are missing, you may need to install them manually:
  ```bash
  npm install missing-package-name
  ```

### 3. Environment Variables

**Symptoms:**
- "process.env is undefined" errors
- "Cannot read property of undefined" errors related to environment variables

**Fixes:**
- The script creates a minimal .env file if one doesn't exist
- You may need to add your specific environment variables to this file

### 4. Vite Configuration Issues

**Symptoms:**
- Path alias errors (e.g., cannot find module '@/components')
- Build configuration errors

**Fixes:**
- The script ensures path aliases are correctly configured
- In extreme cases, it creates a minimal Vite configuration

## Manual Fixes

If the automated script doesn't resolve your build issues, try these manual steps:

### 1. Check TypeScript Errors

```bash
npx tsc --noEmit
```

This will show all TypeScript errors without generating output files.

### 2. Clean Build Cache

```bash
rm -rf node_modules/.vite
rm -rf dist
```

### 3. Reinstall Dependencies

```bash
rm -rf node_modules
npm install
```

### 4. Check for Missing Peer Dependencies

Some packages may have peer dependencies that need to be installed manually:

```bash
npm ls
```

Look for any "peer dependency missing" warnings and install them:

```bash
npm install missing-peer-dependency
```

### 5. Update Node.js

Ensure you're using a compatible Node.js version (the project is configured for Node.js 20):

```bash
node --version
```

### 6. Check for Syntax Errors

Sometimes, syntax errors can be hard to spot. Try running:

```bash
npx eslint src/**/*.{ts,tsx}
```

## Specific Issues and Solutions

### Issue: QuestionnaireEdit Component Removed

If you've removed the QuestionnaireEdit component but still have references to it:

1. Remove the import from App.tsx:
   ```typescript
   // Remove this line
   import QuestionnaireEdit from "@/components/questionnaires/QuestionnaireEdit";
   ```

2. Remove the route from App.tsx:
   ```typescript
   // Remove this line
   <Route path="/questionnaire/edit/:id" element={<QuestionnaireEdit />} />
   ```

### Issue: Edit Button in Questionnaires.tsx

If you've removed the edit functionality but still have the Edit button:

1. Remove the handleEditQuestionnaire function:
   ```typescript
   // Remove this function
   const handleEditQuestionnaire = (id: string) => {
     navigate(`/questionnaire/edit/${id}`);
   };
   ```

2. Remove the Edit button from the card:
   ```typescript
   // Remove this button
   <Button 
     variant="outline" 
     size="sm" 
     className="flex items-center gap-1.5"
     onClick={() => handleEditQuestionnaire(questionnaire.id)}
   >
     <Edit size={14} />
     Edit
   </Button>
   ```

### Issue: updateQuestionnaire Function Removed

If you've removed the updateQuestionnaire function but still have references to it:

1. Update imports in files that reference it:
   ```typescript
   // Change this
   import { getQuestionnaireById, updateQuestionnaire, ... } from "@/services/PatientQuestionnaireService";
   
   // To this
   import { getQuestionnaireById, ... } from "@/services/PatientQuestionnaireService";
   ```

## After Fixing Build Issues

Once your build succeeds:

1. Run the deployment script again:
   - Windows: `deploy-to-cloudflare.bat`
   - Unix/Linux: `./deploy-to-cloudflare.sh`

2. If deployment still fails, run the troubleshooting script:
   - Windows: `troubleshoot-deployment.bat`
   - Unix/Linux: `./troubleshoot-deployment.sh`

## Getting More Help

If you're still experiencing build issues:

1. Check the Vite documentation: https://vitejs.dev/guide/
2. Check the TypeScript documentation: https://www.typescriptlang.org/docs/
3. Look for specific error messages in your build output and search for solutions online
4. Consider using a tool like `npm-why` to debug dependency issues: `npx npm-why package-name`