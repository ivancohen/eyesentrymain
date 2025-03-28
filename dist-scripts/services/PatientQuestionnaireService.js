import { supabase } from "@/lib/supabase";
/**
 * Calculates the risk score and level based on patient data and dynamic questions.
 * Fetches necessary question and option data from Supabase.
 */
export async function calculateRiskScore(data) {
    console.log("Calculating risk score for data:", data);
    // --- Fetch necessary data from Supabase ---
    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question');
    if (questionsError) {
        console.error("Error fetching questions:", questionsError);
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }
    if (!questions) {
        throw new Error("No questions data returned from Supabase.");
    }
    const { data: options, error: optionsError } = await supabase
        .from('dropdown_options')
        .select('question_id, option_value, score');
    if (optionsError) {
        console.error("Error fetching dropdown options:", optionsError);
        throw new Error(`Failed to fetch dropdown options: ${optionsError.message}`);
    }
    if (!options) {
        throw new Error("No dropdown options data returned from Supabase.");
    }
    // --- Calculate Base Scores ---
    const ageScore = 0; // Age score is always 0
    let raceScore = 0;
    if (data.race === "black" || data.race === "hispanic") {
        raceScore = 2;
    }
    const baseRiskFactorScores = [
        data.familyGlaucoma === "yes" ? 2 : 0,
        data.ocularSteroid === "yes" ? 2 : 0,
        data.intravitreal === "yes" ? 2 : 0,
        data.systemicSteroid === "yes" ? 2 : 0,
        data.iopBaseline === "22_and_above" ? 2 : 0,
        data.verticalAsymmetry === "0.2_and_above" ? 2 : 0,
        data.verticalRatio === "0.6_and_above" ? 2 : 0
    ];
    const baseRiskFactorsScore = baseRiskFactorScores.reduce((total, score) => total + score, 0);
    // --- Calculate Dynamic Scores and Prepare Metadata ---
    const questionAnswers = {};
    const dynamicScores = [];
    const additionalFactors = [];
    const metadata = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined)
            continue;
        const question = questions.find(q => q.id === key);
        if (question) {
            questionAnswers[key] = value;
            metadata[key] = value; // Add dynamic question answers to metadata
            const option = options.find(o => o.question_id === key && o.option_value === value);
            if (option && option.score != null) { // Check score is not null or undefined
                const scoreValue = option.score;
                dynamicScores.push(scoreValue);
                if (scoreValue > 0) {
                    additionalFactors.push({
                        question: question.question,
                        answer: value,
                        score: scoreValue
                    });
                }
                console.log(`Adding score ${scoreValue} for question ${question.question} with answer ${value}`);
            }
        }
    }
    const dynamicScore = dynamicScores.reduce((total, score) => total + score, 0);
    // --- Calculate Total Score and Risk Level ---
    const totalScore = baseRiskFactorsScore + ageScore + raceScore + dynamicScore;
    let riskLevel = "Low";
    if (totalScore >= 4) {
        riskLevel = "High";
    }
    else if (totalScore >= 2) {
        riskLevel = "Moderate";
    }
    // --- Prepare Base Factors for Result ---
    const baseFactors = [
        { question: "Race", answer: data.race, score: raceScore },
        { question: "Family History of Glaucoma", answer: data.familyGlaucoma, score: baseRiskFactorScores[0] },
        { question: "Ocular Steroid Use", answer: data.ocularSteroid, score: baseRiskFactorScores[1] },
        { question: "Intravitreal Steroid Use", answer: data.intravitreal, score: baseRiskFactorScores[2] },
        { question: "Systemic Steroid Use", answer: data.systemicSteroid, score: baseRiskFactorScores[3] },
        { question: "IOP Baseline", answer: data.iopBaseline, score: baseRiskFactorScores[4] },
        { question: "Vertical Asymmetry", answer: data.verticalAsymmetry, score: baseRiskFactorScores[5] },
        { question: "Vertical Ratio", answer: data.verticalRatio, score: baseRiskFactorScores[6] }
    ].filter(factor => factor.score > 0);
    console.log("Score breakdown:", {
        baseRiskFactorsScore,
        ageScore,
        raceScore,
        dynamicScore,
        totalScore
    });
    return {
        totalScore,
        riskLevel,
        baseFactors,
        additionalFactors,
        metadata // Return metadata containing dynamic answers
    };
}
export async function submitPatientQuestionnaire(data) {
    try {
        console.log("Processing questionnaire data for submission:", data);
        // Calculate score, risk level, factors, and metadata using the dedicated function
        const { totalScore, riskLevel, baseFactors, additionalFactors, metadata } = await calculateRiskScore(data);
        // Combine base and additional factors for the contributing_factors list
        const contributing_factors = [...baseFactors, ...additionalFactors];
        // Get advice based on risk level
        const { data: adviceData, error: adviceError } = await supabase
            .from('risk_assessment_advice')
            .select('advice')
            .eq('risk_level', riskLevel)
            .single();
        if (adviceError) {
            console.warn("Could not fetch risk assessment advice:", adviceError.message);
            // Continue submission even if advice fetching fails
        }
        console.log("Submitting questionnaire with RPC function");
        console.log("Risk level:", riskLevel, "Total score:", totalScore);
        console.log("Metadata to be saved:", metadata);
        console.log("Patient name data:", { firstName: data.firstName, lastName: data.lastName });
        // Use the RPC function to insert a questionnaire
        const { data: newId, error: rpcError } = await supabase
            .rpc('insert_patient_questionnaire', {
            first_name: data.firstName,
            last_name: data.lastName,
            age: data.age,
            race: data.race,
            family_glaucoma: data.familyGlaucoma === "yes",
            ocular_steroid: data.ocularSteroid === "yes",
            steroid_type: data.steroidType || null,
            intravitreal: data.intravitreal === "yes",
            intravitreal_type: data.intravitreal_type || null,
            systemic_steroid: data.systemicSteroid === "yes",
            systemic_steroid_type: data.systemicSteroidType || null,
            iop_baseline: data.iopBaseline === "22_and_above",
            vertical_asymmetry: data.verticalAsymmetry === "0.2_and_above",
            vertical_ratio: data.verticalRatio === "0.6_and_above",
            total_score: totalScore,
            risk_level: riskLevel,
            metadata: metadata // Pass the collected metadata
        });
        if (rpcError) {
            console.error("Error from RPC call 'insert_patient_questionnaire':", rpcError);
            throw rpcError;
        }
        if (newId) {
            console.log("Questionnaire created with ID:", newId);
            console.log("All data including metadata saved successfully");
            return {
                success: true,
                score: totalScore,
                riskLevel,
                contributing_factors,
                advice: adviceData?.advice || ""
            };
        }
        else {
            throw new Error("Failed to create questionnaire. No ID returned from RPC.");
        }
    }
    catch (error) {
        console.error("Failed to submit questionnaire:", error);
        // Consider re-throwing a more specific error or handling it
        if (error instanceof Error) {
            throw new Error(`Questionnaire submission failed: ${error.message}`);
        }
        else {
            throw new Error("An unknown error occurred during questionnaire submission.");
        }
    }
}
export async function getUserQuestionnaires() {
    try {
        // Get the current authenticated user directly from auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error("Error getting user or user not authenticated:", userError);
            throw new Error("User not authenticated");
        }
        // Use our new database function to avoid infinite recursion
        const { data, error } = await supabase
            .rpc('get_patient_questionnaires_for_user', { user_id_param: user.id });
        if (error) {
            console.error("Error fetching questionnaires via RPC:", error);
            throw error;
        }
        return data;
    }
    catch (error) {
        console.error("Error in getUserQuestionnaires:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}
export async function getQuestionnaireById(id) {
    try {
        // Get current authenticated user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error("Error getting user or user not authenticated:", userError);
            throw new Error("User not authenticated");
        }
        const userId = userData.user.id;
        // Use RPC function to fetch questionnaires for the user
        const { data: userQuestionnaires, error: rpcError } = await supabase
            .rpc('get_patient_questionnaires_for_user', { user_id_param: userId });
        if (rpcError) {
            console.error("Error fetching questionnaire via RPC 'get_patient_questionnaires_for_user':", rpcError);
            throw rpcError;
        }
        // Find the specific questionnaire by ID
        const questionnaireData = userQuestionnaires?.find(q => q.id === id);
        if (!questionnaireData) {
            throw new Error("Questionnaire not found or access denied");
        }
        // Merge metadata answers with main fields for a complete answer set
        const metadataObject = typeof questionnaireData.metadata === 'object' && questionnaireData.metadata !== null
            ? questionnaireData.metadata
            : {};
        // Explicitly define the type for completeData
        const completeData = {
            ...questionnaireData, // Spread main data fields first
            ...metadataObject, // Spread metadata, potentially overwriting if keys conflict (unlikely here)
        };
        // Optional: Remove metadata field if it's redundant after merge
        // delete completeData.metadata;
        console.log("Fetched and merged questionnaire data for edit:", completeData);
        return completeData;
    }
    catch (error) {
        console.error("Error fetching questionnaire by ID:", error);
        throw error; // Re-throw
    }
}
export async function updateQuestionnaire(id, data) {
    try {
        console.log(`Processing questionnaire data for update (ID: ${id}):`, data);
        // Calculate score, risk level, factors, and metadata using the dedicated function
        // Note: We recalculate score/risk based on potentially updated data
        const { totalScore, riskLevel, baseFactors, additionalFactors, metadata } = await calculateRiskScore(data);
        // Combine base and additional factors for the contributing_factors list
        const contributing_factors = [...baseFactors, ...additionalFactors];
        // Get advice based on risk level
        const { data: adviceData, error: adviceError } = await supabase
            .from('risk_assessment_advice')
            .select('advice')
            .eq('risk_level', riskLevel)
            .single();
        if (adviceError) {
            console.warn("Could not fetch risk assessment advice during update:", adviceError.message);
            // Continue update even if advice fetching fails
        }
        console.log("Updating questionnaire with RPC function, ID:", id);
        console.log("Risk level:", riskLevel, "Total score:", totalScore);
        console.log("Metadata to be saved:", metadata);
        // Use the RPC function to update the questionnaire
        const { data: updateResult, error: rpcError } = await supabase
            .rpc('update_patient_questionnaire', {
            questionnaire_id: id,
            first_name: data.firstName,
            last_name: data.lastName,
            age: data.age,
            race: data.race,
            family_glaucoma: data.familyGlaucoma === "yes",
            ocular_steroid: data.ocularSteroid === "yes",
            steroid_type: data.steroidType || null,
            intravitreal: data.intravitreal === "yes",
            intravitreal_type: data.intravitreal_type || null, // Corrected property name
            systemic_steroid: data.systemicSteroid === "yes",
            systemic_steroid_type: data.systemicSteroidType || null,
            iop_baseline: data.iopBaseline === "22_and_above",
            vertical_asymmetry: data.verticalAsymmetry === "0.2_and_above",
            vertical_ratio: data.verticalRatio === "0.6_and_above",
            total_score: totalScore,
            risk_level: riskLevel,
            metadata: metadata // Pass updated metadata
        });
        if (rpcError) {
            console.error("Error updating questionnaire via RPC 'update_patient_questionnaire':", rpcError);
            throw new Error(rpcError.message);
        }
        // The RPC function should ideally return a boolean or affected row count.
        // Assuming it returns true on success, false or null otherwise.
        // Adjust based on actual RPC function behavior.
        if (updateResult === false || updateResult === null) {
            // Consider if this should be an error or just a warning
            console.warn("Update RPC returned false/null. Questionnaire might not have been updated or user lacked permissions.");
            // Depending on requirements, you might throw an error here:
            // throw new Error("No questionnaire was updated. Ensure you have permission or the ID is correct.");
        }
        else {
            console.log(`Questionnaire ${id} updated successfully.`);
        }
        return {
            success: true, // Assuming success if no error thrown, adjust based on RPC result check
            score: totalScore,
            riskLevel,
            contributing_factors,
            advice: adviceData?.advice || ""
        };
    }
    catch (error) {
        console.error("Failed to update questionnaire:", error);
        if (error instanceof Error) {
            throw new Error(`Questionnaire update failed: ${error.message}`);
        }
        else {
            throw new Error("An unknown error occurred during questionnaire update.");
        }
    }
}
export async function getQuestionsWithTooltips() {
    try {
        console.log("Fetching active questions from database...");
        // Only fetch active questions
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('status', 'Active') // Only get active questions
            .order('page_category', { ascending: true })
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false }); // For questions with same display_order, get newest first
        if (error) {
            console.error("Error fetching questions:", error);
            throw error;
        }
        if (!data) {
            console.warn("No questions data returned, returning empty array.");
            return [];
        }
        // Deduplicate questions by text to avoid duplicates, preferring admin/newer
        const uniqueQuestionMap = {};
        data.forEach(q => {
            const key = q.question.trim();
            // Special handling for firstName and lastName to ensure they're text inputs
            if (key.includes("First Name") || key.includes("Last Name")) {
                q.question_type = "text";
            }
            const existing = uniqueQuestionMap[key];
            if (existing) {
                const existingIsAdmin = !!existing.created_by;
                const currentIsAdmin = !!q.created_by;
                const existingDate = new Date(existing.created_at || 0);
                const currentDate = new Date(q.created_at || 0);
                // Prefer admin over non-admin
                if (currentIsAdmin && !existingIsAdmin) {
                    uniqueQuestionMap[key] = q;
                }
                // If both admin or both not admin, prefer newer
                else if (currentIsAdmin === existingIsAdmin && currentDate > existingDate) {
                    uniqueQuestionMap[key] = q;
                }
                // Otherwise, keep the existing one
            }
            else {
                // First time seeing this question, add it
                uniqueQuestionMap[key] = q;
            }
        });
        const uniqueQuestions = Object.values(uniqueQuestionMap);
        // Re-sort after deduplication to ensure final order is correct
        uniqueQuestions.sort((a, b) => {
            // Sort by page_category
            const pageCompare = (a.page_category || '').localeCompare(b.page_category || '');
            if (pageCompare !== 0)
                return pageCompare;
            // Then by display_order
            const orderCompare = (a.display_order || 0) - (b.display_order || 0);
            if (orderCompare !== 0)
                return orderCompare;
            // Finally by created_at descending (newest first) for tie-breaking
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        console.log(`Fetched ${data.length} questions, returning ${uniqueQuestions.length} unique active questions after deduplication and sorting.`);
        return uniqueQuestions;
    }
    catch (error) {
        console.error("Error fetching questions with tooltips:", error);
        throw error; // Re-throw
    }
}
