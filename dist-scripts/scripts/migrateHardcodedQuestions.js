import { supabase } from '../lib/supabase';
import { QUESTIONNAIRE_PAGES } from '../constants/questionnaireConstants';
/**
 * Migrates hardcoded questions from questionnaireConstants.ts to the database
 * This script should be run once to ensure all hardcoded questions are represented in the database
 */
export async function migrateHardcodedQuestions() {
    console.log("Starting migration of hardcoded questions to database...");
    // Flatten all pages of questions into a single array
    const allHardcodedQuestions = QUESTIONNAIRE_PAGES.flatMap((page, pageIndex) => {
        // Map page index to category
        const category = pageIndex === 0 ? 'patient_info' :
            pageIndex === 1 ? 'medical_history' :
                'clinical_measurements';
        // Return questions with their category
        return page.map(q => ({
            ...q,
            page_category: category
        }));
    });
    console.log(`Found ${allHardcodedQuestions.length} hardcoded questions to migrate`);
    // Check existing questions in database to avoid duplicates
    const { data: existingQuestions, error: fetchError } = await supabase
        .from('questions')
        .select('id, question');
    if (fetchError) {
        console.error("Error fetching existing questions:", fetchError);
        return;
    }
    // Create a map of existing questions by ID for quick lookup
    const existingQuestionMap = new Map();
    existingQuestions?.forEach(q => {
        existingQuestionMap.set(q.id, q);
    });
    // Process each hardcoded question
    for (const question of allHardcodedQuestions) {
        const questionText = question.text;
        const questionId = question.id;
        const category = question.page_category;
        const questionType = question.type || 'select';
        const tooltip = question.tooltip || '';
        // Determine default risk score - 2 for known risk factors, 1 for others
        let riskScore = 1;
        if (['familyGlaucoma', 'ocularSteroid', 'intravitreal', 'systemicSteroid',
            'iopBaseline', 'verticalAsymmetry', 'verticalRatio'].includes(questionId)) {
            riskScore = 2;
        }
        if (existingQuestionMap.has(questionId)) {
            // Update existing question
            console.log(`Updating existing question: ${questionId} - ${questionText}`);
            const { error: updateError } = await supabase
                .from('questions')
                .update({
                question: questionText,
                tooltip: tooltip,
                question_type: questionType,
                page_category: category,
                risk_score: riskScore,
                // Don't overwrite created_by or created_at to preserve history
            })
                .eq('id', questionId);
            if (updateError) {
                console.error(`Error updating question ${questionId}:`, updateError);
            }
        }
        else {
            // Insert new question with the same ID
            console.log(`Inserting new question: ${questionId} - ${questionText}`);
            const { error: insertError } = await supabase
                .from('questions')
                .insert({
                id: questionId,
                question: questionText,
                tooltip: tooltip,
                question_type: questionType,
                page_category: category,
                risk_score: riskScore,
            });
            if (insertError) {
                console.error(`Error inserting question ${questionId}:`, insertError);
            }
        }
        // For dropdown questions, migrate their options as well
        if (question.options && question.options.length > 0) {
            console.log(`Migrating ${question.options.length} options for question ${questionId}`);
            // Delete existing options to avoid duplicates
            await supabase
                .from('question_options')
                .delete()
                .eq('question_id', questionId);
            // Insert new options
            for (const option of question.options) {
                // Determine score based on known scoring patterns
                let optionScore = 0;
                // Known scoring patterns from PatientQuestionnaireService.ts
                if ((questionId === 'familyGlaucoma' && option.value === 'yes') ||
                    (questionId === 'ocularSteroid' && option.value === 'yes') ||
                    (questionId === 'intravitreal' && option.value === 'yes') ||
                    (questionId === 'systemicSteroid' && option.value === 'yes') ||
                    (questionId === 'iopBaseline' && option.value === '22_and_above') ||
                    (questionId === 'verticalAsymmetry' && option.value === '0.2_and_above') ||
                    (questionId === 'verticalRatio' && option.value === '0.6_and_above') ||
                    (questionId === 'race' && (option.value === 'black' || option.value === 'hispanic'))) {
                    optionScore = 2;
                }
                await supabase
                    .from('question_options')
                    .insert({
                    question_id: questionId,
                    option_value: option.value,
                    option_text: option.label,
                    tooltip: option.tooltip || '',
                    score: optionScore
                });
            }
        }
    }
    console.log("Migration of hardcoded questions completed successfully");
}
// Run the migration when this script is executed directly (not imported)
// This allows the script to be imported and used programmatically
if (require.main === module) {
    migrateHardcodedQuestions()
        .then(() => {
        console.log("Migration script completed successfully");
        process.exit(0);
    })
        .catch(err => {
        console.error("Migration failed:", err);
        process.exit(1);
    });
}
