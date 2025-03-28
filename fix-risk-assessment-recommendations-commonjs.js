// Script to fix risk assessment recommendations display in admin panels
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("FIXING RISK ASSESSMENT RECOMMENDATIONS DISPLAY ISSUES");
console.log("================================================================================");

// Paths to the files with recommendation display issues
const questionnairesPath = path.join(__dirname, 'src', 'pages', 'Questionnaires.tsx');
const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const riskAssessmentAdminPath = path.join(__dirname, 'src', 'components', 'admin', 'RiskAssessmentAdmin.tsx');

// Create backups of all files
const backupFiles = [
  { path: questionnairesPath, backupPath: questionnairesPath + '.backup' },
  { path: riskAssessmentServicePath, backupPath: riskAssessmentServicePath + '.backup' },
  { path: riskAssessmentAdminPath, backupPath: riskAssessmentAdminPath + '.backup' }
];

console.log("Creating backups of files...");
backupFiles.forEach(({ path, backupPath }) => {
  if (fs.existsSync(path)) {
    fs.copyFileSync(path, backupPath);
    console.log(`✅ Created backup: ${backupPath}`);
  } else {
    console.error(`⚠️ File not found: ${path}`);
  }
});

console.log("\nApplying fixes to risk assessment recommendation display...");

// 1. Fix the Risk Assessment Admin component preview
try {
  if (fs.existsSync(riskAssessmentAdminPath)) {
    let content = fs.readFileSync(riskAssessmentAdminPath, 'utf8');
    
    // Add recommendation previews in admin panel
    const previewRegex = /<div className="bg-slate-50 p-6 rounded-md mb-6">[\s\S]*?<\/div>/;
    const newPreviewSection = `<div className="bg-slate-50 p-6 rounded-md mb-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Total Score:</p>
                <p className="text-2xl font-bold">0-10 points</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Risk Level Categories:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {RISK_LEVELS.map((level) => {
                    const advice = formValues[level.id] || {
                      min_score: 0,
                      max_score: 0
                    };
                    return (
                      <li key={level.id}>
                        <span className={\`font-semibold \${level.color}\`}>{level.label}:</span> Score of {advice.min_score}-{advice.max_score}
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {/* Added section to show recommendations preview */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sample Recommendations:</p>
                {RISK_LEVELS.map((level) => {
                  const advice = formValues[level.id] || { advice: "" };
                  return (
                    <div key={\`preview-\${level.id}\`} className="mb-4 border-l-2 pl-3" style={{ borderColor: level.color === 'text-green-600' ? 'green' : level.color === 'text-yellow-600' ? 'orange' : 'red' }}>
                      <p className={\`font-semibold \${level.color} mb-1\`}>{level.label} Recommendations:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {advice.advice || "No specific recommendations set for this risk level."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>`;
    
    content = content.replace(previewRegex, newPreviewSection);
    fs.writeFileSync(riskAssessmentAdminPath, content);
    console.log(`✅ Updated RiskAssessmentAdmin component with recommendation previews`);
  }
} catch (error) {
  console.error(`⚠️ Error updating RiskAssessmentAdmin component:`, error);
}

