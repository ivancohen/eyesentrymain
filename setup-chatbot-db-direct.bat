@echo off
echo Setting up chatbot database tables directly...
node --experimental-modules execute-chatbot-schema-direct.js
pause