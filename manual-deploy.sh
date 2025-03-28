#!/bin/bash

echo "Running Manual Deployment Preparation..."
node manual-deploy.js

if [ $? -ne 0 ]; then
  echo "Manual deployment preparation failed with error code $?"
  exit 1
fi

echo "Manual deployment preparation completed."