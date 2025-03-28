import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getQuestionnaireById, getQuestionsWithTooltips, PatientQuestionnaireData } from "@/services/PatientQuestionnaireService";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import { Clipboard, AlertCircle, User, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QuestionnaireForm from "@/components/questionnaires/QuestionnaireForm";
import QuestionnaireProgress from "@/components/questionnaires/QuestionnaireProgress";
import QuestionnaireNavigation from "@/components/questionnaires/QuestionnaireNavigation";
import QuestionnaireResults from "@/components/questionnaires/QuestionnaireResults";
import { validateQuestionnairePage } from "@/components/questionnaires/QuestionnaireValidation";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Interface for DB Question data (ensure this matches service response)
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
  id: string;
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
  total_score: number;
  risk_level: string;
  answers?: Record<string, string>; // This is critical - represents saved answers with question IDs
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

// Map of known DB fields to their question text patterns for better mapping
const DB_FIELD_PATTERNS: Record<string, string[]> = {
  'age': ['age', 'how old'],
  'race': ['race', 'ethnicity'],
  'family_glaucoma': ['family', 'glaucoma', 'immediate family'],
  'ocular_steroid': ['ophthalmic', 'topical', 'steroids'],
  'steroid_type': ['which ophthalmic', 'which topical', 'steroid type'],
  'intravitreal': ['intravitreal', 'steroid injections'],
  'intravitreal_type': ['which intravitreal', 'intravitreal type'],
  'systemic_steroid': ['systemic', 'oral', 'steroids'],
  'systemic_steroid_type': ['which systemic', 'systemic type'],
  'iop_baseline': ['iop', 'intraocular pressure', 'baseline'],
  'vertical_asymmetry': ['asymmetry', 'cup/disc asymmetry'],
  'vertical_ratio': ['vertical ratio', 'cup-to-disc', 'c:d ratio']
};

// Map DB boolean fields to string values
const BOOLEAN_TO_STRING_MAP: Record<string, { true: string, false: string }> = {
  'family_glaucoma': { true: 'yes', false: 'no' },
  'ocular_steroid': { true: 'yes', false: 'no' },
  'intravitreal': { true: 'yes', false: 'no' },
  'systemic_steroid': { true: 'yes', false: 'no' },
  'iop_baseline': { true: '22_and_above', false: '21_and_under' },
  'vertical_asymmetry': { true: '0.2_and_above', false: 'under_0.2' },
  'vertical_ratio': { true: '0.6_and_above', false: 'below_0.6' }
};

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
  // Store the original questionnaire data for reference
  const [originalData, setOriginalData] = useState<FetchedQuestionnaireData | null>(null);
  // Cache the question ID mapping for better performance
  const [questionIdMap, setQuestionIdMap] = useState<Record<string, string>>({});
  // Use predefined page category order
  const [pageCategories] = useState<string[]>(PAGE_CATEGORIES);

  // Determine current page category and total pages based on predefined order
  const currentPageCategory = pageCategories[currentPage] || '';
  const totalPages = pageCategories.length;

  // Filter DB questions for the current page category and sort
  const questionsForCurrentPage = allDbQuestions
    .filter(q => q.page_category === currentPageCategory)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  // Build a question ID map to help with mapping DB fields to question IDs
  useEffect(() => {
    if (allDbQuestions.length > 0) {
      const newMap: Record<string, string> = {};
      
      // For each DB field pattern, find matching questions
      Object.entries(DB_FIELD_PATTERNS).forEach(([dbField, patterns]) => {
        // Try to find a question that matches any of the patterns
        const matchingQuestion = allDbQuestions.find(q => {
          const questionText = q.question.toLowerCase();
          return patterns.some(pattern => questionText.includes(pattern.toLowerCase()));
        });
        
        if (matchingQuestion) {
          newMap[dbField] = matchingQuestion.id;
        }
      });
      
      console.log("Built question ID map:", newMap);
      setQuestionIdMap(newMap);
    }
  }, [allDbQuestions]);

  // Fetch all questions once
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsData = await getQuestionsWithTooltips();
        setAllDbQuestions(questionsData || []);
        console.log("QuestionnaireEdit: Fetched allDbQuestions:", questionsData);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions configuration.");
      }
    };
    fetchQuestions();
  }, []);

  // Map DB boolean values to string options
  const mapBooleanToString = (field: string, value: boolean): string => {
    const mapping = BOOLEAN_TO_STRING_MAP[field];
    if (mapping) {
      return value ? mapping.true : mapping.false;
    }
    return value ? 'yes' : 'no'; // Default fallback
  };

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
        console.log("QuestionnaireEdit: Fetched questionnaire data:", questionnaireData);
        
        // Store original data for reference
        setOriginalData(questionnaireData);
        
        setPatientName({
          firstName: questionnaireData.first_name || "",
          lastName: questionnaireData.last_name || ""
        });

        // If the questionnaire has an answers JSON field, use it directly
        if (questionnaireData.answers && Object.keys(questionnaireData.answers).length > 0) {
          console.log("Using stored answers JSON directly:", questionnaireData.answers);
          setAnswers(questionnaireData.answers);
        } else {
          // Otherwise, map the DB fields to question IDs
          // We'll do this mapping after questionIdMap is populated
          if (Object.keys(questionIdMap).length > 0) {
            const initialAnswers: Record<string, AnswerValue> = {};
            
            // Use the questionIdMap to map DB fields to question IDs
            Object.entries(questionIdMap).forEach(([dbField, questionId]) => {
              if (questionId && questionnaireData[dbField] !== undefined) {
                // For boolean fields, map to appropriate string values
                if (typeof questionnaireData[dbField] === 'boolean') {
                  initialAnswers[questionId] = mapBooleanToString(dbField, questionnaireData[dbField] as boolean);
                } else {
                  // For string fields, use directly
                  initialAnswers[questionId] = questionnaireData[dbField] ?? '';
                }
              }
            });
            
            // Handle special fields like steroid_type that are dependent on their parent question
            if (questionnaireData.steroid_type && questionIdMap['steroid_type']) {
              initialAnswers[questionIdMap['steroid_type']] = questionnaireData.steroid_type;
            }
            if (questionnaireData.intravitreal_type && questionIdMap['intravitreal_type']) {
              initialAnswers[questionIdMap['intravitreal_type']] = questionnaireData.intravitreal_type;
            }
            if (questionnaireData.systemic_steroid_type && questionIdMap['systemic_steroid_type']) {
              initialAnswers[questionIdMap['systemic_steroid_type']] = questionnaireData.systemic_steroid_type;
            }
            
            console.log("Mapped answers from DB fields to question IDs:", initialAnswers);
            setAnswers(initialAnswers);
          }
        }
      } catch (error) {
        console.error("Error loading questionnaire:", error);
        setLoadError("Failed to load questionnaire data. Please try again.");
        toast.error("Failed to load questionnaire data");
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have questions loaded and the question ID map is built
    if (allDbQuestions.length > 0 && Object.keys(questionIdMap).length > 0) {
      fetchQuestionnaire();
    }
  }, [id, questionIdMap, allDbQuestions]);

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

  // Reverse map question IDs to DB field names for submission
  const getDbFieldForQuestionId = (questionId: string): string | null => {
    for (const [field, id] of Object.entries(questionIdMap)) {
      if (id === questionId) return field;
    }
    return null;
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
      // Construct the final payload by mapping question IDs back to DB field names 
      const finalPayload: PatientQuestionnaireData = {
        firstName: patientName.firstName,
        lastName: patientName.lastName,
        age: '',
        race: '',
        familyGlaucoma: 'no',
        ocularSteroid: 'no',
        intravitreal: 'no',
        systemicSteroid: 'no',
        iopBaseline: '',
        verticalAsymmetry: '',
        verticalRatio: ''
      };

      // Map each answer back to its DB field name
      Object.entries(answers).forEach(([questionId, value]) => {
        const dbField = getDbFieldForQuestionId(questionId);
        if (dbField) {
          // Handle special mappings based on DB field name
          switch (dbField) {
            case 'age':
              finalPayload.age = String(value || '');
              break;
            case 'race':
              finalPayload.race = String(value || '');
              break;
            case 'family_glaucoma':
              finalPayload.familyGlaucoma = String(value || 'no');
              break;
            case 'ocular_steroid':
              finalPayload.ocularSteroid = String(value || 'no');
              break;
            case 'steroid_type':
              finalPayload.steroidType = value as string | undefined;
              break;
            case 'intravitreal':
              finalPayload.intravitreal = String(value || 'no');
              break;
            case 'intravitreal_type':
              finalPayload.intravitralType = value as string | undefined;
              break;
            case 'systemic_steroid':
              finalPayload.systemicSteroid = String(value || 'no');
              break;
            case 'systemic_steroid_type':
              finalPayload.systemicSteroidType = value as string | undefined;
              break;
            case 'iop_baseline':
              finalPayload.iopBaseline = String(value || '');
              break;
            case 'vertical_asymmetry':
              finalPayload.verticalAsymmetry = String(value || '');
              break;
            case 'vertical_ratio':
              finalPayload.verticalRatio = String(value || '');
              break;
          }
        }
      });

      console.log("Updating questionnaire data (DB-Driven):", finalPayload);

      // Update functionality removed

      setResults({
        score: results.score,
        riskLevel: results.riskLevel,
        contributing_factors: results.contributing_factors || [],
        advice: results.advice || ""
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

  // --- Retry handler updated to use original data ---
  const handleRetry = () => {
    if (!id || !originalData) return;
    
    try {
      setLoading(true);
      // Reset answers state with values from original data
      if (originalData.answers && Object.keys(originalData.answers).length > 0) {
        // Use pre-stored answers if available
        setAnswers(originalData.answers);
      } else if (Object.keys(questionIdMap).length > 0) {
        // Otherwise map from DB fields
        const refreshedAnswers: Record<string, AnswerValue> = {};
        
        // Map basic fields using the ID map
        Object.entries(questionIdMap).forEach(([dbField, questionId]) => {
          if (questionId && originalData[dbField] !== undefined) {
            if (typeof originalData[dbField] === 'boolean') {
              refreshedAnswers[questionId] = mapBooleanToString(dbField, originalData[dbField] as boolean);
            } else {
              refreshedAnswers[questionId] = originalData[dbField] ?? '';
            }
          }
        });
        
        // Handle conditional fields
        if (originalData.steroid_type && questionIdMap['steroid_type']) {
          refreshedAnswers[questionIdMap['steroid_type']] = originalData.steroid_type;
        }
        if (originalData.intravitreal_type && questionIdMap['intravitreal_type']) {
          refreshedAnswers[questionIdMap['intravitreal_type']] = originalData.intravitreal_type;
        }
        if (originalData.systemic_steroid_type && questionIdMap['systemic_steroid_type']) {
          refreshedAnswers[questionIdMap['systemic_steroid_type']] = originalData.systemic_steroid_type;
        }
        
        setAnswers(refreshedAnswers);
      }
      
      // Reset validation and completion state
      setValidationError(null);
      setIsCompleted(false);
      setCurrentPage(0);
      
      toast.success("Questionnaire reset to original values");
    } catch (error) {
      console.error("Error resetting questionnaire:", error);
      toast.error("Failed to reset questionnaire data");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => { navigate("/questionnaires"); };

  // --- Loading and Error states ---
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