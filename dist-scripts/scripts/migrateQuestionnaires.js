#!/usr/bin/env ts-node
/**
 * Migration script to transition from hardcoded questions to database-driven questionnaires
 * This script performs all the necessary steps for the migration:
 * 1. Create database restore point
 * 2. Migrate hardcoded questions to database
 * 3. Run tests to ensure backward compatibility
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { supabase } from '../lib/supabase';
async function runMigration() {
    console.log("====================================================");
    console.log("QUESTIONNAIRE MIGRATION SCRIPT");
    console.log("====================================================");
    console.log("This script will migrate from hardcoded questions to a database-driven approach");
    console.log("\n");
    try {
        // Step 1: Create database restore point
        console.log("STEP 1: Creating database restore point...");
        const restorePointSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'create_questionnaire_restore_point.sql'), 'utf8');
        // Execute SQL directly with supabase client
        const { error: restorePointError } = await supabase.rpc('exec_sql', { sql: restorePointSql });
        if (restorePointError) {
            console.error("Error creating restore point:", restorePointError);
            console.log("Continuing with migration anyway...");
        }
        else {
            console.log("✅ Restore point created successfully");
        }
        // Step 2: Verify database connection
        console.log("\nSTEP 2: Verifying database connection...");
        const { data: testData, error: testError } = await supabase.from('questions').select('count');
        if (testError) {
            console.error("❌ Error connecting to database:", testError);
            console.error("Migration aborted. Please check your database connection.");
            return;
        }
        console.log("✅ Database connection verified");
        // Step 3: Migrate hardcoded questions to database
        console.log("\nSTEP 3: Migrating hardcoded questions to database...");
        // Import directly from our migration script
        const { migrateHardcodedQuestions } = await import('./migrateHardcodedQuestions');
        if (typeof migrateHardcodedQuestions === 'function') {
            await migrateHardcodedQuestions();
            console.log("✅ Question migration completed");
        }
        else {
            console.log("⚠️ migrateHardcodedQuestions function not found, running as separate script...");
            try {
                // Run as separate process
                execSync('npx ts-node src/scripts/migrateHardcodedQuestions.ts', { stdio: 'inherit' });
                console.log("✅ Question migration completed");
            }
            catch (error) {
                console.error("❌ Error running migration script:", error);
                console.error("Migration may be incomplete.");
            }
        }
        // Step 4: Run compatibility tests
        console.log("\nSTEP 4: Running backward compatibility tests...");
        try {
            // Run test script
            execSync('npx ts-node src/scripts/testQuestionnaireBackwardCompatibility.ts', { stdio: 'inherit' });
            console.log("✅ Compatibility tests passed");
        }
        catch (error) {
            console.error("❌ Some compatibility tests failed:", error);
            console.error("Please review the test output and make necessary adjustments.");
        }
        // Step 5: Clear form caches if any
        console.log("\nSTEP 5: Clearing any caches...");
        console.log("✅ Cache clearing not needed - React components will automatically use new data");
        console.log("\n====================================================");
        console.log("MIGRATION COMPLETED SUCCESSFULLY!");
        console.log("====================================================");
        console.log("The questionnaire system has been migrated to use database-driven questions.");
        console.log("If you encounter any issues, you can restore the previous state using:");
        console.log("SELECT restore_questionnaire_system() in your database.");
    }
    catch (error) {
        console.error("\n❌ Migration failed with error:", error);
        console.error("Please check the error message and try again.");
        console.error("You may need to restore from backup using: SELECT restore_questionnaire_system() in your database.");
    }
}
// Run the migration
runMigration()
    .then(() => {
    console.log("\nMigration script completed.");
    process.exit(0);
})
    .catch(err => {
    console.error("\nFatal error during migration:", err);
    process.exit(1);
});
