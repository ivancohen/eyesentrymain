import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuestionnaireById, updateQuestionnaire, getQuestionsWithTooltips } from "@/services/PatientQuestionnaireService";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { Clipboard, AlertCircle, User, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuestionnaireForm from "@/components/questionnaires/QuestionnaireForm";
import QuestionnaireProgress from "@/components/questionnaires/QuestionnaireProgress";
import QuestionnaireNavigation from "@/components/questionnaires/QuestionnaireNavigation";
import QuestionnaireResults from "@/components/questionnaires/QuestionnaireResults";
import { validateQuestionnairePage } from "@/components/questionnaires/QuestionnaireValidation";
import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  question: string;
  tooltip?: string;
  page_category: string;
}

interface ContributingFactor {
  question: string;
  answer: string;
  score: number;
}

interface QuestionnaireData {
  first_name: string;
  last_name: string;
  age: string;
  race: string;
  family_glaucoma: boolean;
  ocular_steroid: boolean;
  steroid_type: string;
  intravitreal: boolean;
  intravitreal_type: string;
  systemic_steroid: boolean;
  systemic_steroid_type: string;
  iop_baseline: boolean;
  vertical_asymmetry: boolean;
  vertical_ratio: boolean;
}

interface QuestionnaireResult {
  score: number;
  riskLevel: string;
  contributing_factors: ContributingFactor[];
  advice: string;
}

// Define accepted answer value types
type AnswerValue = string | number | boolean | null;

