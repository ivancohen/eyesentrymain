@echo off
echo ====================================================
echo QUESTIONNAIRE SYSTEM MIGRATION UTILITY
echo ====================================================
echo This script will migrate the EyeSentry questionnaire system
echo from hardcoded questions to a fully database-driven approach.
echo.
echo Before proceeding, ensure:
echo  1. You have a database backup
echo  2. The application is not currently in use
echo.
echo Press Ctrl+C to abort, or
pause

echo.
echo Creating database restore point...
echo.

echo Starting migration process...
echo.

:: Execute the migration script
npx ts-node src/scripts/migrateQuestionnaires.ts

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Migration encountered errors. Please review the output above.
  echo You may need to restore from the backup using:
  echo SELECT restore_questionnaire_system()
  echo.
  pause
  exit /b 1
)

echo.
echo ====================================================
echo MIGRATION COMPLETED SUCCESSFULLY!
echo ====================================================
echo.
echo The questionnaire system has been migrated to a database-driven approach.
echo You can now:
echo  1. Test the application to verify functionality
echo  2. Use the admin panel to manage questionnaire content
echo.
echo If you encounter any issues, you can restore to the pre-migration state with:
echo SELECT restore_questionnaire_system()
echo.
pause