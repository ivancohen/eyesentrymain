@echo off
echo ===================================================
echo Complete Question Reordering Fix (Direct Approach)
echo ===================================================
echo.

echo Step 1: Directly updating database schema...
echo ---------------------------------------------------
node direct-fix-dropdown-options.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database schema update failed. Aborting.
    goto :error
)
echo.

echo Step 2: Fixing QuestionService.ts implementation...
echo ---------------------------------------------------
node fix-question-reordering-updated.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Service implementation fix failed. Aborting.
    goto :error
)
echo.

echo Step 3: Restarting the server to apply changes...
echo ---------------------------------------------------
call restart-server.bat
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Server restart had issues, but continuing.
)
echo.

echo Step 4: Testing the reordering functionality...
echo ---------------------------------------------------
node test-question-reordering.js
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Test failed. The fix may need adjustments.
    goto :incomplete
)

echo.
echo ===================================================
echo 🎉 SUCCESS! Question reordering is now working
echo ===================================================
echo The following fixes have been applied:
echo  - Added display_order column to dropdown_options table
echo  - Updated QuestionService.ts to properly handle display_order
echo  - Implemented direct reordering without PostgreSQL function dependency
echo  - Verified functionality with automated tests
echo.
goto :end

:error
echo.
echo ===================================================
echo ❌ ERROR: Fix process encountered problems
echo ===================================================
echo Please check the logs above for details on what failed.
echo.
goto :end

:incomplete
echo.
echo ===================================================
echo ⚠️ WARNING: Fix applied but test failed
echo ===================================================
echo The fixes have been applied, but the test did not complete successfully.
echo This may indicate additional issues that need to be addressed.
echo.

:end
pause