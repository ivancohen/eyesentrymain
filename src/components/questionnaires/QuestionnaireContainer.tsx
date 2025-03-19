import { useState } from "react";
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
import { submitPatientQuestionnaire } from "@/services/PatientQuestionnaireService";
import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";
import { toast } from "sonner";

// Define user type
interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface QuestionnaireContainerProps {
  user: User;
}

// Use specific types for answers
type AnswerValue = string | number | boolean | null;

const QuestionnaireContainer = ({ user }: QuestionnaireContainerProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<{ score: number; riskLevel: string } | null>(null);

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
      const currentQuestions = QUESTIONNAIRE_PAGES[currentPage] || [];
      const { isValid, errorMessage } = validateQuestionnairePage(currentQuestions, answers);
      
      if (!isValid) {
        setValidationError(errorMessage);
        return;
      }
      
      setCurrentPage(prev => prev + 1);
    } else {
      setValidationError(null);
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
  };

  const handleSubmit = async () => {
    const currentQuestions = QUESTIONNAIRE_PAGES[currentPage] || [];
    const { isValid, errorMessage } = validateQuestionnairePage(currentQuestions, answers);
    
    if (!isValid) {
      setValidationError(errorMessage);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert answer values to strings where needed
      const questionnaireData = {
        firstName: String(answers.firstName || ''),
        lastName: String(answers.lastName || ''),
        age: String(answers.age || ''),
        race: String(answers.race || ''),
        familyGlaucoma: String(answers.familyGlaucoma || ''),
        ocularSteroid: String(answers.ocularSteroid || ''),
        steroidType: answers.steroidType ? String(answers.steroidType) : '',
        intravitreal: String(answers.intravitreal || ''),
        intravitralType: answers.intravitralType ? String(answers.intravitralType) : '', 
        systemicSteroid: String(answers.systemicSteroid || ''),
        systemicSteroidType: answers.systemicSteroidType ? String(answers.systemicSteroidType) : '',
        iopBaseline: String(answers.iopBaseline || ''),
        verticalAsymmetry: String(answers.verticalAsymmetry || ''),
        verticalRatio: String(answers.verticalRatio || '')
      };
      
      console.log("Submitting questionnaire data:", questionnaireData);
      
      const result = await submitPatientQuestionnaire(questionnaireData);
      
      setResults({
        score: result.score,
        riskLevel: result.riskLevel
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
          title="Patient Questionnaire"
          icon={<Clipboard size={20} />}
          description="Please answer the following questions about the patient."
        />

        <div className="max-w-2xl mx-auto mt-6">
          {isCompleted && results ? (
            <QuestionnaireResults score={results.score} riskLevel={results.riskLevel} />
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
                totalPages={QUESTIONNAIRE_PAGES.length}
              />

              <QuestionnaireForm 
                currentPage={currentPage}
                onAnswerChange={handleAnswerChange}
                answers={answers}
              />

              <QuestionnaireNavigation
                currentPage={currentPage}
                totalPages={QUESTIONNAIRE_PAGES.length}
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
