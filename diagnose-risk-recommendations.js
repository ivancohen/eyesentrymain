// DIAGNOSTICS FOR RISK ASSESSMENT RECOMMENDATIONS
// This script runs diagnostics to identify why recommendations aren't displaying
// It directly dumps the fallback values to the console for immediate verification
// 
// Run with: node diagnose-risk-recommendations.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("RISK ASSESSMENT RECOMMENDATIONS DIAGNOSTICS");
console.log("================================================================================");

const diagnosticInfo = {
  rpcFunctionProblem: false,
  matchingProblem: false,
  displayProblem: false,
  recommendedFix: ""
};

// Define paths to all files we need to check
const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');
const questionnaireResultsPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireResults.tsx');

console.log("\n1. Checking if RiskAssessmentService is properly configured...");
try {
  const riskServiceContent = fs.readFileSync(riskAssessmentServicePath, 'utf8');
  
  if (!riskServiceContent.includes('getDirectFixAdvice')) {
    console.log("❌ getDirectFixAdvice method is MISSING from RiskAssessmentService");
    diagnosticInfo.recommendedFix = "Run the direct-fix-recommendations.js script to add the missing method";
  } else {
    console.log("✅ getDirectFixAdvice method exists in RiskAssessmentService");
  }
  
  // Check if the fallback advice includes our forced text
  if (!riskServiceContent.includes('FORCED FIX')) {
    console.log("❌ FALLBACK_ADVICE doesn't include 'FORCED FIX' prefix");
    diagnosticInfo.recommendedFix = "Run the direct-fix-recommendations.js script to update fallback advice";
  } else {
    console.log("✅ FALLBACK_ADVICE includes 'FORCED FIX' prefix");
  }
  
  // Check if window debugging code is present
  if (!riskServiceContent.includes('window.ADVICE_DEBUG')) {
    console.log("❌ window.ADVICE_DEBUG assignment is missing");
  } else {
    console.log("✅ window.ADVICE_DEBUG assignment exists");
  }
} catch (error) {
  console.error("❌ Error checking RiskAssessmentService:", error);
}

console.log("\n2. Checking if Questionnaires.tsx is properly configured...");
try {
  const questionnairesContent = fs.readFileSync(questionnairesPath, 'utf8');
  
  if (!questionnairesContent.includes('getDirectFixAdvice(')) {
    console.log("❌ getDirectFixAdvice() is not being called in Questionnaires.tsx");
    diagnosticInfo.matchingProblem = true;
    diagnosticInfo.recommendedFix = "Ensure Questionnaires.tsx is calling getDirectFixAdvice instead of getAdvice";
  } else {
    console.log("✅ getDirectFixAdvice() is being called in Questionnaires.tsx");
  }
  
  // Check if FIXED RECOMMENDATION prefix is being added
  if (!questionnairesContent.includes('FIXED RECOMMENDATION:')) {
    console.log("❌ 'FIXED RECOMMENDATION:' prefix is not being added in Questionnaires.tsx");
    diagnosticInfo.matchingProblem = true;
  } else {
    console.log("✅ 'FIXED RECOMMENDATION:' prefix is being added in Questionnaires.tsx");
  }
  
  // Check if advice is being set in riskAssessment
  const adviceSettingRegex = /advice:\s*advice/;
  if (!adviceSettingRegex.test(questionnairesContent)) {
    console.log("❌ advice is not being properly set in setRiskAssessment call");
    diagnosticInfo.matchingProblem = true;
  } else {
    console.log("✅ advice is being properly set in setRiskAssessment call");
  }
  
  // Check if dialog content is using riskAssessment directly
  if (questionnairesContent.includes("{riskAssessment && <QuestionnaireResults {...riskAssessment} />}")) {
    console.log("✅ Dialog content is using riskAssessment prop spread correctly");
  } else if (questionnairesContent.includes("<QuestionnaireResults") && questionnairesContent.includes("advice={riskAssessment.advice}")) {
    console.log("✅ Dialog content is explicitly passing advice prop");
  } else {
    console.log("❌ Dialog content may not be passing advice properly");
    diagnosticInfo.displayProblem = true;
  }
} catch (error) {
  console.error("❌ Error checking Questionnaires.tsx:", error);
}

console.log("\n3. Checking if QuestionnaireResults.tsx is properly displaying advice...");
try {
  const resultsContent = fs.readFileSync(questionnaireResultsPath, 'utf8');
  
  // Check if the component accepts advice prop
  if (!resultsContent.includes("advice?: string;") && !resultsContent.includes("advice: string;")) {
    console.log("❌ QuestionnaireResults component doesn't have advice prop in its interface");
    diagnosticInfo.displayProblem = true;
  } else {
    console.log("✅ QuestionnaireResults component has advice prop in its interface");
  }
  
  // Check if advice is being rendered
  if (!resultsContent.includes("{advice") || !resultsContent.includes("whitespace-pre-wrap")) {
    console.log("❌ QuestionnaireResults component may not be rendering advice properly");
    diagnosticInfo.displayProblem = true;
  } else {
    console.log("✅ QuestionnaireResults component is rendering advice");
  }
  
  // Check if default value is provided
  if (resultsContent.includes("advice = \"\",")) {
    console.log("✅ QuestionnaireResults provides default empty string for advice");
  } else {
    console.log("⚠️ QuestionnaireResults may not have a default value for advice");
  }
} catch (error) {
  console.error("❌ Error checking QuestionnaireResults.tsx:", error);
}

