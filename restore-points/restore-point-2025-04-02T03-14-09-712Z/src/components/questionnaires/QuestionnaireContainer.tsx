import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { Clipboard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuestionnaireForm from "@/components/questionnaires/QuestionnaireForm";
import QuestionnaireProgress from "@/components/questionnaires/QuestionnaireProgress";
import QuestionnaireNavigation from "@/components/questionnaires/QuestionnaireNavigation";
import QuestionnaireResults from "@/components/questionnaires/QuestionnaireResults";
import { validateQuestionnairePage } from "@/components/questionnaires/QuestionnaireValidation";
import { submitPatientQuestionnaire, getQuestionsWithTooltips, PatientQuestionnaireData, DBQuestion } from "@/services/PatientQuestionnaireService"; // Import DBQuestion type
// REMOVED: No longer using hardcoded questions
// import { MEDICAL_HISTORY_QUESTIONS, QuestionItem } from "@/constants/questionnaireConstants";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

// Define user type
interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

// REMOVED local DBQuestion interface - Use imported version


interface ContributingFactor {
  question: string;
  answer: string;
  score: number;
}

interface QuestionnaireResult {
  score: number;
  riskLevel: string;
  contributing_factors: ContributingFactor[];
  advice: string;
}

interface QuestionnaireContainerProps {
  user: User;
}

// Use specific types for answers
type AnswerValue = string | number | boolean | null | undefined;

// Define the order of page categories - Align with admin categories
const PAGE_CATEGORIES = ['patient_info', 'family_medication', 'clinical_measurements'];

// Mapping of parent question IDs to child question IDs for steroid questions
const parentToChildMap = {
  "879cd028-1b29-4529-9cdb-7adcaf44d553": "27b24dae-f107-431a-8422-bf49df018e1f", // ophthalmic -> which ophthalmic
  "631db108-0f4c-46ff-941e-c37f6856060c": "986f807c-bc31-4241-9ce3-6c6d3bbf09ad", // intravitreal -> which intravitreal
  "a43ecfbc-413f-4925-8908-f9fc0d35ea0f": "468969a4-0f2b-4a03-8cc1-b9f80efff559"  // systemic -> which systemic
};

// Helper function to get default answers based on fetched questions
const getDefaultAnswers = (questions: DBQuestion[]): Record<string, AnswerValue> => {
  const defaultAnswers: Record<string, AnswerValue> = {};
  questions.forEach(question => {
    // Default all select questions to undefined, text/number to empty string
    if (question.question_type === 'select') {
        defaultAnswers[question.id] = undefined;
    } else {
        defaultAnswers[question.id] = '';
    }
  });
  return defaultAnswers;
};


const QuestionnaireContainer = ({ user }: QuestionnaireContainerProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({}); // Initialize empty first
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<QuestionnaireResult | null>(null);
  const [allDbQuestions, setAllDbQuestions] = useState<DBQuestion[]>([]); // Store all fetched questions
  const [isLoading, setIsLoading] = useState(true);
  // Use predefined page category order
  const [pageCategories] = useState<string[]>(PAGE_CATEGORIES);

  // Determine current page category based on ordered list and current index
  const currentPageCategory = pageCategories[currentPage] || '';
  const totalPages = pageCategories.length;

  // Determine questions based on page category (DB-Driven Approach)
  const questionsForCurrentPage: DBQuestion[] = (() => {
      // Always use DB questions, filter and sort
      const dbQuestions = allDbQuestions
          .filter(q => q.page_category === currentPageCategory)
          .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
      console.log(`Using ${dbQuestions.length} DB questions for ${currentPageCategory} page.`);
      return dbQuestions;
  })();


  useEffect(() => {
    const fetchQuestionsAndSetup = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching questions...");
        const questionsData = await getQuestionsWithTooltips(); // Fetches UUID-validated and trimmed-tooltip questions
        console.log("Questions fetched successfully:", questionsData);

        const validQuestions = questionsData || [];
        setAllDbQuestions(validQuestions);

        // Initialize answers AFTER questions are fetched
        setAnswers(getDefaultAnswers(validQuestions));

        if (validQuestions.length === 0) {
          console.warn("No questions returned from the database");
          toast.warning("No active questions found. Please contact the administrator.");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionsAndSetup();
  }, []);

  // Log current page and the questions being rendered
  console.log(`DB-Driven - Page: ${currentPage}, Category: ${currentPageCategory}, Rendering ${questionsForCurrentPage.length} questions.`);
  // Add detailed log for medical history page
  if (currentPageCategory === 'medical_history') {
      console.log("Filtered questions for medical_history:", questionsForCurrentPage);
  }


  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    console.log(`DEBUG: handleAnswerChange - questionId: ${questionId}, value: ${value}`);
    
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
      console.log(`DEBUG: Clearing child question ${childId} because parent ${questionId} is not "yes"`);
    }
    
    setAnswers(newAnswers);

    if (validationError) {
      setValidationError(null);
    }
  };

  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next") {
      // Validate using the questions actually rendered on the current page
      console.log(`Validating page ${currentPage}:`, questionsForCurrentPage);

      // Pass the current page's questions for validation
      const { isValid, errorMessage } = validateQuestionnairePage(questionsForCurrentPage, answers);

      if (!isValid) {
        setValidationError(errorMessage);
        return;
      }

      // Prevent going beyond the last page
      if (currentPage < totalPages - 1) {
         setCurrentPage(prev => prev + 1);
      }
    } else {
      setValidationError(null);
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
  };

  const handleSubmit = async () => {
    // Validate the last page before submitting
    console.log(`Validating final page ${currentPage}:`, questionsForCurrentPage);
    const { isValid, errorMessage } = validateQuestionnairePage(questionsForCurrentPage, answers);

    if (!isValid) {
      setValidationError(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      // --- Mapping from known OLD string IDs to NEW UUIDs ---
      // Similar to RiskAssessmentService, needed for payload construction
      const uuidMap: Record<string, string | undefined> = {
        "firstName": allDbQuestions.find(q => q.question === "Patient First Name")?.id,
        "lastName": allDbQuestions.find(q => q.question === "Patient Last Name")?.id,
        "age": allDbQuestions.find(q => q.question === "Age")?.id,
        "race": allDbQuestions.find(q => q.question.toLowerCase().includes("race"))?.id, // Use includes for Race
        "familyGlaucoma": allDbQuestions.find(q => q.question.toLowerCase().includes("has anyone in your immediate family"))?.id, // Case-insensitive
        "ocularSteroid": allDbQuestions.find(q => q.question.toLowerCase().includes("ophthalmic topical steroids"))?.id, // Case-insensitive
        "steroidType": allDbQuestions.find(q => q.question === "Which ophthalmic topical steroid are you taking or have taken?")?.id,
        "intravitreal": allDbQuestions.find(q => q.question.toLowerCase().includes("intravitreal steroids"))?.id, // Case-insensitive
        "intravitralType": allDbQuestions.find(q => q.question === "Which intravitreal steroid are you taking or have taken?")?.id,
        "systemicSteroid": allDbQuestions.find(q => q.question.toLowerCase().includes("systemic steroids"))?.id, // Case-insensitive
        "systemicSteroidType": allDbQuestions.find(q => q.question === "Which systemic steroid are you taking or have taken?")?.id,
        "iopBaseline": allDbQuestions.find(q => q.question.includes("IOP Baseline"))?.id,
        "verticalAsymmetry": allDbQuestions.find(q => q.question.includes("ratio asymmetry"))?.id, // Correct text snippet
        "verticalRatio": allDbQuestions.find(q => q.question.includes("Vertical C:D ratio"))?.id,
      };
      // --- End Mapping ---

      // Construct payload using the mapping
      const questionnaireData = Object.entries(uuidMap).reduce((acc, [oldId, uuid]) => {
        if (uuid && answers[uuid] !== undefined) {
          const payloadKey = oldId as keyof PatientQuestionnaireData; // Map oldId to the payload key
          let value = answers[uuid];

          // Handle specific conversions more carefully
          if (payloadKey === 'familyGlaucoma') {
              // Make check case-insensitive for 'yes'
              value = String(value).toLowerCase() === 'yes' ? 'yes' : 'no'; // Defaulting to 'no' if not 'yes'
          } else if (['ocularSteroid', 'intravitreal', 'systemicSteroid'].includes(payloadKey as string)) {
              // Make check case-insensitive for steroids as well
              value = String(value).toLowerCase() === 'yes' ? 'yes' : String(value).toLowerCase() === 'no' ? 'no' : 'not_available';
          } else {
              // For other fields like race, pass the string value directly if it exists, otherwise empty string
              value = String(value ?? ''); // Use nullish coalescing
          }
          (acc as any)[payloadKey] = value;
        } else if (uuid) {
            // Handle cases where the answer might be intentionally empty or undefined but the key exists
            // Ensure required fields have a default in finalPayload if needed
            console.log(`UUID found for ${oldId} but no answer value present.`);
        }
        return acc;
      }, {} as Partial<PatientQuestionnaireData>);

      
            // --- DEBUG LOGGING ---
            console.log("DEBUG: Raw answers state (UUID keys):", answers);
            console.log("DEBUG: Mapped UUIDs (for reference):", uuidMap);
            // console.log("DEBUG: Intermediate questionnaireData before final defaults:", questionnaireData); // No longer creating this
            // --- END DEBUG LOGGING ---
      
            // Prepare the string-keyed data needed ONLY for direct DB column mapping (like booleans)
            const dataForDbMapping: PatientQuestionnaireData = {
                firstName: String(answers[uuidMap.firstName || ''] ?? ''),
                lastName: String(answers[uuidMap.lastName || ''] ?? ''),
                age: String(answers[uuidMap.age || ''] ?? ''),
                race: String(answers[uuidMap.race || ''] ?? ''),
                // Use case-insensitive check for boolean mapping
                familyGlaucoma: String(answers[uuidMap.familyGlaucoma || ''] ?? 'no').toLowerCase() === 'yes' ? 'yes' : 'no',
                ocularSteroid: String(answers[uuidMap.ocularSteroid || ''] ?? 'no').toLowerCase() === 'yes' ? 'yes' : 'no',
                steroidType: String(answers[uuidMap.steroidType || ''] ?? ''),
                intravitreal: String(answers[uuidMap.intravitreal || ''] ?? 'no').toLowerCase() === 'yes' ? 'yes' : 'no',
                intravitralType: String(answers[uuidMap.intravitralType || ''] ?? ''),
                systemicSteroid: String(answers[uuidMap.systemicSteroid || ''] ?? 'no').toLowerCase() === 'yes' ? 'yes' : 'no',
                systemicSteroidType: String(answers[uuidMap.systemicSteroidType || ''] ?? ''),
                iopBaseline: String(answers[uuidMap.iopBaseline || ''] ?? ''),
                verticalAsymmetry: String(answers[uuidMap.verticalAsymmetry || ''] ?? ''),
                verticalRatio: String(answers[uuidMap.verticalRatio || ''] ?? '')
                // Add any other direct fields needed by PatientQuestionnaireData interface
            };
            
            console.log("Submitting data for DB mapping:", dataForDbMapping);
            console.log("Submitting answers for scoring/JSON (UUID keys):", answers);
      
            // Convert answers to string values for the API
            const stringAnswers: Record<string, string> = {};
            Object.entries(answers).forEach(([key, value]) => {
                stringAnswers[key] = String(value ?? '');
            });
            
            // Pass the string-keyed data for DB mapping and the UUID-keyed answers for scoring/JSON storage
            const result = await submitPatientQuestionnaire(dataForDbMapping, stringAnswers);

      setResults({
        score: result.score,
        riskLevel: result.riskLevel,
        contributing_factors: result.contributing_factors || [],
        advice: result.advice || ""
      });

      toast.success("Questionnaire submitted successfully!");

      setIsCompleted(true);
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      toast.error("Failed to submit questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col questionnaire-bg">
      <Navbar />
      <main className="flex-1 container px-6 py-6 mx-auto" style={{ backgroundColor: "#EBF5FF" }}>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center justify-center gap-2" style={{ color: "#1E40AF" }}>
            <Clipboard size={20} />
            Risk Assessment Questionnaire
          </h1>
          <p className="text-muted-foreground animate-slide-up animation-delay-100" style={{ color: "#4B5563" }}>
            Complete the questionnaire to assess the patient's risk of developing glaucoma.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-3 text-lg questionnaire-text">Loading questions...</span>
            </div>
          ) : isCompleted && results ? (
            <QuestionnaireResults
              score={results.score}
              riskLevel={results.riskLevel}
              contributing_factors={results.contributing_factors}
              advice={results.advice}
              firstName={String(answers.firstName || '')} // Assuming ID matches key
              lastName={String(answers.lastName || '')}   // Assuming ID matches key
            />
          ) : (
            <>
              {validationError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <QuestionnaireProgress
                currentPage={currentPage}
                totalPages={totalPages} // Use totalPages based on DB categories
              />

              {/* Pass the correctly filtered DB questions for the current page */}
              <QuestionnaireForm
                currentPage={currentPage}
                onAnswerChange={handleAnswerChange}
                answers={answers}
                questions={questionsForCurrentPage} // Pass the filtered DB questions
              />


              <QuestionnaireNavigation
                currentPage={currentPage}
                totalPages={totalPages} // Use totalPages based on DB categories
                onPageChange={handlePageChange}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuestionnaireContainer;
