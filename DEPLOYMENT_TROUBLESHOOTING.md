# Cloudflare Pages Deployment Troubleshooting Guide

If you're experiencing issues deploying to Cloudflare Pages, this guide will help you diagnose and resolve common problems.

## Quick Troubleshooting

Run our automated troubleshooting script:

- Windows: `troubleshoot-deployment.bat`
- Unix/Linux: `./troubleshoot-deployment.sh`

This script will:
1. Check your Wrangler installation
2. Verify Cloudflare authentication
3. Validate your build output
4. Check your wrangler.toml configuration
5. Attempt a deployment with verbose output
6. Provide solutions for common issues

## Common Deployment Issues

### 1. Authentication Problems

**Symptoms:**
- "You must be logged in to deploy" error
- "Not authorized" error

**Solutions:**
```bash
# Log in to Cloudflare
npx wrangler login

# Verify you're logged in
npx wrangler whoami
```

### 2. Build Issues

**Symptoms:**
- Empty or missing dist directory
- Build errors in console

**Solutions:**
```bash
# Clean and rebuild
rm -rf dist
npm run build

# Check build output
ls -la dist
```

### 3. Account ID Issues

**Symptoms:**
- "No account ID found" error
- "Multiple accounts found" error

**Solutions:**
```bash
# Deploy with explicit account ID
npx wrangler pages deploy dist --account-id YOUR_ACCOUNT_ID
```

You can find your account ID in the Cloudflare dashboard URL: `https://dash.cloudflare.com/ACCOUNT_ID`

### 4. Project Name Issues

**Symptoms:**
- "Project not found" error
- "Multiple projects found" error

**Solutions:**
```bash
# Deploy with explicit project name
npx wrangler pages deploy dist --project-name eyesentry
```

### 5. Permission Issues

**Symptoms:**
- "Insufficient permissions" error
- "Access denied" error

**Solutions:**
- Verify you have the correct role in your Cloudflare account
- Create the Pages project first in the Cloudflare dashboard
- Try deploying through the Cloudflare dashboard directly

### 6. Network Issues

**Symptoms:**
- Timeouts
- Connection errors

**Solutions:**
- Check your internet connection
- Try again later
- Check [Cloudflare Status](https://www.cloudflarestatus.com/)

## Manual Deployment

If automated deployment continues to fail, try manual deployment:

1. **Build your project**:
   ```bash
   npm run build
   ```

2. **Go to Cloudflare Dashboard**:
   - Navigate to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Go to Pages
   - Select your project (or create a new one)

3. **Upload your files**:
   - Click "Upload" or "Deploy"
   - Select the `dist` directory from your project
   - Follow the prompts to complete the deployment

## Checking Wrangler Configuration

Ensure your `wrangler.toml` file is correctly configured:

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

## Debugging with Verbose Output

For more detailed error information:

```bash
npx wrangler pages deploy dist --verbose
```

## Environment Variables

If your app requires environment variables:

1. Check if they're properly set in your Cloudflare Pages project
2. For local testing, create a `.env` file (don't commit this to version control)
3. Make sure your build process includes these variables

## Getting More Help

If you're still experiencing issues:

1. **Cloudflare Documentation**:
   - [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
   - [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)

2. **Community Support**:
   - [Cloudflare Community Forums](https://community.cloudflare.com/)
   - [Cloudflare Discord](https://discord.gg/cloudflaredev)

3. **Official Support**:
   - Contact Cloudflare support through your dashboard
   - Submit a support ticket with detailed error information

## Advanced Troubleshooting

### Checking for API Rate Limits

Cloudflare has API rate limits that might affect deployments:

```bash
# Check your current rate limit status
npx wrangler pages project show --project-name eyesentry
```

### Checking for Large Files

Cloudflare Pages has file size limits:

```bash
# Find large files in your dist directory
find dist -type f -size +10M
```

### Checking for Too Many Files

Cloudflare Pages has limits on the number of files:

```bash
# Count files in your dist directory
find dist -type f | wc -l
```

### Checking for Unsupported File Types

Some file types might be blocked:

```bash
# List all file extensions in your dist directory
find dist -type f | sed -e 's/.*\.//' | sort | uniq -c | sort -rn
```

## After Successful Deployment

Once your deployment succeeds:

1. Test your application thoroughly
2. Set up custom domains if needed
3. Configure environment variables for different environments (production/preview)
4. Consider setting up continuous deployment from your repository