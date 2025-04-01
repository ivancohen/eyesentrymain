#!/bin/bash
echo "Setting up chatbot tables..."
node --experimental-modules setup-chatbot-tables.js
echo "Press any key to continue..."
read -n 1