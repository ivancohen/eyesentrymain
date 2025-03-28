@echo off
echo ================================================================================
echo RUNNING RISK ASSESSMENT RECOMMENDATIONS DIAGNOSTICS
echo ================================================================================

echo.
echo This script will diagnose why risk assessment recommendations aren't showing up.
echo.

node diagnose-risk-recommendations.js

echo.
echo ================================================================================
echo NEXT STEPS
echo ================================================================================
echo.
echo 1. Review the diagnostic results above
echo 2. Open test-risk-recommendations.html in your browser to verify display works
echo 3. Check if recommendations are coming from database but not displaying
echo.
echo If the test page displays recommendations correctly but the app doesn't,
echo there's likely an issue with how the app renders the recommendations.
echo.

pause