// Script to completely fix risk assessment recommendations display
// Run with: node fix-recommendations-now.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("================================================================================");
console.log("COMPREHENSIVE FIX FOR RISK ASSESSMENT RECOMMENDATIONS DISPLAY");
console.log("================================================================================");

// Define the file paths relative to the current directory
const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const riskAssessmentPagePath = path.join(__dirname, 'src', 'app', 'risk-assessment', 'page.tsx');
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');
const questionnaireResultsPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireResults.tsx');

// Create backup files before making changes
console.log("\nCreating backups of files to be modified...");
[
  riskAssessmentServicePath,
  riskAssessmentPagePath,
  questionnairesPath,
  questionnaireResultsPath
].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  } else {
    console.error(`⚠️ File not found: ${filePath}`);
  }
});

// 1. Add better logging and aggressive cache clearing in RiskAssessmentService
console.log("\nEnhancing RiskAssessmentService with aggressive cache clearing...");
try {
  if (fs.existsSync(riskAssessmentServicePath)) {
    let content = fs.readFileSync(riskAssessmentServicePath, 'utf8');
    
    // Add better logging to getAdvice method
    let updatedContent = content.replace(
      /async getAdvice\(\): Promise<RiskAssessmentAdvice\[\]> {[\s\S]*?try {[\s\S]*?\/\/ Use cached advice if available[\s\S]*?if \(cachedAdvice\) {[\s\S]*?return cachedAdvice;[\s\S]*?}/,
      `async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // Use cached advice if available
      if (cachedAdvice) {
        console.log("USING CACHED ADVICE:", cachedAdvice);
        return cachedAdvice;
      }

      console.log("FETCHING FRESH ADVICE FROM DATABASE");`
    );
    
    // Add cache clearing in calculateRiskScore
    updatedContent = updatedContent.replace(
      /async calculateRiskScore\(answers: Record<string, string>\): Promise<RiskAssessmentResult> {[\s\S]*?try {[\s\S]*?console\.log\("Calculating risk score for answers:", answers\);/,
      `async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    try {
      console.log("Calculating risk score for answers:", answers);
      
      // Clear the cache to ensure we get fresh advice
      cachedAdvice = null;
      console.log("CLEARED CACHE BEFORE RISK CALCULATION");`
    );
    
    // Add better logging after fetching data
    updatedContent = updatedContent.replace(
      /console\.log\("Fetched risk configs:", configs\.length\);/,
      `console.log("Fetched risk configs:", configs.length);
      console.log("Fetched fresh advice for risk calculation:", adviceList);`
    );
    
    // Replace original content
    fs.writeFileSync(riskAssessmentServicePath, updatedContent);
    console.log(`✅ Enhanced RiskAssessmentService with aggressive cache clearing and better logging`);
  }
} catch (error) {
  console.error(`⚠️ Error updating RiskAssessmentService:`, error);
}

// 2. Update Questionnaires.tsx to add better logging and ensure fresh data fetching
console.log("\nUpdating Questionnaires.tsx with enhanced logging...");
try {
  if (fs.existsSync(questionnairesPath)) {
    let content = fs.readFileSync(questionnairesPath, 'utf8');
    
    // Add more logging in the handleViewRiskAssessment method
    let updatedContent = content.replace(
      /const handleViewRiskAssessment = async \(id: string\) => {/,
      `const handleViewRiskAssessment = async (id: string) => {
      console.log("VIEWING RISK ASSESSMENT FOR ID:", id);`
    );
    
    // Force cache clearing before fetching advice
    updatedContent = updatedContent.replace(
      /\/\/ Get advice using the service with better fallback[\s\S]*?const adviceList = await riskAssessmentService\.getAdvice\(\);/,
      `// Get advice using the service with better fallback
      // Force clearing all cached advice to ensure fresh data
      console.log("FORCIBLY CLEARING ALL CACHED ADVICE");
      // @ts-ignore - Accessing the private cachedAdvice variable directly
      riskAssessmentService["cachedAdvice"] = null;
      
      // Now get advice using the service with better fallback - this will fetch fresh data
      const adviceList = await riskAssessmentService.getAdvice();
      console.log("FETCHED FRESH ADVICE LIST:", adviceList);`
    );
    
    // Add more detailed logging about the matched advice
    updatedContent = updatedContent.replace(
      /\/\/ Use matched advice or fallback to a clear message[\s\S]*?const advice = matchedAdvice\?\.advice \|\|[\s\S]*?"[^"]*";/,
      `// Use matched advice or fallback to a clear message
      console.log("MATCHED ADVICE:", matchedAdvice);
      console.log("DATA RISK LEVEL:", data.risk_level);
      console.log("DATA TOTAL SCORE:", data.total_score);
      console.log("MATCHING AGAINST ADVICE LIST:", adviceList.map(a => ({ level: a.risk_level, score_range: \`\${a.min_score}-\${a.max_score}\`, snippet: a.advice.substring(0, 30) + '...' })));
      
      const advice = matchedAdvice?.advice ||
        "No specific recommendations available at this time. Please consult with a specialist for personalized guidance.";
      
      console.log("FINAL SELECTED ADVICE:", advice);`
    );
    
    // Replace original content
    fs.writeFileSync(questionnairesPath, updatedContent);
    console.log(`✅ Updated Questionnaires.tsx with enhanced logging and forced cache clearing`);
  }
} catch (error) {
  console.error(`⚠️ Error updating Questionnaires.tsx:`, error);
}

// 3. Enhance QuestionnaireResults.tsx to make recommendations more visible
console.log("\nEnhancing QuestionnaireResults.tsx to make recommendations more visible...");
try {
  if (fs.existsSync(questionnaireResultsPath)) {
    let content = fs.readFileSync(questionnaireResultsPath, 'utf8');
    
    // Update the Recommendations section to show recommendations directly
    const recommendationsSection = content.match(/{\s*\/\* Recommendations Dialog \*\/[\s\S]*?<\/Dialog>\s*<\/div>/);
    
    if (recommendationsSection) {
      const newRecommendationsSection = `{/* Recommendations Section - Directly visible */}
          <div className="mb-8 border rounded-md">
            <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Doctor Recommendations</h3>
            </div>
            <div className="p-4">
              <div className="mb-2 text-sm text-muted-foreground">
                Based on the <span className={getRiskColor(riskLevel)}>{riskLevel.toLowerCase()} risk</span> level:
              </div>
              <div className="border-l-4 border-primary pl-4 py-3 bg-primary/5 rounded-r-md">
                <p className="font-semibold mb-2">Doctor Recommendation:</p>
                <p className="text-sm whitespace-pre-wrap">
                  {advice || "No specific recommendations available at this time."}
                </p>
              </div>
              
              {/* Still keep the dialog for detailed view */}
              <div className="mt-4 text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="mr-2 h-4 w-4" />
                      Detailed View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Risk Assessment Recommendations</DialogTitle>
                      <DialogDescription>
                        Based on the {riskLevel.toLowerCase()} risk level, here are the recommended actions:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <p className="font-semibold mb-2">Doctor Recommendation:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {advice || "No specific recommendations available at this time."}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
                          <p>Risk Level: {riskLevel}</p>
                          <p>Total Score: {score}</p>
                          <p className="mt-1">ID: rec_{Math.random().toString(36).substring(2, 7)}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>`;
      
      content = content.replace(recommendationsSection[0], newRecommendationsSection);
      
      // Add debugging in constructor
      content = content.replace(
        /const QuestionnaireResults = \({/,
        `const QuestionnaireResults = ({`
      );
      
      content = content.replace(
        /}: QuestionnaireResultsProps\) => {/,
        `}: QuestionnaireResultsProps) => {
  console.log("RENDERING QUESTIONNAIRE RESULTS WITH:", { score, riskLevel, advice, contributing_factors });`
      );
      
      // Replace original content
      fs.writeFileSync(questionnaireResultsPath, content);
      console.log(`✅ Enhanced QuestionnaireResults.tsx to make recommendations more visible`);
    } else {
      console.error(`⚠️ Could not find Recommendations Dialog section in QuestionnaireResults.tsx`);
    }
  }
} catch (error) {
  console.error(`⚠️ Error updating QuestionnaireResults.tsx:`, error);
}

console.log("\n================================================================================");
console.log("FIX COMPLETED - HOW TO TEST YOUR RECOMMENDATIONS");
console.log("================================================================================");

console.log("\nTo see recommendations in action:");
console.log("1. Build and start the application: npm run build && npm run dev");
console.log("2. Log in as an admin user");
console.log("3. Go to the admin section and update recommendations for risk levels");
console.log("4. Go to the doctor questionnaire page");
console.log("5. Click 'Risk Assessment' for a patient");
console.log("6. You should now see the recommendations directly in the risk assessment panel");
console.log("\nIMPORTANT: The recommendations should match the risk level of the patient.");
console.log("If you still don't see the correct recommendations, check the console logs");
console.log("for detailed information about what's happening during the recommendation matching.");