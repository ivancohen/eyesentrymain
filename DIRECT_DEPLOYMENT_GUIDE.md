# Direct Deployment to Cloudflare Pages

This document provides a step-by-step guide for deploying the application directly to Cloudflare Pages after a successful build.

## Prerequisites

Before deployment, ensure you have:

1. A successful build (the `dist` directory is created)
2. Cloudflare account credentials
3. Wrangler CLI installed and authenticated

## Deployment Options

There are three methods to deploy to Cloudflare Pages:

1. **Using Wrangler CLI** (Recommended)
2. **Manual upload through Cloudflare Dashboard**
3. **Direct API deployment** (Advanced)

## Method 1: Using Wrangler CLI

### Step 1: Ensure Wrangler is Installed and Authenticated

```bash
# Check if Wrangler is installed
npx wrangler --version

# If not installed, install it
npm install -g wrangler

# Authenticate with Cloudflare
npx wrangler login
```

### Step 2: Configure Deployment

Ensure your `wrangler.toml` file has the correct configuration:

```toml
name = "eyesentry"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[build]
command = "npm run build"
cwd = "."

[build.environment]
NODE_VERSION = "20"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

### Step 3: Deploy Using Wrangler

```bash
# If you already have a build and want to skip the build step
npx wrangler pages deploy dist --project-name eyesentry
```

### Step 4: Verify Deployment

After deployment, Wrangler will provide a URL to view your deployed application. Verify that everything works correctly.

## Method 2: Manual Upload Through Cloudflare Dashboard

If the CLI method fails, you can manually upload the build through the Cloudflare Dashboard.

### Step 1: Access Cloudflare Pages

1. Log in to your Cloudflare account: [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Navigate to "Pages" in the left sidebar

### Step 2: Create or Select a Project

If you're deploying for the first time:
1. Click "Create a project"
2. Select "Direct Upload"
3. Enter "eyesentry" as the project name
4. Click "Create project"

If you're updating an existing project:
1. Select the "eyesentry" project
2. Click "Deployments" tab
3. Click "Upload"

### Step 3: Upload the Build

1. Click "Deploy site" or "Upload"
2. Drag and drop the `dist` directory or click to browse and select it
3. Wait for the upload to complete
4. Click "Save and Deploy"

### Step 4: Configure Settings

After deployment, configure the following settings:

1. **Environment Variables**: Add any required environment variables
2. **Custom Domain**: Configure a custom domain if needed
3. **Build Settings**: Set up build cache and other options

## Method 3: Direct API Deployment (Advanced)

For automated CI/CD pipelines, you can use the Cloudflare API directly.

### Step 1: Get API Tokens

1. Go to your Cloudflare account dashboard
2. Navigate to "Profile" > "API Tokens"
3. Create a new token with "Pages:Edit" permission

### Step 2: Use API for Deployment

Use the Cloudflare API to create a deployment:

```bash
# Zip the dist directory
zip -r dist.zip dist

# Upload using curl
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments" \
  -H "Authorization: Bearer {api_token}" \
  -F "file=@dist.zip"
```

Replace `{account_id}`, `{project_name}`, and `{api_token}` with your actual values.

## Troubleshooting Deployment Issues

### Issue: Access Denied

**Solution**: Ensure you're logged in with the correct Cloudflare account and have proper permissions.

```bash
npx wrangler logout
npx wrangler login
```

### Issue: Project Not Found

**Solution**: Ensure the project name is correct or create a new project.

```bash
# List all projects
npx wrangler pages project list

# Create a new project
npx wrangler pages project create eyesentry
```

### Issue: Upload Failures

**Solution**: Try uploading in smaller chunks or use the Cloudflare Dashboard.

### Issue: Build Issues

**Solution**: Ensure the build is successful before attempting deployment.

```bash
# Verify the dist directory exists and has content
ls -la dist
```

## Post-Deployment Verification

After successful deployment:

1. **Test Core Functionality**: Navigate through the application to ensure everything works
2. **Check Console for Errors**: Open browser developer tools to check for JavaScript errors
3. **Verify API Connections**: Ensure the application can connect to your backend APIs
4. **Test on Multiple Devices**: Check responsiveness on different screen sizes

## Continuous Deployment

For long-term management, consider setting up continuous deployment:

1. Connect your GitHub repository to Cloudflare Pages
2. Configure automatic deployments on push to main branch
3. Set up preview deployments for pull requests

This eliminates the need for manual deployments in the future.