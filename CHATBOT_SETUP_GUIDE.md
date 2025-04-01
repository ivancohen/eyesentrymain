# Chatbot Setup Guide

This guide provides detailed instructions for setting up the chatbot functionality for the Eye Sentry application.

## Prerequisites

- Node.js installed on your system
- Access to your Supabase project dashboard
- Admin privileges for the Eye Sentry application

## Step 1: Configure Environment Variables

There are two ways to set up the required environment variables:

### Option 1: Using a .env file (Recommended)

1. Create or edit the `.env` file in the project root directory
2. Add the following variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

3. Replace the placeholder values with your actual Supabase URL and service role key
   - You can find these values in your Supabase dashboard under Settings > API
   - The service role key is listed under "service_role" (not the anon key)

### Option 2: Using Environment Variables Directly in Command

If you don't want to create a .env file, you can provide the variables directly when running the script:

**Windows (CMD):**
```
set SUPABASE_URL=https://your-project-id.supabase.co && set SUPABASE_SERVICE_KEY=your-service-role-key-here && node execute-chatbot-schema.js
```

**Windows (PowerShell):**
```
$env:SUPABASE_URL="https://your-project-id.supabase.co"; $env:SUPABASE_SERVICE_KEY="your-service-role-key-here"; node execute-chatbot-schema.js
```

**Mac/Linux:**
```
SUPABASE_URL=https://your-project-id.supabase.co SUPABASE_SERVICE_KEY=your-service-role-key-here node execute-chatbot-schema.js
```

## Step 2: Run the Database Migration Script

Once you have set up the environment variables, run the migration script:

```
node execute-chatbot-schema.js
```

This script will:
1. Create the necessary database tables (`chatbot_faqs` and `chatbot_history`)
2. Set up appropriate indexes for performance
3. Configure row-level security policies
4. Populate the tables with initial FAQ data

If you encounter any issues, the script will provide detailed error messages to help troubleshoot.

## Step 3: Verify the Setup

After running the script, you can verify that the setup was successful by:

1. Checking your Supabase dashboard to confirm the tables were created
2. Navigating to the Doctor dashboard in the application to see the Knowledge Base section
3. Accessing the Admin Dashboard and checking the Chatbot Knowledge Base management section

## Troubleshooting

### Common Issues

1. **"Error: Supabase URL or service role key is missing"**
   - Make sure you've correctly set up the environment variables
   - Check for typos in variable names
   - Ensure the values are correct and properly formatted

2. **"ERROR: 42703: column 'category' does not exist"**
   - This error can occur if there's an issue with the transaction order in the SQL script
   - The updated script should fix this issue by using separate transactions and existence checks
   - If you still encounter this error, try running the script again or use the direct execution method:
     ```
     node execute-chatbot-schema-direct.js
     ```

3. **"Error executing statement: relation already exists"**
   - This is not a critical error; it means the tables already exist
   - The script will continue and update any necessary configurations

4. **"Error creating exec_sql function"**
   - The script will automatically fall back to a direct execution method
   - This is expected behavior in some environments

5. **"Permission denied" errors**
   - Make sure you're using the service role key, not the anon key
   - Verify that your Supabase user has the necessary permissions

### Getting Help

If you continue to experience issues, please:

1. Check the console output for specific error messages
2. Refer to the CHATBOT_IMPLEMENTATION.md file for additional details
3. Contact the development team with the specific error messages you're encountering