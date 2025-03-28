# EyeSentry Manual Deployment Guide

This guide provides step-by-step instructions for manually deploying the EyeSentry application to Cloudflare Pages. This approach is the most reliable fallback option when automated builds fail.

## Quick Start

Run the manual deployment preparation script to get started:

```bash
# Windows
manual-deploy.bat

# Unix/Linux/macOS
chmod +x manual-deploy.sh
./manual-deploy.sh
```

## Manual Deployment Process

### Step 1: Prepare Deployment Files

The manual deployment script will:

1. Check for an existing build in the `dist` directory
2. Attempt a minimal build with TypeScript checking disabled if no build exists
3. Create a minimal placeholder site if all build attempts fail
4. Provide instructions for uploading files to Cloudflare Pages

### Step 2: Upload to Cloudflare Pages

1. Log in to your Cloudflare account: [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Navigate to "Pages" in the left sidebar
3. Click "Create a project" or select your existing "eyesentry" project
4. Choose "Direct Upload" option
5. Set project name to "eyesentry" (if creating new)
6. Upload one of the following:
   - Files from the `dist` directory (if build succeeded)
   - Files from the `minimal-deploy` directory (if build failed)
7. Click "Save and Deploy"
8. Wait for the deployment to complete

### Step 3: Verify Deployment

After deployment completes:

1. Visit your Cloudflare Pages URL (shown in the Cloudflare dashboard)
2. Verify that the site loads correctly
3. Check for any console errors in browser developer tools

## Troubleshooting

### Issue: Upload Fails

**Solution**: Try uploading fewer files at a time or use a different browser.

### Issue: Deployed Site Shows 404 Error

**Solution**: Ensure you've uploaded the root index.html file and check Cloudflare Pages settings.

### Issue: Site Loads But Functionality Doesn't Work

**Solution**: This is expected with the minimal placeholder site. When a proper build succeeds, redeploy with those files.

## Post-Deployment Steps

After successful deployment:

1. Configure any custom domains if needed
2. Set up environment variables in the Cloudflare dashboard
3. Plan for a proper fix of the TypeScript errors for future deployments

## Long-Term Plan

1. Properly fix TypeScript errors
2. Ensure all files with TypeScript syntax have correct extensions
3. Clean up references to removed components
4. Implement proper testing and CI/CD for future deployments

## Related Files

- `manual-deploy.js`: Main script for preparing manual deployment
- `manual-deploy.bat`: Windows wrapper script
- `manual-deploy.sh`: Unix/Linux wrapper script

## Notes

This manual deployment approach is intended as a temporary solution to get the application deployed when automated builds fail. It's recommended to address the underlying TypeScript and build configuration issues for a more sustainable long-term solution.