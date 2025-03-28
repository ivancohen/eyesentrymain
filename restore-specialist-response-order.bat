@echo off
echo ===================================================
echo Restoring Specialist Response Order System
echo ===================================================
echo.

echo Applying database restore point...
cd supabase
npx supabase sql "SELECT restore_specialist_response_system();"

echo.
echo Done! The specialist response order system has been restored to its previous state.
echo.