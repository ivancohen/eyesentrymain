@echo off
echo ===================================================
echo Deploying Email Function to Supabase
echo ===================================================
echo.

echo Setting up Supabase Edge Function...
cd supabase
npx supabase functions deploy send-email --no-verify-jwt

echo.
echo Setting Resend API key as a secret...
npx supabase secrets set RESEND_API_KEY=%VITE_RESEND_API_KEY%

echo.
echo Done! The email function has been deployed to Supabase.
echo.
echo To test the function, you can use:
echo npx supabase functions serve send-email
echo.