import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuestionnaireById, updateQuestionnaire, getQuestionsWithTooltips, PatientQuestionnaireData } from "@/services/PatientQuestionnaireService";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { Clipboard, AlertCircle, User, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuestionnaireForm from "@/components/questionnaires/QuestionnaireForm";
import QuestionnaireProgress from "@/components/questionnaires/QuestionnaireProgress";
import QuestionnaireNavigation from "@/components/questionnaires/QuestionnaireNavigation";
import QuestionnaireResults from "@/components/questionnaires/QuestionnaireResults";
import { validateQuestionnairePage } from "@/components/questionnaires/QuestionnaireValidation";
// REMOVED: No longer using hardcoded constants for structure
// import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Interface for DB Question data (ensure this matches service response)
// Should align with the interface in QuestionnaireContainer and QuestionnaireForm
interface DBQuestion {
  id: string;
  question: string;
  tooltip?: string;
  page_category: string;
  question_type?: string;
  options?: Array<{
      option_value: string;
      option_text: string;
      score?: number;
      tooltip?: string;
  }>;
  display_order?: number;
  conditional_parent_id?: string;
  conditional_required_value?: string;
}

interface ContributingFactor {
  question: string;
  answer: string;
  score: number;
}

// Interface for the data structure returned by getQuestionnaireById
interface FetchedQuestionnaireData extends Record<string, any> {
  first_name: string;
  last_name: string;
  age: string;
  race: string;
  family_glaucoma: boolean;
  ocular_steroid: boolean;
  steroid_type: string | null;
  intravitreal: boolean;
  intravitreal_type: string | null;
  systemic_steroid: boolean;
  systemic_steroid_type: string | null;
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
type AnswerValue = string | number | boolean | null | undefined;

// Define the order of page categories - Must match admin categories in questionConstants.ts
const PAGE_CATEGORIES = ['patient_info', 'family_medication', 'clinical_measurements'];

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
  // Use the correct DBQuestion type for state
  const [allDbQuestions, setAllDbQuestions] = useState<DBQuestion[]>([]);
  // Use predefined page category order
  const [pageCategories] = useState<string[]>(PAGE_CATEGORIES);

  // Determine current page category and total pages based on predefined order
  const currentPageCategory = pageCategories[currentPage] || '';
  const totalPages = pageCategories.length;

  // --- Debugging: Log before filtering ---
  console.log(`QuestionnaireEdit: Filtering for page ${currentPage}, category: '${currentPageCategory}'`);
  console.log(`QuestionnaireEdit: allDbQuestions before filter (count: ${allDbQuestions.length}):`, JSON.stringify(allDbQuestions.map(q => ({ id: q.id, cat: q.page_category })), null, 2)); // Log IDs and categories
  // --- End Debugging ---

  // Filter DB questions for the current page category and sort
  const questionsForCurrentPage = allDbQuestions
    .filter(q => q.page_category === currentPageCategory)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
  console.log(`QuestionnaireEdit: Filtered questions for page ${currentPage} (${currentPageCategory}):`, questionsForCurrentPage); // Log filtered questions

  // Fetch all questions once
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsData = await getQuestionsWithTooltips(); // Fetches UUID-validated and trimmed-tooltip questions
        setAllDbQuestions(questionsData || []);
        console.log("QuestionnaireEdit: Fetched allDbQuestions:", questionsData); // Log fetched questions
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions configuration.");
      }
    };
    fetchQuestions();
  }, []);

  // Fetch existing questionnaire data
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
        const questionnaireData = await getQuestionnaireById(id) as FetchedQuestionnaireData;
        console.log("QuestionnaireEdit: Fetched questionnaire data:", questionnaireData); // Log raw fetched data

        setPatientName({
          firstName: questionnaireData.first_name || "",
          lastName: questionnaireData.last_name || ""
        });

        // --- Map fetched data to answers state using Question IDs as keys ---
        const initialAnswers: Record<string, AnswerValue> = {};

        // Helper to find question ID based on a potential identifier or text match
        // NOTE: This mapping is based on assumptions and might need refinement
        const findQuestionId = (identifier: string): string | undefined => {
          // Try matching a hypothetical 'identifier' field first, then question text
          // Make the search case-insensitive
          const lowerIdentifier = identifier.toLowerCase();
          const q = allDbQuestions.find(
            (q) => (q as any).identifier === identifier || q.question.toLowerCase().includes(lowerIdentifier)
          );
          return q?.id;
        };

        // Map known fields from questionnaireData to question IDs
        const mapping: { [key in keyof FetchedQuestionnaireData]?: { idIdentifier: string; transform?: (val: any) => AnswerValue } } = {
          age: { idIdentifier: 'age' },
          race: { idIdentifier: 'race' }, // Keep as is
          family_glaucoma: { idIdentifier: 'has anyone in your immediate family', transform: (val) => val ? "yes" : "no" }, // More specific text
          ocular_steroid: { idIdentifier: 'ophthalmic topical steroids', transform: (val) => val ? "yes" : "no" }, // More specific text
          steroid_type: { idIdentifier: 'which ophthalmic topical steroid' }, // More specific text
          intravitreal: { idIdentifier: 'intravitreal steroids', transform: (val) => val ? "yes" : "no" }, // Lowercase
          intravitreal_type: { idIdentifier: 'which intravitreal steroid' }, // More specific text
          systemic_steroid: { idIdentifier: 'systemic steroids', transform: (val) => val ? "yes" : "no" }, // Lowercase
          systemic_steroid_type: { idIdentifier: 'which systemic steroid' }, // More specific text
          iop_baseline: { idIdentifier: 'iop baseline', transform: (val) => val ? "22_and_above" : "21_and_under" },
          vertical_asymmetry: { idIdentifier: 'ratio asymmetry', transform: (val) => val ? "0.2_and_above" : "under_0.2" }, // Correct text snippet
          vertical_ratio: { idIdentifier: 'vertical c:d ratio', transform: (val) => val ? "0.6_and_above" : "below_0.6" }, // Keep as is
        };

        for (const key in mapping) {
          if (Object.prototype.hasOwnProperty.call(questionnaireData, key)) {
            const mapInfo = mapping[key as keyof typeof mapping];
            if (mapInfo) {
              const questionId = findQuestionId(mapInfo.idIdentifier);
              if (questionId) {
                const rawValue = questionnaireData[key as keyof FetchedQuestionnaireData];
                initialAnswers[questionId] = mapInfo.transform ? mapInfo.transform(rawValue) : (rawValue ?? undefined);
              } else {
                console.warn(`QuestionnaireEdit: Could not find question ID for identifier '${mapInfo.idIdentifier}'`);
              }
            }
          }
        }

        // Include firstName and lastName directly if needed (though they aren't usually question answers)
        // initialAnswers['firstName'] = patientName.firstName; // Example if needed
        // initialAnswers['lastName'] = patientName.lastName;

        console.log("QuestionnaireEdit: Initial answers state with UUID keys:", initialAnswers); // Log the correctly keyed answers

        setAnswers(initialAnswers);

      } catch (error) {
        console.error("Error loading questionnaire:", error);
        setLoadError("Failed to load questionnaire data. Please try again.");
        toast.error("Failed to load questionnaire data");
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have questions loaded, otherwise data might be incomplete
    if (allDbQuestions.length > 0) {
        fetchQuestionnaire();
    }
  }, [id, navigate, allDbQuestions]); // Re-run if allDbQuestions changes

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
      // Skip validation for patient information page (first page)
      if (currentPage === 0) {
         if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
         }
        return;
      }

      // Validate using the questions actually rendered on the current page
      // Filter out conditional questions that shouldn't be validated based on DB fields
      const questionsToValidate = questionsForCurrentPage.filter(question => {
        if (!question.conditional_parent_id || !question.conditional_required_value) {
            return true; // Not conditional, always validate
        }
        // Only validate if the parent condition is met
        const parentAnswer = answers[question.conditional_parent_id];
        return String(parentAnswer) === question.conditional_required_value;
      });

      console.log(`Validating Edit page ${currentPage}:`, questionsToValidate);
      const { isValid, errorMessage } = validateQuestionnairePage(questionsToValidate, answers);

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
    if (!id) return;

    // Validate the last page before submitting
    if (currentPage === totalPages - 1) {
      // Filter out conditional questions that shouldn't be validated
       const questionsToValidate = questionsForCurrentPage.filter(question => {
         if (!question.conditional_parent_id || !question.conditional_required_value) {
             return true; // Not conditional, always validate
         }
         const parentAnswer = answers[question.conditional_parent_id];
         return String(parentAnswer) === question.conditional_required_value;
       });

      console.log(`Validating final Edit page ${currentPage}:`, questionsToValidate);
      const { isValid, errorMessage } = validateQuestionnairePage(questionsToValidate, answers);

      if (!isValid) {
        setValidationError(errorMessage);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Construct payload using the same logic as QuestionnaireContainer
      // Ensure PatientQuestionnaireData interface matches expected structure
       const finalPayload: PatientQuestionnaireData = {
          firstName: patientName.firstName, // Keep original name
          lastName: patientName.lastName,   // Keep original name
          age: String(answers.age || ''), // Assuming 'age' is ID
          race: String(answers.race || ''), // Assuming 'race' is ID
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
      };

      console.log("Updating questionnaire data (DB-Driven):", finalPayload);

      
            await updateQuestionnaire(id, finalPayload); // Call update, but ignore void return
      
            // Remove setResults call as updateQuestionnaire doesn't return results anymore
            // setResults({ ... });
      
            toast.success("Questionnaire updated successfully!"); // Keep success message
      setIsCompleted(true);
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      toast.error("Failed to update questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Keep Retry and Back button handlers ---
   const handleRetry = () => {
     if (!id) return;
     async function refetchQuestionnaire() {
       // ... (keep existing refetch logic)
        try {
            setLoading(true);
            setLoadError(null);
            const data = await getQuestionnaireById(id as string) as FetchedQuestionnaireData;
            setPatientName({ firstName: data.first_name || "", lastName: data.last_name || "" });
            const formattedAnswers = {
              age: data.age, race: data.race,
              familyGlaucoma: data.family_glaucoma ? "yes" : "no",
              ocularSteroid: data.ocular_steroid ? "yes" : "no",
              steroidType: data.steroid_type ?? undefined,
              intravitreal: data.intravitreal ? "yes" : "no",
              intravitralType: data.intravitreal_type ?? undefined,
              systemicSteroid: data.systemic_steroid ? "yes" : "no",
              systemicSteroidType: data.systemic_steroid_type ?? undefined,
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
        } finally { setLoading(false); }
     }
     refetchQuestionnaire();
   };

   const handleBackToList = () => { navigate("/questionnaires"); };

  // --- Keep Loading and Error states ---
   if (loading) {
     return (
       <div className="min-h-screen flex flex-col"> <Navbar />
         <div className="flex-1 flex items-center justify-center">
           <LoadingSpinner /> <span className="ml-3 text-lg">Loading questionnaire data...</span>
         </div>
       </div>);
   }
   if (loadError) {
     return (
       <div className="min-h-screen flex flex-col"> <Navbar />
         <main className="flex-1 container px-4 py-4 mb-8">
           <PageHeader title="Error Loading Questionnaire" icon={<AlertCircle size={20} />} description="We encountered a problem loading the questionnaire data." />
           <div className="max-w-2xl mx-auto mt-6">
             <Alert variant="destructive" className="mb-6"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle> <AlertDescription>{loadError}</AlertDescription> </Alert>
             <div className="flex gap-4 mt-6">
               <Button onClick={handleRetry} className="flex items-center gap-2"> <ArrowLeft size={16} /> Try Again </Button>
               <Button variant="outline" onClick={handleBackToList}> Back to Questionnaires </Button>
             </div>
           </div>
         </main>
       </div>);
   }

  // --- Update Rendering Logic ---
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
              firstName={patientName.firstName}
              lastName={patientName.lastName}
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

              {/* Display patient info read-only on first page */}
              {currentPage === 0 && (
                <Card className="animate-fade-in mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Patient Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-base font-medium leading-6 mb-1 block">Patient Name</label>
                        <div className="p-2 bg-gray-50 border rounded-md">{patientName.firstName} {patientName.lastName}</div>
                      </div>
                      {/* Render form for editable fields on page 0 (age, race) */}
                      <QuestionnaireForm
                        currentPage={currentPage}
                        onAnswerChange={handleAnswerChange}
                        answers={answers}
                        skipQuestions={["firstName", "lastName"]} // Assuming these IDs exist if needed
                        questions={questionsForCurrentPage} // Pass all questions for this page category
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Render form for subsequent pages */}
              {currentPage > 0 && (
                <QuestionnaireForm
                  currentPage={currentPage}
                  onAnswerChange={handleAnswerChange}
                  answers={answers}
                  questions={questionsForCurrentPage} // Pass filtered questions for the current page
                />
              )}

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

export default QuestionnaireEdit;
