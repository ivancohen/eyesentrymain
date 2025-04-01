@echo off
echo Setting up chatbot database tables...
node --experimental-modules execute-chatbot-schema.js
pause