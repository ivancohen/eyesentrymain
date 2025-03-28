# Manual Fix Steps for Build Issues

Since the automated fix script was unable to resolve all issues, follow these manual steps to fix the build problems.

## Step 1: Check TypeScript Errors

Run the TypeScript check script to identify specific errors:

```bash
# Windows
check-typescript-errors.bat

# Unix/Linux
./check-typescript-errors.sh
```

This script will:
- Run TypeScript type checking
- Identify files with errors
- Attempt to fix common issues related to the removed QuestionnaireEdit component
- Show remaining errors that need manual fixing

## Step 2: Fix QuestionnaireEditFix.tsx

The most likely issue is in `src/components/questionnaires/QuestionnaireEditFix.tsx`:

1. Open the file in your editor
2. Remove the `updateQuestionnaire` import:
   ```typescript
   // Change this:
   import { getQuestionnaireById, updateQuestionnaire, ... } from "@/services/PatientQuestionnaireService";
   
   // To this:
   import { getQuestionnaireById, ... } from "@/services/PatientQuestionnaireService";
   ```

3. Comment out or remove any code that calls `updateQuestionnaire`

## Step 3: Fix App.tsx

Check if there are any remaining references to QuestionnaireEdit:

1. Open `src/App.tsx`
2. Remove the import for QuestionnaireEdit if it exists
3. Remove the route for `/questionnaire/edit/:id` if it exists

## Step 4: Fix Questionnaires.tsx

Check if there are any remaining references to the Edit button:

1. Open `src/pages/Questionnaires.tsx`
2. Remove the Edit icon import if it exists
3. Remove the `handleEditQuestionnaire` function if it exists
4. Remove the Edit button from the questionnaire cards

## Step 5: Create or Update .env File

Create a minimal `.env` file in the project root:

```
VITE_APP_TITLE=EyeSentry
VITE_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the placeholder values with your actual Supabase credentials.

## Step 6: Reinstall Dependencies

Ensure all dependencies are properly installed:

```bash
npm install
```

## Step 7: Clean Build Cache

Remove any cached build artifacts:

```bash
rm -rf node_modules/.vite
rm -rf dist
```

## Step 8: Try Building Again

Attempt to build the project:

```bash
npm run build
```

## Step 9: Deploy to Cloudflare

If the build succeeds, deploy to Cloudflare:

```bash
# Windows
deploy-to-cloudflare.bat

# Unix/Linux
./deploy-to-cloudflare.sh
```

## Common TypeScript Errors and Solutions

### Error: Cannot find module 'QuestionnaireEdit' or its corresponding type declarations

**Solution**: Remove all imports and references to QuestionnaireEdit.

### Error: Property 'updateQuestionnaire' does not exist on type...

**Solution**: Remove all imports and calls to updateQuestionnaire.

### Error: Cannot find name 'handleEditQuestionnaire'

**Solution**: Remove the function and all references to it.

### Error: Module not found: Error: Can't resolve...

**Solution**: Install the missing dependency with `npm install`.

## If All Else Fails

If you continue to experience build issues:

1. Check the build log for specific errors
2. Try building with verbose output:
   ```bash
   npm run build -- --debug
   ```
3. Consider creating a minimal vite.config.ts:
   ```typescript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react-swc';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     build: {
       minify: false,
       sourcemap: true,
     },
   });
   ```

4. If you're still having issues, consider deploying manually through the Cloudflare dashboard:
   - Build locally (even with errors)
   - Upload the dist directory to Cloudflare Pages through the dashboard