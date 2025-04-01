# Deployment Process

This package contains scripts to create a restore point, set up transparent logo, update logo references, update GitHub, and deploy to Cloudflare.

## Overview

The deployment process consists of six main steps:

1. **Create Restore Point**: Creates a backup of key files before deployment
2. **Set Up Transparent Logo**: Ensures the transparent logo is available in the assets directory
3. **Update Logo References**: Updates all logo references in the codebase to use the transparent logo
4. **Update Specialist Form Logo**: Adds the logo to the specialist assessment form
5. **Update GitHub**: Commits and pushes changes to your GitHub repository
6. **Deploy to Cloudflare**: Builds the project and deploys it to your Cloudflare instance

## Scripts Included

### Main Scripts

1. **create-restore-point.js**: Creates a backup of key files in a timestamped directory
2. **save-transparent-logo.js**: Sets up the transparent logo in the assets directory
3. **update-all-logos.js**: Updates all logo references to use the transparent logo
4. **update-specialist-form-logo.js**: Adds logo to the specialist assessment form
5. **update-github.js**: Commits and pushes changes to your GitHub repository
6. **deploy-to-cloudflare.js**: Builds the project and deploys it to your Cloudflare instance
7. **build-update-deploy.js**: Runs all six steps in sequence

### Convenience Scripts

1. **build-update-deploy.bat**: Windows batch script to run the full process
2. **build-update-deploy.sh**: Unix/Linux/Mac shell script to run the full process
3. **save-transparent-logo.bat/.sh**: Scripts to set up the transparent logo
4. **update-all-logos.bat/.sh**: Scripts to update all logo references
5. **update-specialist-form-logo.bat/.sh**: Scripts to update specialist form logo

## How to Use

### Full Deployment Process

To run the full deployment process (restore point, logo updates, GitHub update, and Cloudflare deployment):

```bash
# For Windows users
build-update-deploy.bat

# For Unix/Linux/Mac users
chmod +x build-update-deploy.sh
./build-update-deploy.sh

# Or directly with Node.js
node build-update-deploy.js
```

### Individual Steps

If you prefer to run each step individually:

#### 1. Create Restore Point

```bash
node create-restore-point.js
```

This will:
- Create a timestamped directory in the `restore-points` folder
- Copy key files to the restore point directory
- Create a README.md file in the restore point directory with instructions

#### 2. Set Up Transparent Logo

```bash
# For Windows users
save-transparent-logo.bat

# For Unix/Linux/Mac users
chmod +x save-transparent-logo.sh
./save-transparent-logo.sh

# Or directly with Node.js
node save-transparent-logo.js
```

This will:
- Create the src/assets directory if it doesn't exist
- Create a placeholder for the transparent logo
- Provide instructions for saving the transparent logo to src/assets/logo.png

#### 3. Update All Logo References

```bash
# For Windows users
update-all-logos.bat

# For Unix/Linux/Mac users
chmod +x update-all-logos.sh
./update-all-logos.sh

# Or directly with Node.js
node update-all-logos.js
```

This will:
- Find all files in the codebase that reference logos
- Update all logo references to use the transparent logo at src/assets/logo.png
- Ensure consistency across the entire application

#### 4. Update Specialist Form Logo

```bash
# For Windows users
update-specialist-form-logo.bat

# For Unix/Linux/Mac users
chmod +x update-specialist-form-logo.sh
./update-specialist-form-logo.sh

# Or directly with Node.js
node update-specialist-form-logo.js
```

This will:
- Add the logo to the specialist assessment form
- Update the update-logos.js script to include this change
- Update the DEPLOYMENT_README.md to mention this change

#### 5. Update GitHub

```bash
node update-github.js
```

This will:
- Create a restore point (if not already created)
- Add all changes to git
- Commit changes with a descriptive message
- Push changes to GitHub

#### 6. Deploy to Cloudflare

```bash
node deploy-to-cloudflare.js
```

This will:
- Build the project using `npm run build`
- Look for an existing Cloudflare deployment script
- If found, execute the existing script
- If not found, attempt to deploy using Cloudflare Wrangler

## Restore Points

Restore points are created in the `restore-points` directory with timestamped folder names. Each restore point contains:

- Backup of key files
- README.md file with instructions on how to restore

The following files are backed up:

- `src/components/questionnaires/QuestionnaireForm.tsx`
- `src/components/questionnaires/QuestionnaireContainer.tsx`
- `src/services/RiskAssessmentService.ts`
- `src/components/admin/RiskAssessmentAdmin.tsx`
- `src/components/admin/EnhancedQuestionManager.tsx`
- `src/services/QuestionService.ts`
- `src/pages/Index.tsx`
- `package.json`

## Transparent Logo Implementation

The transparent logo implementation ensures that all logos across the application use the same transparent logo file. This provides a consistent look and feel, especially on colored backgrounds.

### Key Features

1. **Transparent Background**: The logo has a transparent background, allowing it to blend seamlessly with any background color
2. **Consistent Sizing**: The logo is displayed at appropriate sizes throughout the application
3. **Centralized Asset**: All logo references point to a single file at src/assets/logo.png

### Landing Page Implementation

The landing page has been updated to:

1. Display the eye image in place of the logo on the left side
2. Show the transparent logo on top of the doctor access box
3. Ensure proper spacing and sizing for optimal visual appeal
4. Provide a responsive design that works on all device sizes

## Troubleshooting

### Logo Issues

If you encounter issues with the logo:

1. Ensure the transparent logo file is correctly placed at `src/assets/logo.png`
2. Check that the file has a transparent background (not white)
3. Run the `update-all-logos.js` script to update all logo references
4. Verify that the logo appears correctly on colored backgrounds

### GitHub Update Issues

If you encounter issues with the GitHub update:

1. Check if you have git installed and configured
2. Ensure you have the necessary permissions to push to the repository
3. Check if there are any merge conflicts
4. Try running `git push` manually

### Cloudflare Deployment Issues

If you encounter issues with the Cloudflare deployment:

1. Check if you have an existing Cloudflare deployment script
2. Ensure you have Cloudflare Wrangler installed
3. Verify that you're logged in to Cloudflare
4. Check if your project builds successfully with `npm run build`

## Restoring from a Restore Point

If you need to restore from a restore point:

1. Navigate to the restore point directory in `restore-points`
2. Copy the files from the restore point back to their original locations
3. Rebuild and redeploy the project

## Notes

- The scripts automatically create backups before making any changes
- The GitHub update includes a descriptive commit message
- The Cloudflare deployment attempts to use existing deployment scripts before falling back to Wrangler
- The transparent logo implementation ensures consistency across the entire application