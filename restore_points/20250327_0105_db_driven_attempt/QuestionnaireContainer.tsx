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
import { submitPatientQuestionnaire, getQuestionsWithTooltips, PatientQuestionnaireData } from "@/services/PatientQuestionnaireService";
// Remove QUESTIONNAIRE_PAGES import - rely on DB categories
// import { QUESTIONNAIRE_PAGES, QuestionItem } from "@/constants/questionnaireConstants";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

// Define user type
interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

// Interface for DB Question data (ensure this matches service response)
interface DBQuestion {
  id: string;
  question: string;
  tooltip?: string;
  page_category: string; // Crucial for filtering
  question_type?: string;
  options?: Array<{
      option_value: string;
      option_text: string;
      score?: number;
  }>;
  display_order?: number;
  // Add conditional options structure if fetched from DB
  conditionalOptions?: {
      parentValue: string; // e.g., "parentQuestionId:requiredValue"
      // Options might be implicitly handled if parent controls visibility/options
  };
}


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

// Define the order of page categories
const PAGE_CATEGORIES = ['patient_info', 'medical_history', 'clinical_measurements'];

// Helper function to get default answers based on fetched questions
const getDefaultAnswers = (questions: DBQuestion[]): Record<string, AnswerValue> => {
  const defaultAnswers: Record<string, AnswerValue> = {};
  questions.forEach(question => {
    // Default all select questions to undefined, text to empty string
    if (question.question_type === 'select') {
        defaultAnswers[question.id] = undefined;
    } else { // Assumes text or number type
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
  const [pageCategories, setPageCategories] = useState<string[]>(PAGE_CATEGORIES); // Use defined order, potentially update from data

  // Determine current page category based on ordered list and current index
  const currentPageCategory = pageCategories[currentPage] || '';
  const totalPages = pageCategories.length;

  // Filter DB questions for the current page category and sort
  const questionsForCurrentPage = allDbQuestions
    .filter(q => q.page_category === currentPageCategory)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));


  useEffect(() => {
    const fetchQuestionsAndSetup = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching questions with tooltips...");
        const questionsData = await getQuestionsWithTooltips();
        console.log("Questions fetched successfully:", questionsData);

        const validQuestions = questionsData || [];
        setAllDbQuestions(validQuestions);

        // Dynamically determine page categories and order from data if needed,
        // or stick to predefined order. For now, stick to predefined.
        // const uniqueCategories = [...new Set(validQuestions.map(q => q.page_category))]
        //                             .sort((a, b) => PAGE_CATEGORIES.indexOf(a) - PAGE_CATEGORIES.indexOf(b));
        // setPageCategories(uniqueCategories.length > 0 ? uniqueCategories : PAGE_CATEGORIES);

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
  console.log(`Current page: ${currentPage}, Category: ${currentPageCategory}, Rendering ${questionsForCurrentPage.length} questions.`);


  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    if (validationError) {
      setValidationError(null);
    }
  };

  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next") {
      // Validate using the questions actually rendered on the current page
      console.log(`Validating page ${currentPage}:`, questionsForCurrentPage);

      // Pass all DB questions to validation if needed for cross-question rules
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
      // Construct data payload - ensure all expected fields are included
      // It might be safer to build this dynamically from allDbQuestions
      const questionnaireData: PatientQuestionnaireData = {
        firstName: String(answers.firstName || ''), // Assuming 'firstName' is an ID in allDbQuestions
        lastName: String(answers.lastName || ''),   // Assuming 'lastName' is an ID
        age: String(answers.age || ''),             // Assuming 'age' is an ID
        race: String(answers.race || ''),           // Assuming 'race' is an ID
        familyGlaucoma: String(answers.familyGlaucoma || 'no'),
        ocularSteroid: String(answers.ocularSteroid || 'no'),
        steroidType: answers.steroidType as string | undefined,
        intravitreal: String(answers.intravitreal || 'no'),
        intravitralType: answers.intravitralType as string | undefined,
        systemicSteroid: String(answers.systemicSteroid || 'no'),
        systemicSteroidType: answers.systemicSteroidType as string | undefined,
        iopBaseline: String(answers.iopBaseline || ''),
        verticalAsymmetry: String(answers.verticalAsymmetry || ''),
        verticalRatio: String(answers.verticalRatio || '')
        // Consider adding all other answers dynamically if needed by the service/DB
        // ...allDbQuestions.reduce((acc, q) => {
        //     if (answers[q.id] !== undefined && !['firstName', 'lastName', 'age', 'race', ...].includes(q.id)) {
        //         acc[q.id] = String(answers[q.id]);
        //     }
        //     return acc;
        // }, {} as Record<string, string>)
      };


      console.log("Submitting questionnaire data:", questionnaireData);

      const result = await submitPatientQuestionnaire(questionnaireData);

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
              firstName={String(answers.firstName || '')}
              lastName={String(answers.lastName || '')}
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