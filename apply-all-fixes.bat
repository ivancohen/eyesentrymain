@echo off
echo ===== Eye Sentry Application Fix Script =====
echo This script will guide you through fixing all issues in the application.
echo.

echo Step 1: Fix the Supabase Infinite Recursion Issue (Database-Level)
echo -------------------------------------------------------------
echo Please follow these steps in the Supabase SQL Editor:
echo 1. Run the SQL query to identify problematic policies
echo 2. Drop the recursive policy
echo 3. Create a new, non-recursive policy
echo.
echo For detailed instructions, see fix-supabase-policy-recursion.js
echo.
echo Press any key when you've completed this step...
pause > nul

echo.
echo Step 2: Fix the Auth Refresh Token Error
echo -------------------------------------------------------------
echo 1. Creating the session check utility...
echo.
echo Creating directory if it doesn't exist...
if not exist "src\utils" mkdir "src\utils"

echo Creating sessionCheck.ts...
node -e "const fs = require('fs'); const content = `import { supabase } from '@/lib/supabase';\n\n/**\n * Utility to check if there's a valid session and refresh it if needed\n * @returns True if a valid session exists or was refreshed successfully\n */\nexport const ensureValidSession = async (): Promise<boolean> => {\n  try {\n    // Check if we have a session\n    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();\n    \n    if (sessionError) {\n      console.error(\"Error checking session:\", sessionError);\n      return false;\n    }\n    \n    if (!sessionData?.session) {\n      console.log(\"No active session found\");\n      return false;\n    }\n    \n    // Check if the session is expired or about to expire (within 5 minutes)\n    const expiresAt = sessionData.session.expires_at;\n    const now = Math.floor(Date.now() / 1000);\n    const fiveMinutes = 5 * 60;\n    \n    if (expiresAt && expiresAt < now + fiveMinutes) {\n      console.log(\"Session is expired or about to expire, attempting to refresh\");\n      const { error: refreshError } = await supabase.auth.refreshSession();\n      \n      if (refreshError) {\n        console.error(\"Failed to refresh session:\", refreshError);\n        return false;\n      }\n      \n      console.log(\"Session refreshed successfully\");\n    }\n    \n    return true;\n  } catch (error) {\n    console.error(\"Error in ensureValidSession:\", error);\n    return false;\n  }\n};\n\n/**\n * Call this function before making important API calls\n * @param callback Function to execute if session is valid\n * @returns The result of the callback or null if session is invalid\n */\nexport const withValidSession = async <T>(callback: () => Promise<T>): Promise<T | null> => {\n  const isValid = await ensureValidSession();\n  \n  if (!isValid) {\n    console.error(\"No valid session available\");\n    return null;\n  }\n  \n  return await callback();\n};`; fs.writeFileSync('src/utils/sessionCheck.ts', content);"

echo.
echo 2. Now you need to update AuthContext.tsx to handle token refresh errors.
echo For detailed instructions, see fix-auth-refresh-token.js
echo.
echo Press any key when you've completed this step...
pause > nul

echo.
echo Step 3: Implement Application-Level Error Handling
echo -------------------------------------------------------------
echo 1. Creating the error handling utility...
echo.
echo Creating directory if it doesn't exist...
if not exist "src\utils" mkdir "src\utils"

