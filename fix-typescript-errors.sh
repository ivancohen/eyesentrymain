#!/bin/bash

echo "Fixing TypeScript errors..."
node fix-typescript-errors.js

if [ $? -ne 0 ]; then
  echo "TypeScript fix failed with error code $?"
  exit 1
fi

echo "TypeScript errors fixed successfully."