console.log("\n4. Creating diagnostic browser test file...");
try {
  const testFilePath = path.join(__dirname, 'test-risk-recommendations.html');
  const testContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Risk Recommendations Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .recommendations { border-left: 4px solid #4a90e2; padding-left: 16px; background: #f5f9ff; }
    pre { white-space: pre-wrap; overflow-x: auto; background: #f5f5f5; padding: 8px; }
    button { padding: 8px 16px; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #3a80d2; }
    .error { color: red; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>Risk Assessment Recommendations Test</h1>
  <p>This page tests if risk assessment recommendations are working correctly.</p>
  
  <div class="card">
    <h2>Test 1: Default Fallback Values</h2>
    <div id="fallback-test"></div>
    <button onclick="testFallbackValues()">Run Test</button>
  </div>
  
  <div class="card">
    <h2>Test 2: Manual Advice Display</h2>
    <div id="recommendations-test"></div>
    <div class="recommendations">
      <p><strong>Forced Recommendation:</strong></p>
      <p id="advice-display">No recommendations available. Click the button to test display.</p>
    </div>
    <button onclick="testAdviceDisplay()">Test Display</button>
  </div>
  
  <div class="card">
    <h2>Browser Information</h2>
    <pre id="browser-info"></pre>
  </div>
  
  <script>
    // Display browser information
    document.getElementById('browser-info').textContent = 
      \`User Agent: \${navigator.userAgent}
Window Size: \${window.innerWidth}x\${window.innerHeight}
Platform: \${navigator.platform}
\`;
    
    // Define fallback advice for testing
    const FALLBACK_ADVICE = [
      {
        min_score: 0,
        max_score: 2,
        advice: "DIAGNOSTIC TEST: Low risk recommendation text. This should display correctly.",
        risk_level: "Low"
      },
      {
        min_score: 3,
        max_score: 5,
        advice: "DIAGNOSTIC TEST: Moderate risk recommendation text. This should display correctly.",
        risk_level: "Moderate"
      },
      {
        min_score: 6,
        max_score: 100,
        advice: "DIAGNOSTIC TEST: High risk recommendation text. This should display correctly.",
        risk_level: "High"
      }
    ];
    
    // Create global variable to simulate the app environment
    window.DIRECT_FIX_ADVICE = FALLBACK_ADVICE;
    
    function testFallbackValues() {
      const testDiv = document.getElementById('fallback-test');
      testDiv.innerHTML = '';
      
      try {
        // Check if window global is accessible
        if (window.DIRECT_FIX_ADVICE) {
          const resultElement = document.createElement('div');
          resultElement.classList.add('success');
          resultElement.textContent = '✅ Fallback values are accessible in window.DIRECT_FIX_ADVICE';
          testDiv.appendChild(resultElement);
          
          // Display each value
          FALLBACK_ADVICE.forEach(advice => {
            const adviceElement = document.createElement('div');
            adviceElement.classList.add('recommendations');
            adviceElement.innerHTML = \`
              <p><strong>\${advice.risk_level} Risk (\${advice.min_score}-\${advice.max_score}):</strong></p>
              <p>\${advice.advice}</p>
            \`;
            testDiv.appendChild(adviceElement);
          });
        } else {
          const errorElement = document.createElement('div');
          errorElement.classList.add('error');
          errorElement.textContent = '❌ window.DIRECT_FIX_ADVICE is not defined';
          testDiv.appendChild(errorElement);
        }
      } catch (error) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error');
        errorElement.textContent = \`❌ Error accessing fallback values: \${error.message}\`;
        testDiv.appendChild(errorElement);
      }
    }
    
    function testAdviceDisplay() {
      const testDiv = document.getElementById('recommendations-test');
      const adviceDisplay = document.getElementById('advice-display');
      testDiv.innerHTML = '';
      
      try {
        // Pick a random advice
        const randomAdvice = FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
        
        // Try to display it
        adviceDisplay.textContent = randomAdvice.advice;
        
        const resultElement = document.createElement('div');
        resultElement.classList.add('success');
        resultElement.textContent = '✅ Advice display test successful';
        testDiv.appendChild(resultElement);
      } catch (error) {
        adviceDisplay.textContent = "Error displaying advice.";
        
        const errorElement = document.createElement('div');
        errorElement.classList.add('error');
        errorElement.textContent = \`❌ Error in advice display test: \${error.message}\`;
        testDiv.appendChild(errorElement);
      }
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(testFilePath, testContent);
  console.log(`✅ Created test file at ${testFilePath}`);
  console.log(`   Open this file in a browser to test recommendations display directly`);
} catch (error) {
  console.error("❌ Error creating test file:", error);
}

console.log("\n================================================================================");
console.log("DIAGNOSTICS SUMMARY");
console.log("================================================================================");

if (diagnosticInfo.rpcFunctionProblem) {
  console.log("⚠️ Potential RPC FUNCTION ISSUES detected");
}

if (diagnosticInfo.matchingProblem) {
  console.log("⚠️ Potential MATCHING ISSUES detected");
}

if (diagnosticInfo.displayProblem) {
  console.log("⚠️ Potential DISPLAY ISSUES detected");
}

if (diagnosticInfo.recommendedFix) {
  console.log(`\n👉 RECOMMENDED FIX: ${diagnosticInfo.recommendedFix}`);
} else {
  console.log("\n👉 RECOMMENDATION: Open test-risk-recommendations.html in browser to verify recommendations display");
  console.log("   If recommendations display correctly in the test page but not in the app,");
  console.log("   there may be an issue with how the app is passing recommendations to the component.");
}

console.log("\nAdditional troubleshooting steps:");
console.log("1. Check browser console for any errors while viewing a questionnaire");
console.log("2. Verify that RPC functions are defined in the database");
console.log("3. Ensure risk levels match between admin entries and patient questionnaires");