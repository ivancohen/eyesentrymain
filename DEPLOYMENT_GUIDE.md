# Deployment Guide for Cloudflare Pages

This guide explains how to deploy the application to Cloudflare Pages.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account. If you don't have one, [sign up here](https://dash.cloudflare.com/sign-up).

2. **Wrangler CLI**: The Cloudflare Pages deployment tool. It's included as a dependency in this project, but you can also install it globally:
   ```bash
   npm install -g wrangler
   ```

3. **Authentication**: You need to be logged in to Cloudflare via Wrangler:
   ```bash
   npx wrangler login
   ```
   This will open a browser window to authenticate with your Cloudflare account.

## Deployment Methods

### Method 1: Using the Deployment Scripts (Recommended)

We've created scripts to simplify the deployment process:

#### For Windows:
```bash
./deploy-to-cloudflare.bat
```

#### For Unix/Linux/macOS:
```bash
chmod +x deploy-to-cloudflare.sh
./deploy-to-cloudflare.sh
```

#### Using npm:
```bash
npm run deploy
```

These scripts will:
1. Build the application
2. Deploy it to Cloudflare Pages
3. Provide feedback on the deployment process

### Method 2: Manual Deployment

If you prefer to deploy manually:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy dist
   ```
   
   Or use the npm script:
   ```bash
   npm run deploy:cloudflare
   ```

## Configuration

The deployment configuration is defined in `wrangler.toml`:

```toml
name = "eyesentry"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
include = ["**/*"]
exclude = ["node_modules/*"]

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

This configuration:
- Sets the project name to "eyesentry"
- Specifies the build output directory as "./dist"
- Configures the build command
- Sets up a redirect rule for client-side routing

## First-time Deployment

If this is your first time deploying this project to Cloudflare Pages:

1. Run the deployment command
2. Wrangler will prompt you to create a new project
3. Choose a project name (or use the default "eyesentry")
4. Select your Cloudflare account
5. Choose production branch (usually "main")

## Viewing Your Deployment

After deployment:

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Pages"
3. Select your project
4. You'll see your deployment with a unique URL

## Environment Variables

If your application requires environment variables:

1. Go to your project in the Cloudflare Dashboard
2. Navigate to "Settings" > "Environment variables"
3. Add your variables for Production and Preview environments

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Run `npx wrangler login` to re-authenticate

2. **Build Failures**:
   - Check the build output for errors
   - Verify that `npm run build` works locally

3. **Deployment Failures**:
   - Ensure you have the necessary permissions in your Cloudflare account
   - Check if you've reached any account limits

4. **Missing Dependencies**:
   - Run `npm install` to ensure all dependencies are installed

### Getting Help

If you encounter issues not covered here:

1. Check the [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
2. Visit the [Cloudflare Community forums](https://community.cloudflare.com/)
3. Contact Cloudflare support through your dashboard

## Continuous Deployment

For automated deployments, consider setting up a GitHub integration:

1. Go to your project in the Cloudflare Dashboard
2. Navigate to "Settings" > "Git Integration"
3. Connect your GitHub repository
4. Configure build settings

This will automatically deploy your application when you push to your repository.