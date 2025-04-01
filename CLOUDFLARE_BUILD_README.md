# Cloudflare Build Instructions

This directory contains scripts to download and use the working build from Cloudflare Pages.

## Files

- `cloudflare-build/` - Directory containing the downloaded files from Cloudflare Pages
- `copy-cloudflare-build.js` - Script to copy the Cloudflare build files to the local dist directory
- `copy-cloudflare-build.bat` - Windows batch file to run the copy script
- `copy-cloudflare-build.sh` - Unix/Linux/macOS shell script to run the copy script
- `serve-local.js` - Script to serve the application locally
- `serve-local.bat` - Windows batch file to run the local server
- `serve-local.sh` - Unix/Linux/macOS shell script to run the local server

## Instructions

### 1. Copy the Cloudflare Build

The Cloudflare build has already been downloaded and stored in the `cloudflare-build` directory. To copy these files to your local `dist` directory:

**Windows:**
```
copy-cloudflare-build.bat
```

**Unix/Linux/macOS:**
```
chmod +x copy-cloudflare-build.sh
./copy-cloudflare-build.sh
```

### 2. Serve the Application Locally

After copying the files, you can serve the application locally:

**Windows:**
```
serve-local.bat
```

**Unix/Linux/macOS:**
```
chmod +x serve-local.sh
./serve-local.sh
```

This will start a local server at http://localhost:3000 where you can view the application.

## Notes

- The Cloudflare build was downloaded from https://eyesentry.pages.dev
- The build includes all necessary assets, JavaScript, CSS, and configuration files
- The local server uses Express to serve the files and handle client-side routing