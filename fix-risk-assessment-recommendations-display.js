// Script to fix risk assessment recommendations not showing up in patient pages
// Run with: node fix-risk-assessment-recommendations-display.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("================================================================================");
console.log("FIXING RISK ASSESSMENT RECOMMENDATIONS DISPLAY ISSUES");
console.log("================================================================================");

// Define the file paths relative to the current directory
const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const riskAssessmentPagePath = path.join(__dirname, 'src', 'app', 'risk-assessment', 'page.tsx');
const riskAssessmentAdminPath = path.join(__dirname, 'src', 'components', 'admin', 'RiskAssessmentAdmin.tsx');
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');

// Create backup files before making changes
console.log("\nCreating backups of files to be modified...");
[
  riskAssessmentServicePath,
  riskAssessmentPagePath,
  riskAssessmentAdminPath,
  questionnairesPath
].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  } else {
    console.error(`⚠️ File not found: ${filePath}`);
  }
});

// Fix 1: Update RiskAssessmentService to clear cache when calculating risk scores
console.log("\nUpdating RiskAssessmentService to clear cache when calculating risk scores...");
try {
  if (fs.existsSync(riskAssessmentServicePath)) {
    let content = fs.readFileSync(riskAssessmentServicePath, 'utf8');
    
    // Find the calculateRiskScore method and add cache clearing
    const calculateRiskScoreRegex = /async calculateRiskScore\(answers: Record<string, string>\): Promise<RiskAssessmentResult> {[\s\S]*?try {[\s\S]*?\/\/ Get configurations, advice, and all questions/;
    
    const updatedCalculateRiskScore = `async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    try {
      console.log("Calculating risk score for answers:", answers);
      
      // Clear the cache to ensure we get fresh advice
      cachedAdvice = null;
      
      // Get configurations, advice, and all questions`;
    
    content = content.replace(calculateRiskScoreRegex, updatedCalculateRiskScore);
    
    // Add debugging log after fetching advice
    const fetchedRiskConfigsRegex = /console\.log\("Fetched risk configs:", configs\.length\);/;
    const newLogging = `console.log("Fetched risk configs:", configs.length);
      console.log("Fetched fresh advice for risk calculation:", adviceList);`;
    
    content = content.replace(fetchedRiskConfigsRegex, newLogging);
    
    fs.writeFileSync(riskAssessmentServicePath, content);
    console.log(`✅ Updated RiskAssessmentService.ts to clear cache when calculating risk scores`);
  }
} catch (error) {
  console.error(`⚠️ Error updating RiskAssessmentService.ts:`, error);
}

// Fix 2: Update the risk-assessment page.tsx to properly handle types and force cache refresh
console.log("\nUpdating risk-assessment page to force cache refresh and fix type issues...");
try {
  if (fs.existsSync(riskAssessmentPagePath)) {
    let content = fs.readFileSync(riskAssessmentPagePath, 'utf8');
    
    // Update the useEffect to force cache refresh
    const useEffectRegex = /useEffect\(\(\) => {[\s\S]*?const calculateRisk = async \(\) => {[\s\S]*?try {[\s\S]*?const riskResult = await riskAssessmentService\.calculateRiskScore\(answers\);/;
    
    const updatedUseEffect = `useEffect(() => {
    const calculateRisk = async () => {
      try {
        // Force cache refresh before calculating to ensure we get the latest recommendations
        // @ts-ignore - Accessing private variable
        if (riskAssessmentService["cachedAdvice"]) {
          console.log("Forcing cache refresh for risk assessment");
          // @ts-ignore - Accessing private variable
          riskAssessmentService["cachedAdvice"] = null;
        }
        
        const riskResult = await riskAssessmentService.calculateRiskScore(answers);
        console.log("Calculated risk result with advice:", riskResult.advice);`;
    
    content = content.replace(useEffectRegex, updatedUseEffect);
    
    // Fix the type mismatches in the contributing factors display
    const questionTextRegex = /\{factor\.questionText\}/;
    content = content.replace(questionTextRegex, '{factor.question}');
    
    const selectedValueRegex = /\{factor\.selectedValue\}/;
    content = content.replace(selectedValueRegex, '{factor.answer}');
    
    // Enhance the recommendations display
    const adviceCardRegex = /<Card>[\s\S]*?<CardHeader>[\s\S]*?<CardTitle>Recommendations<\/CardTitle>[\s\S]*?<\/CardHeader>[\s\S]*?<CardContent>[\s\S]*?<div className="prose max-w-none">[\s\S]*?<p>\{result\.advice\}<\/p>[\s\S]*?<\/div>[\s\S]*?<\/CardContent>[\s\S]*?<\/Card>/;
    
    const enhancedAdviceCard = `<Card className="border-primary border-l-4">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose max-w-none">
            <h3 className="text-lg font-medium mb-4 text-primary">
              {result.risk_level} Risk Level Recommendations
            </h3>
            <div className="p-4 border rounded-md bg-primary/5 whitespace-pre-wrap">
              {result.advice || "No specific recommendations available at this time. Please consult with your doctor for personalized guidance."}
            </div>
          </div>
        </CardContent>
      </Card>`;
    
    content = content.replace(adviceCardRegex, enhancedAdviceCard);
    
    fs.writeFileSync(riskAssessmentPagePath, content);
    console.log(`✅ Updated risk-assessment page.tsx to fix type issues and enhance recommendations display`);
  }
} catch (error) {
  console.error(`⚠️ Error updating risk-assessment page.tsx:`, error);
}

// Fix 3: Update the Questionnaires.tsx file to ensure it always gets fresh advice
console.log("\nUpdating Questionnaires.tsx to ensure it always gets fresh advice...");
try {
  if (fs.existsSync(questionnairesPath)) {
    let content = fs.readFileSync(questionnairesPath, 'utf8');
    
    // Check if we've already applied the fix
    if (content.includes('riskAssessmentService["cachedAdvice"] = null;')) {
      console.log(`✅ Questionnaires.tsx already has the cache clearing code`);
    } else {
      // Add cache clearing before fetching advice
      const getAdviceRegex = /\/\/ Get advice using the service with better fallback\s*const adviceList = await riskAssessmentService\.getAdvice\(\);/;
      
      const updatedGetAdvice = `// Get advice using the service with better fallback
      // Clear the risk assessment service cache before fetching to ensure fresh data
      // @ts-ignore - Accessing the private cachedAdvice variable directly
      riskAssessmentService["cachedAdvice"] = null;
      
      // Now get advice using the service with better fallback - this will fetch fresh data
      const adviceList = await riskAssessmentService.getAdvice();
      console.log("Fetched fresh advice list:", adviceList);`;
      
      content = content.replace(getAdviceRegex, updatedGetAdvice);
      
      // Add logging for matched advice
      const matchedAdviceRegex = /\/\/ Use matched advice or fallback to a clear message/;
      const newMatchedAdviceLogging = `console.log("Matched advice:", matchedAdvice);
      
      // Use matched advice or fallback to a clear message`;
      
      content = content.replace(matchedAdviceRegex, newMatchedAdviceLogging);
      
      fs.writeFileSync(questionnairesPath, content);
      console.log(`✅ Updated Questionnaires.tsx to force fresh advice fetching`);
    }
  }
} catch (error) {
  console.error(`⚠️ Error updating Questionnaires.tsx:`, error);
}

console.log("\n================================================================================");
console.log("RISK ASSESSMENT RECOMMENDATIONS FIX COMPLETED");
console.log("================================================================================");

console.log("\nThe following changes were made to fix recommendations not showing up in patient pages:");
console.log("1. Updated RiskAssessmentService to clear cache when calculating risk scores");
console.log("2. Fixed the risk-assessment page to handle types correctly and force cache refresh");
console.log("3. Enhanced the recommendations display in the patient-facing risk assessment page");
console.log("4. Ensured Questionnaires.tsx always forces fresh advice fetching");
console.log("\nThese changes ensure that:");
console.log("- Recommendations made in admin pages are immediately reflected in patient pages");
console.log("- The cache is properly cleared at every step where recommendations are displayed");
console.log("- The patient-facing risk assessment page properly displays recommendations");
console.log("\nTo test these changes, please:");
console.log("1. Build the application (npm run build)");
console.log("2. Run the application (npm run dev)");
console.log("3. Make changes to recommendations in the admin panel");
console.log("4. View the risk assessment results in the patient-facing page to confirm the changes");