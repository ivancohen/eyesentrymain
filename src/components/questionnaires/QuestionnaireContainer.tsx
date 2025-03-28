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
    // Create a new object explicitly to ensure React detects the change
    const newAnswers = {
      ...answers,
      [questionId]: value
    };
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
        "race": allDbQuestions.find(q => q.question === "Race")?.id,
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

          // Handle boolean-like conversions
          if (['familyGlaucoma', 'ocularSteroid', 'intravitreal', 'systemicSteroid'].includes(payloadKey as string)) { // Cast payloadKey to string
            value = value === 'yes' ? 'yes' : (value === 'no' ? 'no' : 'not_available');
          } else {
            value = String(value || ''); // Default to string for others
          }
          (acc as any)[payloadKey] = value;
        }
        return acc;
      }, {} as Partial<PatientQuestionnaireData>);

      // Ensure all required fields are present, provide defaults if necessary
      const finalPayload: PatientQuestionnaireData = {
          firstName: String(questionnaireData.firstName || ''),
          lastName: String(questionnaireData.lastName || ''),
          age: String(questionnaireData.age || ''),
          race: String(questionnaireData.race || ''),
          familyGlaucoma: String(questionnaireData.familyGlaucoma || 'no'),
          ocularSteroid: String(questionnaireData.ocularSteroid || 'no'),
          steroidType: questionnaireData.steroidType,
          intravitreal: String(questionnaireData.intravitreal || 'no'),
          intravitralType: questionnaireData.intravitralType,
          systemicSteroid: String(questionnaireData.systemicSteroid || 'no'),
          systemicSteroidType: questionnaireData.systemicSteroidType,
          iopBaseline: String(questionnaireData.iopBaseline || ''),
          verticalAsymmetry: String(questionnaireData.verticalAsymmetry || ''),
          verticalRatio: String(questionnaireData.verticalRatio || '')
      };


      console.log("Submitting questionnaire data (DB-Driven):", finalPayload);

      const result = await submitPatientQuestionnaire(finalPayload); // Reverted: Removed user.id

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <PageHeader
          title="Risk Assessment Questionnaire"
          icon={<Clipboard size={20} />}
          description="Complete the questionnaire to assess the patient's risk of developing glaucoma."
        />

        <div className="max-w-2xl mx-auto mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-3 text-lg">Loading questions...</span>
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
