@echo off
echo ================================================================================
echo APPLYING RISK ASSESSMENT SERVICE FIX
echo ================================================================================

echo Creating backup...
copy "src\services\RiskAssessmentService.ts" "src\services\RiskAssessmentService.ts.backup"
echo ✅ Backup created

echo Copying fixed version...
copy "src\services\RiskAssessmentService.fixed.ts" "src\services\RiskAssessmentService.ts"
echo ✅ Fixed version applied

echo.
echo ================================================================================
echo RISK ASSESSMENT SERVICE FIX APPLIED SUCCESSFULLY
echo ================================================================================
echo.
echo The RiskAssessmentService.ts file has been updated with the following improvements:
echo 1. Added client-side caching to provide fallback when database operations fail
echo 2. Added error handling to prevent 403 permission errors from breaking the UI
echo 3. Implemented fallback advice data for when database isn't accessible
echo 4. Improved error messages and logging
echo.
echo You should now rebuild and redeploy the application to apply these changes.

echo.
pause