echo Creating supabaseErrorHandler.ts...
node -e "const fs = require('fs'); const content = `import { supabase } from '@/lib/supabase';\nimport { toast } from 'sonner';\n\n/**\n * Utility for handling Supabase errors with retry logic and fallbacks\n */\nexport const supabaseErrorHandler = {\n  /**\n   * Execute a Supabase query with retry logic and error handling\n   * @param queryFn Function that returns a Supabase query\n   * @param fallbackValue Value to return if all retries fail\n   * @param maxRetries Maximum number of retry attempts\n   * @returns Query result or fallback value\n   */\n  async executeQuery<T>(\n    queryFn: () => Promise<{ data: T | null; error: any }>,\n    fallbackValue: T,\n    maxRetries = 3\n  ): Promise<T> {\n    let retries = 0;\n    let lastError: any = null;\n\n    while (retries <= maxRetries) {\n      try {\n        // Add exponential backoff delay after first attempt\n        if (retries > 0) {\n          const delay = Math.pow(2, retries - 1) * 1000; // 1s, 2s, 4s\n          await new Promise(resolve => setTimeout(resolve, delay));\n          console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms`);\n        }\n\n        const { data, error } = await queryFn();\n\n        if (error) {\n          lastError = error;\n          console.error(`Supabase query error (attempt ${retries + 1}/${maxRetries + 1}):`, error);\n          \n          // Check if it's an auth error that might be fixed by refreshing the session\n          if (error.message?.includes('JWT') || error.message?.includes('token')) {\n            console.log('Attempting to refresh auth session...');\n            const { error: refreshError } = await supabase.auth.refreshSession();\n            if (refreshError) {\n              console.error('Failed to refresh session:', refreshError);\n            }\n          }\n          \n          retries++;\n          continue;\n        }\n\n        return data || fallbackValue;\n      } catch (error) {\n        lastError = error;\n        console.error(`Unexpected error in query (attempt ${retries + 1}/${maxRetries + 1}):`, error);\n        retries++;\n      }\n    }\n\n    // All retries failed, log the error and return fallback\n    console.error(`All ${maxRetries + 1} query attempts failed. Last error:`, lastError);\n    \n    // Only show toast for network errors, not for expected 500 errors\n    if (lastError?.message?.includes('network') || lastError?.code === 'NETWORK_ERROR') {\n      toast.error('Network error. Please check your connection and try again.');\n    }\n    \n    return fallbackValue;\n  },\n\n  /**\n   * Categorize an error for better handling\n   * @param error The error to categorize\n   * @returns The error category\n   */\n  categorizeError(error: any): 'server' | 'auth' | 'network' | 'unknown' {\n    if (!error) return 'unknown';\n    \n    const errorMessage = error.message?.toLowerCase() || '';\n    const statusCode = error.status || error.statusCode || 0;\n    \n    if (statusCode >= 500 || errorMessage.includes('500')) {\n      return 'server';\n    }\n    \n    if (statusCode === 401 || statusCode === 403 || \n        errorMessage.includes('jwt') || errorMessage.includes('token') || \n        errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {\n      return 'auth';\n    }\n    \n    if (errorMessage.includes('network') || error.code === 'NETWORK_ERROR') {\n      return 'network';\n    }\n    \n    return 'unknown';\n  },\n\n  /**\n   * Create a minimal profile with default values\n   * @param userId The user ID\n   * @returns A minimal profile object\n   */\n  createMinimalProfile(userId: string) {\n    return {\n      id: userId,\n      is_suspended: false,\n      created_at: new Date().toISOString(),\n      updated_at: new Date().toISOString(),\n      role: 'user'\n    };\n  }\n};`; fs.writeFileSync('src/utils/supabaseErrorHandler.ts', content);"

echo.
echo 2. Now you need to update AuthContext.tsx and FixedAdminService.ts to use the error handler.
echo For detailed instructions, see implement-supabase-error-handling.js
echo.
echo Press any key when you've completed this step...
pause > nul

echo.
echo Step 4: Fix React Router Warnings
echo -------------------------------------------------------------
echo 1. Creating router configuration...
echo.
echo Creating directory if it doesn't exist...
if not exist "src\router" mkdir "src\router"

echo Creating config.js...
node -e "const fs = require('fs'); const content = `// React Router configuration with future flags\nexport const routerConfig = {\n  future: {\n    v7_startTransition: true,\n    v7_relativeSplatPath: true\n  }\n};`; fs.writeFileSync('src/router/config.js', content);"

echo.
echo 2. Now you need to update your BrowserRouter implementation.
echo For detailed instructions, see fix-react-router-warnings.js
echo.
echo Press any key when you've completed this step...
pause > nul

echo.
echo ===== All fixes have been applied! =====
echo.
echo Please restart your development server and verify that:
echo 1. No 500 errors appear in the console when fetching profiles
echo 2. The application continues to function with fallback values if errors occur
echo 3. No React Router warnings appear in the console
echo.
echo For detailed verification steps, see fix-all-issues-guide.md
echo.
echo Press any key to exit...
pause > nul