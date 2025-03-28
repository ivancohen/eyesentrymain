// SYNC RECOMMENDATIONS FIX
// This script provides direct instructions for syncing admin recommendations
// to hardcoded database entries so they appear in doctor view
//
// Run with: node sync-recommendations-fix.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of current module in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("SYNC ADMIN RECOMMENDATIONS FIX");
console.log("================================================================================");

console.log("\nPROBLEM IDENTIFIED:");
console.log("  The system has hardcoded risk assessment recommendation entries in the database");
console.log("  but recommendations entered by admin don't update these hardcoded entries.");
console.log("\nSOLUTION:");
console.log("  This fix creates a database trigger that automatically syncs admin-entered");
console.log("  recommendations to the hardcoded entries so they appear in doctor view.");

// Load the SQL file
const sqlPath = path.join(__dirname, 'supabase', 'sync_admin_recommendations.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`\n❌ SQL file not found: ${sqlPath}`);
  process.exit(1);
}

console.log("\n================================================================================");
console.log("STEPS TO IMPLEMENT THE FIX:");
console.log("================================================================================");

console.log("\n1. Copy the following SQL:");
console.log("------------------------------------------------");
const sql = fs.readFileSync(sqlPath, 'utf8');
console.log(sql);
console.log("------------------------------------------------");

console.log("\n2. Go to your Supabase dashboard:");
console.log("   - Open project: https://app.supabase.com/projects");
console.log("   - Click on SQL Editor");
console.log("   - Paste the SQL above into a new query");
console.log("   - Click Run");

console.log("\n3. Verify the sync worked:");
console.log("   - Check the output of the query");
console.log("   - You should see a list of risk assessment advice entries");
console.log("   - The hardcoded entries should now have updated advice text");

console.log("\n================================================================================");
console.log("TESTING THE FIX:");
console.log("================================================================================");

console.log("\n1. Start the application:");
console.log("   npm run dev");

console.log("\n2. Go to the admin panel and enter recommendations for each risk level:");
console.log("   - Enter a distinctive recommendation for Low risk");
console.log("   - Enter a distinctive recommendation for Moderate risk");
console.log("   - Enter a distinctive recommendation for High risk");

console.log("\n3. View a patient questionnaire in doctor view");
console.log("   - Verify the recommendation matches what you entered in the admin panel");

console.log("\nIf it worked, you should see the admin-entered recommendation");
console.log("in the doctor view. The database trigger will ensure any future");
console.log("changes to recommendations automatically appear in both places.");

console.log("\n================================================================================");
console.log("MONITORING & TROUBLESHOOTING:");
console.log("================================================================================");

console.log("\nTo check if synchronization is working properly, run this SQL in Supabase:");
console.log(`
SELECT 
    risk_level,
    min_score,
    max_score,
    SUBSTRING(advice, 1, 50) || '...' AS advice_preview,
    updated_at
FROM 
    risk_assessment_advice
ORDER BY
    CASE 
        WHEN LOWER(risk_level) = 'low' THEN 1
        WHEN LOWER(risk_level) = 'moderate' THEN 2
        WHEN LOWER(risk_level) = 'high' THEN 3
        ELSE 4
    END;
`);

console.log("\nThis will show all risk assessment advice entries with their preview.");
console.log("The hardcoded entries (usually the first three) should match your admin-entered text.");

console.log("\n================================================================================");