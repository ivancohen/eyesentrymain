#!/bin/bash

echo "Running Direct Build script..."
node direct-build.js

if [ $? -ne 0 ]; then
  echo "Direct Build failed with error code $?"
  exit 1
fi

echo "Direct Build completed. See above for details."