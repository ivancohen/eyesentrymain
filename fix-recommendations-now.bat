@echo off
echo ================================================================================
echo FIXING RISK ASSESSMENT RECOMMENDATIONS DISPLAY
echo ================================================================================

echo Running comprehensive fix script...
node fix-recommendations-now.js

IF %ERRORLEVEL% NEQ 0 (
  echo Error: Fix script failed to complete.
  pause
  exit /b 1
)

echo.
echo ================================================================================
echo BUILD APPLICATION
echo ================================================================================
echo.
echo Would you like to build the application now to apply these changes? (Y/N)
choice /c YN /m "Build now"

IF %ERRORLEVEL% EQU 1 (
  echo.
  echo Building application...
  call npm run build

  IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo START DEVELOPMENT SERVER
    echo ================================================================================
    echo.
    echo Would you like to start the development server now? (Y/N)
    choice /c YN /m "Start dev server"

    IF %ERRORLEVEL% EQU 1 (
      echo.
      echo Starting development server...
      start cmd /k npm run dev
      
      echo.
      echo Development server started in a new window.
      echo.
      echo Follow these steps to verify the fix:
      echo 1. Log in as an admin user
      echo 2. Go to the admin section and update recommendations for risk levels
      echo 3. Go to the doctor questionnaire page
      echo 4. Click 'Risk Assessment' for a patient
      echo 5. You should now see the recommendations directly in the risk assessment panel
    )
  )
)

echo.
echo ================================================================================
echo TROUBLESHOOTING TIPS
echo ================================================================================
echo.
echo If you still don't see recommendations:
echo 1. Check browser console logs for detailed matching information
echo 2. Verify that the risk levels in admin exactly match the patient risk levels
echo 3. Try creating a new risk assessment with a clear risk level
echo.
pause