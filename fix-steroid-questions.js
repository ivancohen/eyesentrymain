// Script to fix the steroid questions conditional logic
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main function
async function fixSteroidQuestions() {
  try {
    console.log("=".repeat(80));
    console.log("FIXING STEROID QUESTIONS CONDITIONAL LOGIC");
    console.log("=".repeat(80));
    
    // Step 1: Create a backup of the QuestionnaireContainer.tsx file
    console.log("\n1️⃣ Creating backup of QuestionnaireContainer.tsx...");
    
    const containerPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireContainer.tsx');
    const containerBackupPath = path.join(__dirname, 'src', 'components', 'questionnaires', `QuestionnaireContainer.tsx.steroid-fix-backup-${Date.now()}`);
    
    if (fs.existsSync(containerPath)) {
      fs.copyFileSync(containerPath, containerBackupPath);
      console.log(`✅ Created backup at ${containerBackupPath}`);
    } else {
      console.error("❌ QuestionnaireContainer.tsx not found");
      process.exit(1);
    }
    
    // Step 2: Create a backup of the QuestionnaireForm.tsx file
    console.log("\n2️⃣ Creating backup of QuestionnaireForm.tsx...");
    
    const formPath = path.join(__dirname, 'src', 'components', 'questionnaires', 'QuestionnaireForm.tsx');
    const formBackupPath = path.join(__dirname, 'src', 'components', 'questionnaires', `QuestionnaireForm.tsx.steroid-fix-backup-${Date.now()}`);
    
    if (fs.existsSync(formPath)) {
      fs.copyFileSync(formPath, formBackupPath);
      console.log(`✅ Created backup at ${formBackupPath}`);
    } else {
      console.error("❌ QuestionnaireForm.tsx not found");
      process.exit(1);
    }
    
    // Step 3: Modify the handleAnswerChange function in QuestionnaireContainer.tsx
    console.log("\n3️⃣ Modifying handleAnswerChange function in QuestionnaireContainer.tsx...");
    
    const containerContent = fs.readFileSync(containerPath, 'utf8');
    
    // Find the steroid parent question IDs
    const steroidParentIds = [
      "879cd028-1b29-4529-9cdb-7adcaf44d553", // ophthalmic topical steroids
      "631db108-0f4c-46ff-941e-c37f6856060c", // intravitreal steroids
      "a43ecfbc-413f-4925-8908-f9fc0d35ea0f"  // systemic steroids
    ];
    
    // Find the steroid child question IDs
    const steroidChildIds = [
      "27b24dae-f107-431a-8422-bf49df018e1f", // which ophthalmic topical steroid
      "986f807c-bc31-4241-9ce3-6c6d3bbf09ad", // which intravitreal steroid
      "468969a4-0f2b-4a03-8cc1-b9f80efff559"  // which systemic steroid
    ];
    
    // Create a mapping of parent to child IDs
    const parentToChildMap = {
      "879cd028-1b29-4529-9cdb-7adcaf44d553": "27b24dae-f107-431a-8422-bf49df018e1f",
      "631db108-0f4c-46ff-941e-c37f6856060c": "986f807c-bc31-4241-9ce3-6c6d3bbf09ad",
      "a43ecfbc-413f-4925-8908-f9fc0d35ea0f": "468969a4-0f2b-4a03-8cc1-b9f80efff559"
    };
    
    // Modify the handleAnswerChange function to clear child question answers when parent is not "yes"
    const updatedContainerContent = containerContent.replace(
      /const handleAnswerChange = \(questionId: string, value: AnswerValue\) => {[\s\S]*?if \(validationError\) {[\s\S]*?}/,
      `const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    console.log(\`DEBUG: handleAnswerChange - questionId: \${questionId}, value: \${value}\`);
    
    // Create a new object explicitly to ensure React detects the change
    const newAnswers = {
      ...answers,
      [questionId]: value
    };
    
    // Check if this is a steroid parent question
    const isParentQuestion = Object.keys(parentToChildMap).includes(questionId);
    
    // If it's a parent question and the value is not "yes", clear the child question answer
    if (isParentQuestion && String(value).toLowerCase() !== "yes") {
      const childId = parentToChildMap[questionId];
      newAnswers[childId] = ""; // Clear the child question answer
      console.log(\`DEBUG: Clearing child question \${childId} because parent \${questionId} is not "yes"\`);
    }
    
    setAnswers(newAnswers);

    if (validationError) {
      setValidationError(null);
    }
  };`
    );
    
    // Add the parentToChildMap definition at the top of the component
    const updatedContainerContent2 = updatedContainerContent.replace(
      /const PAGE_CATEGORIES = \['patient_info', 'family_medication', 'clinical_measurements'\];/,
      `const PAGE_CATEGORIES = ['patient_info', 'family_medication', 'clinical_measurements'];

// Mapping of parent question IDs to child question IDs for steroid questions
const parentToChildMap = {
  "879cd028-1b29-4529-9cdb-7adcaf44d553": "27b24dae-f107-431a-8422-bf49df018e1f", // ophthalmic -> which ophthalmic
  "631db108-0f4c-46ff-941e-c37f6856060c": "986f807c-bc31-4241-9ce3-6c6d3bbf09ad", // intravitreal -> which intravitreal
  "a43ecfbc-413f-4925-8908-f9fc0d35ea0f": "468969a4-0f2b-4a03-8cc1-b9f80efff559"  // systemic -> which systemic
};`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(containerPath, updatedContainerContent2);
    console.log("✅ Modified handleAnswerChange function in QuestionnaireContainer.tsx");
    
    // Step 4: Modify the QuestionnaireForm.tsx to improve the conditional logic
    console.log("\n4️⃣ Modifying QuestionnaireForm.tsx to improve conditional logic...");
    
    const formContent = fs.readFileSync(formPath, 'utf8');
    
    // Modify the isConditionalQuestionDisabled function to be more explicit about case-insensitive comparison
    const updatedFormContent = formContent.replace(
      /const isDisabled = String\(parentAnswer\) !== requiredValue;/,
      `const isDisabled = String(parentAnswer).toLowerCase() !== requiredValue.toLowerCase();`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(formPath, updatedFormContent);
    console.log("✅ Modified isConditionalQuestionDisabled function in QuestionnaireForm.tsx");
    
    console.log("\n=".repeat(80));
    console.log("🎉 FIX COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nThe steroid questions conditional logic has been fixed:");
    console.log("1. When changing a parent question from 'yes' to 'no', the child question answer is now cleared");
    console.log("2. The conditional logic now uses case-insensitive comparison for more reliable behavior");
    console.log("\nNext steps:");
    console.log("1. Restart your development server");
    console.log("2. Test the steroid questions to verify the fix");
    
  } catch (error) {
    console.error("\n❌ Error fixing steroid questions:", error);
    process.exit(1);
  }
}

// Run the function
fixSteroidQuestions()
  .then(() => {
    console.log("\nFix script completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("\nFatal error during fix:", err);
    process.exit(1);
  });