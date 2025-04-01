// Script to fix the risk assessment admin component pre-population issue
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function fixRiskAssessmentAdmin() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING RISK ASSESSMENT ADMIN PRE-POPULATION ISSUE");
    console.log("=".repeat(80));
    
    // Step 1: Fix the RiskAssessmentService.ts file
    console.log("\n1️⃣ Fixing RiskAssessmentService.ts...");
    
    const servicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
    
    // Create a backup of the current file
    const backupPath = path.join(__dirname, 'src', 'services', `RiskAssessmentService.ts.admin-fix-backup-${Date.now()}`);
    
    if (fs.existsSync(servicePath)) {
      fs.copyFileSync(servicePath, backupPath);
      console.log(`✅ Created backup at ${backupPath}`);
    } else {
      console.error("❌ RiskAssessmentService.ts not found");
      process.exit(1);
    }
    
    // Read the current content
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Fix 1: Modify the getAdvice method to better handle case sensitivity and normalize risk levels
    const updatedContent = content.replace(
      /async getAdvice\(\): Promise<RiskAssessmentAdvice\[\]> {[\s\S]*?if \(data && data\.length > 0\) {[\s\S]*?const normalizedData = data\.map\(item => \({[\s\S]*?}\)\);/,
      `async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // ALWAYS clear the cache to force fresh database fetch
      cachedAdvice = null;
      console.log("CLEARED ADVICE CACHE TO FORCE FRESH DATABASE FETCH");

      console.log("FETCHING FRESH ADVICE USING RPC FUNCTION");

      // Use direct table access instead of RPC
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*');

      // Debug what we got from the database - consistent with other services
      console.log("ADVICE RPC FUNCTION RESULT:", {
        error: error ? error.message : 'none',
        dataReceived: !!data,
        dataCount: data?.length || 0,
        dataItems: data?.map(a => ({
          id: a.id,
          level: a.risk_level,
          score_range: \`\${a.min_score}-\${a.max_score}\`,
          advice: a.advice?.substring(0, 30) + '...'
        }))
      });

      if (error) {
        // Log detailed error information - consistent with other services
        console.error("Error fetching advice via RPC:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);

        // Use fallback but never cache it
        console.warn("CRITICAL: Using fallback advice due to RPC function error");
        return [...FALLBACK_ADVICE];
      }

      // If we got data from the database
      if (data && data.length > 0) {
        // Normalize the risk levels for case-insensitive matching
        const normalizedData = data.map(item => {
          // Determine the normalized risk level
          const normalizedRiskLevel = this.normalizeRiskLevel(item.risk_level);
          
          return {
            ...item,
            // Use our standard risk level normalization for consistency
            risk_level: normalizedRiskLevel,
            // Also keep normalized version for easier matching
            risk_level_normalized: item.risk_level?.toLowerCase() || '',
            // Ensure advice has a value
            advice: item.advice || "No specific advice available."
          };
        });`
    );
    
    // Fix 2: Modify the updateAdvice method to ensure proper risk level normalization
    const updatedContent2 = updatedContent.replace(
      /async updateAdvice\(advice: Partial<RiskAssessmentAdvice>\): Promise<RiskAssessmentAdvice> {[\s\S]*?const riskLevel = advice\.risk_level \|\| \(/,
      `async updateAdvice(advice: Partial<RiskAssessmentAdvice>): Promise<RiskAssessmentAdvice> {
    if (!advice.risk_level && (advice.min_score === undefined || advice.max_score === undefined)) {
      throw new Error('Risk level or score range is required to update advice.');
    }

    // ALWAYS clear the cache to force fresh database fetches
    console.log("CLEARING ALL CACHED ADVICE TO FORCE DATABASE FETCHES");
    cachedAdvice = null;

    // Determine risk level if not provided, or normalize the provided risk level
    const riskLevel = advice.risk_level ? this.normalizeRiskLevel(advice.risk_level) : (`
    );
    
    // Fix 3: Modify the upsert operation to handle risk level case sensitivity
    const updatedContent3 = updatedContent2.replace(
      /\.upsert\(completeAdvice, {[\s\S]*?onConflict: 'risk_level'/,
      `.upsert(completeAdvice, {
          onConflict: 'risk_level', // Tell Supabase to update if risk_level matches
          ignoreDuplicates: false // We want to update existing records`
    );
    
    // Write the updated content
    fs.writeFileSync(servicePath, updatedContent3);
    console.log("✅ Fixed RiskAssessmentService.ts");
    
    // Step 2: Fix the RiskAssessmentAdmin.tsx file
    console.log("\n2️⃣ Fixing RiskAssessmentAdmin.tsx...");
    
    const adminPath = path.join(__dirname, 'src', 'components', 'admin', 'RiskAssessmentAdmin.tsx');
    
    // Create a backup of the current file
    const adminBackupPath = path.join(__dirname, 'src', 'components', 'admin', `RiskAssessmentAdmin.tsx.backup-${Date.now()}`);
    
    if (fs.existsSync(adminPath)) {
      fs.copyFileSync(adminPath, adminBackupPath);
      console.log(`✅ Created backup at ${adminBackupPath}`);
    } else {
      console.error("❌ RiskAssessmentAdmin.tsx not found");
      process.exit(1);
    }
    
    // Read the current content
    const adminContent = fs.readFileSync(adminPath, 'utf8');
    
    // Fix 1: Improve the loadAdvice method to better handle risk level normalization
    const updatedAdminContent = adminContent.replace(
      /const loadAdvice = async \(\) => {[\s\S]*?setFormValues\(initialFormValues\);[\s\S]*?};/,
      `const loadAdvice = async () => {
    try {
      const advice = await riskAssessmentService.getAdvice();
      console.log("Loaded advice:", advice);
      setAdviceList(advice);
      
      // Initialize form values with current advice
      const initialFormValues: Record<string, RiskAssessmentAdvice> = {};
      
      // Initialize form values for all risk levels
      RISK_LEVELS.forEach(level => {
        // Case-insensitive matching for risk levels
        const existingAdvice = advice.find(a => 
          a.risk_level?.toLowerCase() === level.id.toLowerCase() ||
          a.risk_level_normalized === level.id.toLowerCase()
        );
        
        console.log(\`Risk level \${level.id}: \${existingAdvice ? 'Found' : 'Not found'}\`);
        
        initialFormValues[level.id] = existingAdvice || {
          min_score: 0,
          max_score: 0,
          advice: "",
          risk_level: level.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      console.log("Setting form values:", initialFormValues);
      setFormValues(initialFormValues);
    } catch (error) {
      console.error("Error loading advice:", error);
      toast.error("Failed to load risk assessment advice");
    }
  };`
    );
    
    // Fix 2: Improve the handleSave method to ensure proper risk level normalization
    const updatedAdminContent2 = updatedAdminContent.replace(
      /const handleSave = async \(\) => {[\s\S]*?setIsSaving\(false\);[\s\S]*?};/,
      `const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Convert form values to advice objects
      const adviceEntries = Object.entries(formValues).map(([level, values]) => ({
        id: values.id, // Include ID if it exists
        min_score: Number(values.min_score) || 0,
        max_score: Number(values.max_score) || 0,
        advice: values.advice || "",
        risk_level: level
      }));
      
      console.log("Saving advice entries:", adviceEntries);

      // Save each advice entry
      const results = await Promise.all(adviceEntries.map(advice => 
        riskAssessmentService.updateAdvice(advice)
      ));
      
      console.log("Save results:", results);

      toast.success('Risk assessment advice updated successfully');
      await loadAdvice(); // Reload the advice to show updated values
    } catch (error) {
      console.error('Error saving advice:', error);
      toast.error('Failed to update risk assessment advice');
    } finally {
      setIsSaving(false);
    }
  };`
    );
    
    // Write the updated content
    fs.writeFileSync(adminPath, updatedAdminContent2);
    console.log("✅ Fixed RiskAssessmentAdmin.tsx");
    
    console.log("\n=".repeat(80));
    console.log("🎉 RISK ASSESSMENT ADMIN FIX COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nThe risk assessment configuration should now properly pre-populate");
    console.log("and display the preview with the current values.");
    
  } catch (error) {
    console.error("\n❌ Error fixing risk assessment admin:", error);
    process.exit(1);
  }
}

// Run the function
fixRiskAssessmentAdmin()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });