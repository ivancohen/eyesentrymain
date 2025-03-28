@echo off
echo ================================================================================
echo FIXING RISK ASSESSMENT RECOMMENDATIONS DISPLAY
echo ================================================================================

set QUESTIONNAIRES_PATH=src\pages\Questionnaires.tsx
set BACKUP_PATH=src\pages\Questionnaires.tsx.recommendations-backup

echo Creating backup...
copy "%QUESTIONNAIRES_PATH%" "%BACKUP_PATH%"
echo ✅ Backup created: %BACKUP_PATH%

echo.
echo Fixing risk assessment recommendations display...

rem Create a temporary file with the fixes
echo // TEMPORARY FILE FOR QUESTIONNAIRES.TSX EDITS > temp_questionnaires_fixes.txt
echo // Find and replace these sections manually: >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo 1. REPLACE THIS CODE: >> temp_questionnaires_fixes.txt
echo -------------------------- >> temp_questionnaires_fixes.txt
echo // Get advice using the service >> temp_questionnaires_fixes.txt
echo const adviceList = await riskAssessmentService.getAdvice(); >> temp_questionnaires_fixes.txt
echo const advice = adviceList.find(a =^> a.risk_level === data.risk_level)?.advice ^|^| >> temp_questionnaires_fixes.txt
echo   "No specific recommendations available at this time."; >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo WITH THIS CODE: >> temp_questionnaires_fixes.txt
echo -------------------------- >> temp_questionnaires_fixes.txt
echo // Get advice using the service with better fallback >> temp_questionnaires_fixes.txt
echo const adviceList = await riskAssessmentService.getAdvice(); >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo // More robust matching logic - try exact match first, then case-insensitive >> temp_questionnaires_fixes.txt
echo let matchedAdvice = adviceList.find(a =^> a.risk_level === data.risk_level); >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo // If no match, try case-insensitive matching >> temp_questionnaires_fixes.txt
echo if (!matchedAdvice ^&^& data.risk_level) { >> temp_questionnaires_fixes.txt
echo   matchedAdvice = adviceList.find(a =^> >> temp_questionnaires_fixes.txt
echo     a.risk_level.toLowerCase() === data.risk_level.toLowerCase() >> temp_questionnaires_fixes.txt
echo   ); >> temp_questionnaires_fixes.txt
echo } >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo // Try score-based matching as last resort >> temp_questionnaires_fixes.txt
echo if (!matchedAdvice ^&^& typeof data.total_score === 'number') { >> temp_questionnaires_fixes.txt
echo   matchedAdvice = adviceList.find(a =^> >> temp_questionnaires_fixes.txt
echo     data.total_score ^>= a.min_score ^&^& data.total_score ^<= a.max_score >> temp_questionnaires_fixes.txt
echo   ); >> temp_questionnaires_fixes.txt
echo } >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo // Use matched advice or fallback to a clear message >> temp_questionnaires_fixes.txt
echo const advice = matchedAdvice?.advice ^|^| >> temp_questionnaires_fixes.txt
echo   "No specific recommendations available at this time. Please consult with a specialist for personalized guidance."; >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo 2. REPLACE THIS CODE: >> temp_questionnaires_fixes.txt
echo -------------------------- >> temp_questionnaires_fixes.txt
echo riskLevel: data.risk_level, >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo WITH THIS CODE: >> temp_questionnaires_fixes.txt
echo -------------------------- >> temp_questionnaires_fixes.txt
echo riskLevel: data.risk_level ^|^| >> temp_questionnaires_fixes.txt
echo   (data.total_score ^<= 2 ? 'Low' : >> temp_questionnaires_fixes.txt
echo    data.total_score ^<= 5 ? 'Moderate' : 'High'), >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt
echo 3. ENSURE ADVICE IS INCLUDED: >> temp_questionnaires_fixes.txt
echo -------------------------- >> temp_questionnaires_fixes.txt
echo Make sure the setRiskAssessment includes: >> temp_questionnaires_fixes.txt
echo advice: advice, >> temp_questionnaires_fixes.txt
echo. >> temp_questionnaires_fixes.txt

echo Instructions for manual edits have been saved to temp_questionnaires_fixes.txt
echo Please open this file and the Questionnaires.tsx file to make the required changes.

echo.
echo ================================================================================
echo SUMMARY OF NECESSARY CHANGES
echo ================================================================================
echo 1. Improve risk recommendation matching logic with fallbacks
echo 2. Add case-insensitive matching for risk levels
echo 3. Add score-based fallback for matching recommendations
echo 4. Ensure the advice is properly passed to the display component
echo.
echo After making these changes, rebuild and test the application to ensure
echo recommendations are properly displayed for doctors.
echo.
pause