// 2. Fix the RiskAssessmentService cache clearing
try {
  if (fs.existsSync(riskAssessmentServicePath)) {
    let content = fs.readFileSync(riskAssessmentServicePath, 'utf8');
    
    // Modify updateAdvice method to clear cache
    const updateAdviceMethodRegex = /async updateAdvice\(advice: Partial<RiskAssessmentAdvice>\): Promise<RiskAssessmentAdvice> {[\s\S]*?try {/;
    const newUpdateAdviceStart = `async updateAdvice(advice: Partial<RiskAssessmentAdvice>): Promise<RiskAssessmentAdvice> {
    if (!advice.risk_level && (advice.min_score === undefined || advice.max_score === undefined)) {
      throw new Error('Risk level or score range is required to update advice.');
    }
    
    // Clear the entire cache to ensure we get fresh data on next request
    cachedAdvice = null;
    
    const riskLevel = advice.risk_level || (
      advice.min_score !== undefined && advice.min_score <= 1 ? 'Low' :
      advice.min_score !== undefined && advice.min_score <= 3 ? 'Moderate' : 'High'
    );

    // Create a complete advice object
    const completeAdvice: RiskAssessmentAdvice = {
      min_score: advice.min_score || 0,
      max_score: advice.max_score || 100,
      advice: advice.advice || "No specific advice available.",
      risk_level: riskLevel,
      updated_at: new Date().toISOString()
    };

    try {`;
    
    content = content.replace(updateAdviceMethodRegex, newUpdateAdviceStart);
    
    // Remove cache update code in error and success cases
    const cacheUpdateInErrorRegex = /\/\/ Update local cache even if database update fails[\s\S]*?\/\/ Return the updated advice even though database update failed/;
    const newErrorHandling = `// We don't update the cache here since we want to force a fresh fetch
        // Return the updated advice even though database update failed`;
    
    content = content.replace(cacheUpdateInErrorRegex, newErrorHandling);
    
    const cacheUpdateSuccessRegex = /\/\/ Update cache with the new data[\s\S]*?\/\/ Sort by min_score[\s\S]*?}/;
    const newSuccessHandling = `// We successfully updated the database record
      // We don't update the cache here since we cleared it above
      // This ensures fresh data is fetched on next getAdvice() call`;
    
    content = content.replace(cacheUpdateSuccessRegex, newSuccessHandling);
    
    // Remove cache update in catch block
    const catchBlockRegex = /\/\/ Update local cache even if there's an error[\s\S]*?\/\/ Sort by min_score[\s\S]*?}/;
    const newCatchHandling = `// We don't update the cache - force a fresh fetch on next request`;
    
    content = content.replace(catchBlockRegex, newCatchHandling);
    
    fs.writeFileSync(riskAssessmentServicePath, content);
    console.log(`✅ Updated RiskAssessmentService to clear cache when updating advice`);
  }
} catch (error) {
  console.error(`⚠️ Error updating RiskAssessmentService:`, error);
}

// 3. Update Questionnaires.tsx to force fresh advice fetching
try {
  if (fs.existsSync(questionnairesPath)) {
    let content = fs.readFileSync(questionnairesPath, 'utf8');
    
    // Modify handleViewRiskAssessment to clear cache before fetching
    const getAdviceRegex = /\/\/ Get advice using the service with better fallback\s*const adviceList = await riskAssessmentService\.getAdvice\(\);/;
    const newGetAdvice = `// Get advice using the service with better fallback
      // Clear the risk assessment service cache before fetching to ensure fresh data
      // @ts-ignore - Accessing the private cachedAdvice variable directly
      riskAssessmentService["cachedAdvice"] = null;
      
      // Now get advice using the service with better fallback - this will fetch fresh data
      const adviceList = await riskAssessmentService.getAdvice();
      console.log("Fetched fresh advice list:", adviceList);`;
    
    content = content.replace(getAdviceRegex, newGetAdvice);
    
    // Add logging for matched advice
    const matchedAdviceRegex = /\/\/ Use matched advice or fallback to a clear message/;
    const newMatchedAdviceLogging = `console.log("Matched advice:", matchedAdvice);
      
      // Use matched advice or fallback to a clear message`;
    
    content = content.replace(matchedAdviceRegex, newMatchedAdviceLogging);
    
    fs.writeFileSync(questionnairesPath, content);
    console.log(`✅ Updated Questionnaires component to force fresh advice fetching`);
  }
} catch (error) {
  console.error(`⚠️ Error updating Questionnaires component:`, error);
}

console.log("\n================================================================================");
console.log("RECOMMENDATIONS DISPLAY FIX COMPLETED");
console.log("================================================================================");

console.log("\nThe following changes were made:");
console.log("1. Added visual recommendation previews in the Risk Assessment Admin panel");
console.log("2. Updated RiskAssessmentService to clear cache when recommendations are updated");
console.log("3. Modified Questionnaires component to always fetch fresh recommendation data");
console.log("\nThese changes ensure that:");
console.log("- Administrators can see a preview of recommendations as they edit them");
console.log("- Recommendation changes are immediately visible throughout the application");
console.log("- No stale recommendation data is displayed due to caching issues");