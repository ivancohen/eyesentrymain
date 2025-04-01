#!/bin/bash
echo "Setting up chatbot database tables directly..."
node --experimental-modules execute-chatbot-schema-direct.js
echo "Press any key to continue..."
read -n 1