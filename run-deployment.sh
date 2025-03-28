#!/bin/bash

echo "Running EyeSentry Deployment Process..."

if [ $# -eq 0 ]; then
  echo "No approach specified. Using default (direct-build)."
  node run-deployment.js
else
  echo "Using approach: $1"
  node run-deployment.js "$@"
fi

if [ $? -ne 0 ]; then
  echo "Deployment failed with error code $?"
  exit 1
fi

echo "Deployment process completed. See above for details and next steps."