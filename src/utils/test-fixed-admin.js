// Test script for FixedAdminService.fetchQuestionScores
import { FixedAdminService } from "../services/FixedAdminService";

// Immediately invoked async function
(async () => {
  console.log("Testing FixedAdminService.fetchQuestionScores...");
  
  try {
    console.log("Calling fetchQuestionScores...");
    const questionScores = await FixedAdminService.fetchQuestionScores();
    
    console.log(`Fetched ${questionScores.length} question scores`);
    
    // Display the scores in a tabular format
    console.log("\nQUESTION SCORES:");
    console.log("----------------------------------------------------------------------");
    console.log("QUESTION | TYPE | OPTION | SCORE");
    console.log("----------------------------------------------------------------------");
    
    questionScores.forEach(score => {
      // Truncate long text for display
      const questionText = score.question.length > 30 
        ? score.question.substring(0, 27) + "..." 
        : score.question.padEnd(30);
      
      const optionText = score.option_text 
        ? (score.option_text.length > 15 
            ? score.option_text.substring(0, 12) + "..." 
            : score.option_text.padEnd(15))
        : "—".padEnd(15);
      
      console.log(
        `${questionText} | ${score.question_type.padEnd(10)} | ${optionText} | ${score.score}`
      );
    });
    
    console.log("----------------------------------------------------------------------");
    console.log("Test complete");
    
  } catch (error) {
    console.error("Error in test:", error);
  }
})();
