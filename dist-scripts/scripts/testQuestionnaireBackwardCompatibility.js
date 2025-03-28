import { calculateRiskScore } from "../services/PatientQuestionnaireService";
// Sample test cases representing historical data
const testCases = [
    {
        name: "High Risk Patient",
        data: {
            firstName: "Test",
            lastName: "Patient",
            age: "61-70",
            race: "black",
            familyGlaucoma: "yes",
            ocularSteroid: "yes",
            steroidType: "prednisolone",
            intravitreal: "no",
            intravitralType: null,
            systemicSteroid: "no",
            systemicSteroidType: null,
            iopBaseline: "22_and_above",
            verticalAsymmetry: "0.2_and_above",
            verticalRatio: "0.6_and_above"
        },
        expectedRisk: "High",
        expectedScore: 10
    },
    {
        name: "Moderate Risk Patient",
        data: {
            firstName: "Test",
            lastName: "Patient",
            age: "51-60",
            race: "white",
            familyGlaucoma: "yes",
            ocularSteroid: "no",
            steroidType: null,
            intravitreal: "no",
            intravitralType: null,
            systemicSteroid: "no",
            systemicSteroidType: null,
            iopBaseline: "21_and_under",
            verticalAsymmetry: "under_0.2",
            verticalRatio: "below_0.6"
        },
        expectedRisk: "Moderate",
        expectedScore: 2
    },
    {
        name: "Low Risk Patient",
        data: {
            firstName: "Test",
            lastName: "Patient",
            age: "51-60",
            race: "white",
            familyGlaucoma: "no",
            ocularSteroid: "no",
            steroidType: null,
            intravitreal: "no",
            intravitralType: null,
            systemicSteroid: "no",
            systemicSteroidType: null,
            iopBaseline: "21_and_under",
            verticalAsymmetry: "under_0.2",
            verticalRatio: "below_0.6"
        },
        expectedRisk: "Low",
        expectedScore: 0
    },
    {
        name: "High Risk with Dynamic Question",
        data: {
            firstName: "Test",
            lastName: "Patient",
            age: "51-60",
            race: "white",
            familyGlaucoma: "yes",
            ocularSteroid: "yes",
            steroidType: "prednisolone",
            intravitreal: "no",
            intravitralType: null,
            systemicSteroid: "no",
            systemicSteroidType: null,
            iopBaseline: "21_and_under",
            verticalAsymmetry: "under_0.2",
            verticalRatio: "below_0.6",
            // Added dynamic question (test question)
            "a17b97e1-2f77-4a33-babe-8763c7bdd4ca": "yes"
        },
        expectedRisk: "High",
        expectedScore: 5 // 2 (family) + 2 (ocular) + 1 (test question)
    }
];
/**
 * Run backward compatibility tests for questionnaire risk assessment
 */
async function runCompatibilityTests() {
    console.log("Running backward compatibility tests for risk assessment");
    console.log("====================================================");
    let passedTests = 0;
    let failedTests = 0;
    for (const test of testCases) {
        try {
            console.log(`\nTesting case: ${test.name}`);
            // Calculate risk score
            const result = await calculateRiskScore(test.data);
            // Check if risk level matches
            const riskMatches = result.riskLevel === test.expectedRisk;
            // Check if score is within tolerance (1 point difference acceptable for rounding)
            const scoreMatches = Math.abs(result.totalScore - test.expectedScore) <= 1;
            if (riskMatches && scoreMatches) {
                console.log(`✅ Test passed: ${test.name}`);
                console.log(`   Expected: Risk=${test.expectedRisk}, Score=${test.expectedScore}`);
                console.log(`   Actual: Risk=${result.riskLevel}, Score=${result.totalScore}`);
                passedTests++;
            }
            else {
                console.error(`❌ Test failed: ${test.name}`);
                console.error(`   Expected: Risk=${test.expectedRisk}, Score=${test.expectedScore}`);
                console.error(`   Actual: Risk=${result.riskLevel}, Score=${result.totalScore}`);
                console.error(`   Difference: ${result.totalScore - test.expectedScore}`);
                console.error(`   Base factors:`, result.baseFactors);
                console.error(`   Additional factors:`, result.additionalFactors);
                failedTests++;
            }
        }
        catch (error) {
            console.error(`❌ Test error for ${test.name}:`, error);
            failedTests++;
        }
    }
    console.log("\n====================================================");
    console.log("Test Results Summary:");
    console.log(`Passed: ${passedTests}/${testCases.length}`);
    console.log(`Failed: ${failedTests}/${testCases.length}`);
    return {
        passed: passedTests,
        failed: failedTests,
        total: testCases.length
    };
}
// Make sure calculateRiskScore is exported correctly
if (typeof calculateRiskScore !== 'function') {
    console.error("Error: calculateRiskScore is not exported correctly from PatientQuestionnaireService");
    process.exit(1);
}
// Run the tests
runCompatibilityTests()
    .then(results => {
    if (results.failed > 0) {
        console.error("\n⚠️ Some compatibility tests failed. Please review the implementation.");
        process.exit(1);
    }
    else {
        console.log("\n✅ All compatibility tests passed!");
        process.exit(0);
    }
})
    .catch(err => {
    console.error("Test runner failed:", err);
    process.exit(1);
});
