@echo off
echo ===================================================
echo Updating Patient Names from Metadata
echo ===================================================
echo.

echo Applying fix to update patient names from metadata...
node update-patient-names.js

echo.
echo Done! Patient names have been updated from metadata.
echo.