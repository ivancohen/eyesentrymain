#!/bin/bash

echo "Fixing TypeScript errors and deploying to Cloudflare..."
node fix-and-deploy.js

if [ $? -ne 0 ]; then
  echo "Fix and deploy process failed with error code $?"
  exit 1
fi

echo "Fix and deploy process completed successfully."