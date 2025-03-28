#!/bin/bash

echo "Running Cloudflare Pages Deployment..."

if [ $# -eq 0 ]; then
  echo "No arguments provided. Running standard deployment."
  node deploy-to-cloudflare.js
else
  echo "Running deployment with arguments: $@"
  node deploy-to-cloudflare.js "$@"
fi

if [ $? -ne 0 ]; then
  echo "Deployment failed with error code $?"
  exit 1
fi

echo "Deployment completed. See above for details."