const QuestionnaireEdit = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<QuestionnaireResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState({ firstName: "", lastName: "" });
  const [questions, setQuestions] = useState<Question[]>([]);

  // Fetch questions with tooltips
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsData = await getQuestionsWithTooltips();
        setQuestions(questionsData);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions. Please try again.");
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    async function fetchQuestionnaire() {
      if (!id) {
        setLoadError("No questionnaire ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setLoadError(null);
        const questionnaireData = await getQuestionnaireById(id as string) as QuestionnaireData;
        
        // Store patient name separately
        setPatientName({
          firstName: questionnaireData.first_name,
          lastName: questionnaireData.last_name
        });
        
        // Transform database values back to form values, excluding first/last name
        const formattedAnswers = {
          age: questionnaireData.age,
          race: questionnaireData.race,
          familyGlaucoma: questionnaireData.family_glaucoma ? "yes" : "no",
          ocularSteroid: questionnaireData.ocular_steroid ? "yes" : "no",
          steroidType: questionnaireData.steroid_type || "",
          intravitreal: questionnaireData.intravitreal ? "yes" : "no",
          intravitralType: questionnaireData.intravitreal_type || "",
          systemicSteroid: questionnaireData.systemic_steroid ? "yes" : "no",
          systemicSteroidType: questionnaireData.systemic_steroid_type || "",
          iopBaseline: questionnaireData.iop_baseline ? "22_and_above" : "21_and_under",
          verticalAsymmetry: questionnaireData.vertical_asymmetry ? "0.2_and_above" : "under_0.2",
          verticalRatio: questionnaireData.vertical_ratio ? "0.6_and_above" : "below_0.6"
        };
        
        setAnswers(formattedAnswers);
        
      } catch (error) {
        console.error("Error loading questionnaire:", error);
        setLoadError("Failed to load questionnaire data. Please try again.");
        toast.error("Failed to load questionnaire data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuestionnaire();
  }, [id, navigate]);

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
      // Skip validation for patient information page (first page) since we're not editing it
      if (currentPage === 0) {
        setCurrentPage(prev => prev + 1);
        return;
      }
      
      const currentQuestions = QUESTIONNAIRE_PAGES[currentPage] || [];
      
      // Filter out conditional questions that shouldn't be validated
      const questionsToValidate = currentQuestions.filter(question => {
        if (!question.conditionalOptions) return true;
        
        const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
        return answers[parentId] === requiredValue;
      });
      
      const { isValid, errorMessage } = validateQuestionnairePage(questionsToValidate, answers);
      
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
    if (!id) return;
    
    // For the last page, validate before submitting
    if (currentPage === QUESTIONNAIRE_PAGES.length - 1) {
      const currentQuestions = QUESTIONNAIRE_PAGES[currentPage] || [];
      const { isValid, errorMessage } = validateQuestionnairePage(currentQuestions, answers);
      
      if (!isValid) {
        setValidationError(errorMessage);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Include the original patient name in the submission data
      const questionnaireData = {
        firstName: patientName.firstName,
        lastName: patientName.lastName,
        age: answers.age as string,
        race: answers.race as string,
        familyGlaucoma: answers.familyGlaucoma as string,
        ocularSteroid: answers.ocularSteroid as string,
        steroidType: answers.steroidType as string,
        intravitreal: answers.intravitreal as string,
        intravitralType: answers.intravitralType as string,
        systemicSteroid: answers.systemicSteroid as string,
        systemicSteroidType: answers.systemicSteroidType as string,
        iopBaseline: answers.iopBaseline as string,
        verticalAsymmetry: answers.verticalAsymmetry as string,
        verticalRatio: answers.verticalRatio as string
      };
      
      console.log("Updating questionnaire data:", questionnaireData);
      
      const result = await updateQuestionnaire(id, questionnaireData);
      
      setResults({
        score: result.score,
        riskLevel: result.riskLevel,
        contributing_factors: result.contributing_factors || [],
        advice: result.advice || ""
      });
      
      toast.success("Questionnaire updated successfully!");
      
      setIsCompleted(true);
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      toast.error("Failed to update questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    // Reset loading state and try to fetch the questionnaire again
    if (!id) return;
    
    async function refetchQuestionnaire() {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await getQuestionnaireById(id as string) as QuestionnaireData;
        
        setPatientName({
          firstName: data.first_name,
          lastName: data.last_name
        });
        
        const formattedAnswers = {
          age: data.age,
          race: data.race,
          familyGlaucoma: data.family_glaucoma ? "yes" : "no",
          ocularSteroid: data.ocular_steroid ? "yes" : "no",
          steroidType: data.steroid_type || "",
          intravitreal: data.intravitreal ? "yes" : "no",
          intravitralType: data.intravitreal_type || "",
          systemicSteroid: data.systemic_steroid ? "yes" : "no",
          systemicSteroidType: data.systemic_steroid_type || "",
          iopBaseline: data.iop_baseline ? "22_and_above" : "21_and_under",
          verticalAsymmetry: data.vertical_asymmetry ? "0.2_and_above" : "under_0.2",
          verticalRatio: data.vertical_ratio ? "0.6_and_above" : "below_0.6"
        };
        
        setAnswers(formattedAnswers);
        toast.success("Questionnaire data loaded successfully");
        
      } catch (error) {
        console.error("Error retry loading questionnaire:", error);
        setLoadError("Failed to load questionnaire data. Please try again.");
        toast.error("Failed to load questionnaire data");
      } finally {
        setLoading(false);
      }
    }
    
    refetchQuestionnaire();
  };

  const handleBackToList = () => {
    navigate("/questionnaires");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-lg">Loading questionnaire data...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container px-4 py-4 mb-8">
          <PageHeader
            title="Error Loading Questionnaire"
            icon={<AlertCircle size={20} />}
            description="We encountered a problem loading the questionnaire data."
          />
          
          <div className="max-w-2xl mx-auto mt-6">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            
            <div className="flex gap-4 mt-6">
              <Button onClick={handleRetry} className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Try Again
              </Button>
              
              <Button variant="outline" onClick={handleBackToList}>
                Back to Questionnaires
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <PageHeader
          title="Edit Questionnaire"
          icon={<Clipboard size={20} />}
          description="Update the questionnaire responses and recalculate the risk score."
        />

        <div className="max-w-2xl mx-auto mt-6">
          {isCompleted && results ? (
            <QuestionnaireResults 
              score={results.score} 
              riskLevel={results.riskLevel}
              contributing_factors={results.contributing_factors}
              advice={results.advice}
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
                totalPages={QUESTIONNAIRE_PAGES.length}
              />

              {/* Always display patient information in read-only format regardless of page */}
              {currentPage === 0 && (
                <Card className="animate-fade-in mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Patient Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-base font-medium leading-6 mb-1 block">
                          Patient Name
                        </label>
                        <div className="p-2 bg-gray-50 border rounded-md">
                          {patientName.firstName} {patientName.lastName}
                        </div>
                      </div>
                      
                      {/* Only render the age and race questions from the first page */}
                      <QuestionnaireForm 
                        currentPage={currentPage}
                        onAnswerChange={handleAnswerChange}
                        answers={answers}
                        skipQuestions={["firstName", "lastName"]}
                        questions={questions}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentPage > 0 && (
                <QuestionnaireForm 
                  currentPage={currentPage}
                  onAnswerChange={handleAnswerChange}
                  answers={answers}
                  questions={questions}
                />
              )}

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

export default QuestionnaireEdit;
