
#!/bin/bash
echo "Setting up chatbot database tables..."
node --experimental-modules execute-chatbot-schema.js
echo "Press any key to continue..."
read -n 1