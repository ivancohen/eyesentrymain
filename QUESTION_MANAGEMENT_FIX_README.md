# Question Management Fix

This directory contains scripts to fix an issue with the Question Management page where editing dropdown options fails with the error:

```
Error updating dropdown option: {code: 'PGRST204', details: null, hint: null, message: "Could not find the 'display_order' column of 'dropdown_options' in the schema cache"}
```

## The Issue

The application code is expecting a 'display_order' column in the 'dropdown_options' table, but this column doesn't exist in the database yet. This causes errors when trying to update dropdown options.

## Fix Options

### Option 1: Quick Fix (Recommended for immediate use)

This option modifies the QuestionService.ts file to handle the missing column by removing the 'display_order' field from dropdown option operations.

1. Run the fix script:

   **Windows:**
   ```
   fix-question-service.bat
   ```

   **Unix/Linux/macOS:**
   ```
   chmod +x fix-question-service.sh
   ./fix-question-service.sh
   ```

2. Restart the server:

   **Windows:**
   ```
   restart-server.bat
   ```

   **Unix/Linux/macOS:**
   ```
   chmod +x restart-server.sh
   ./restart-server.sh
   ```

### Option 2: Database Fix (Recommended for permanent solution)

This option adds the missing 'display_order' column to the 'dropdown_options' table in the database.

#### Option 2A: Using JavaScript Client

1. Install the required dependencies:
   ```
   npm install @supabase/supabase-js dotenv
   ```

2. Run the SQL script:

   **Windows:**
   ```
   add-display-order-to-dropdown-options.bat
   ```

   **Unix/Linux/macOS:**
   ```
   chmod +x add-display-order-to-dropdown-options.sh
   ./add-display-order-to-dropdown-options.sh
   ```

#### Option 2B: Using Supabase MCP Server (Advanced)

This option uses a Model Context Protocol (MCP) server to interact with Supabase.

1. Set up the Supabase MCP server:
   ```
   C:\Users\ivanc\AppData\Roaming\Roo-Code\MCP\supabase-server\setup.bat
   C:\Users\ivanc\AppData\Roaming\Roo-Code\MCP\supabase-server\update-mcp-settings.bat
   ```

2. Restart VSCode to apply the changes.

3. Run the script to use the MCP server:

   **Windows:**
   ```
   use-supabase-mcp.bat
   ```

   **Unix/Linux/macOS:**
   ```
   chmod +x use-supabase-mcp.sh
   ./use-supabase-mcp.sh
   ```

4. After VSCode restarts, you can use the MCP tool directly:

   ```
   <use_mcp_tool>
   <server_name>supabase</server_name>
   <tool_name>add_display_order_column</tool_name>
   <arguments>
   {}
   </arguments>
   </use_mcp_tool>
   ```

## Files

- `fix-question-service.js` - Script to fix the QuestionService.ts file
- `fix-question-service.bat` - Windows batch file to run the fix script
- `fix-question-service.sh` - Unix/Linux/macOS shell script to run the fix script
- `restart-server.js` - Script to restart the server with the fix
- `restart-server.bat` - Windows batch file to run the restart script
- `restart-server.sh` - Unix/Linux/macOS shell script to run the restart script
- `add_display_order_to_dropdown_options.sql` - SQL script to add the missing column
- `execute-sql-fix.js` - Script to execute the SQL using the Supabase JavaScript client
- `execute-sql-fix.bat` - Windows batch file to run the SQL execution script
- `execute-sql-fix.sh` - Unix/Linux/macOS shell script to run the SQL execution script
- `add-display-order-to-dropdown-options.bat` - Windows batch file to run the complete database fix
- `add-display-order-to-dropdown-options.sh` - Unix/Linux/macOS shell script to run the complete database fix
- `create-execute-sql-function.sql` - SQL script to create the execute_sql function
- `use-supabase-mcp.js` - Script to use the Supabase MCP server
- `use-supabase-mcp.bat` - Windows batch file to run the MCP script
- `use-supabase-mcp.sh` - Unix/Linux/macOS shell script to run the MCP script

## Supabase MCP Server

The Supabase MCP server is located at:
```
C:\Users\ivanc\AppData\Roaming\Roo-Code\MCP\supabase-server
```

It provides the following tools:
- `execute_sql` - Execute a SQL query on the Supabase database
- `add_column` - Add a column to a table in the Supabase database
- `add_display_order_column` - Add display_order column to dropdown_options table

## Backup Files

- `src/services/QuestionService.ts.backup` - Backup of the original QuestionService.ts file

## Notes

- The quick fix is a temporary solution that allows the application to work without the 'display_order' column.
- The database fix is a permanent solution that adds the missing column to the database.
- If you apply the database fix, you can revert the code changes by restoring the backup file.
- The database fix requires the Supabase JavaScript client and dotenv packages.
- The MCP server option requires VSCode to be restarted after setup.