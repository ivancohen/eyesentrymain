import { CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
// Import QuestionItem for hybrid approach
import { QuestionItem, QuestionOption } from "@/constants/questionnaireConstants"; // Also import QuestionOption
import { DBQuestion } from "@/services/PatientQuestionnaireService"; // Import DBQuestion type
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define accepted answer value types
type AnswerValue = string | number | boolean | null | undefined;

// REMOVED local DBQuestion interface - Use imported version

interface QuestionnaireFormProps {
  answers: Record<string, AnswerValue>;
  currentPage: number; // Still needed for warnings, maybe refactor later
  onAnswerChange?: (questionId: string, value: AnswerValue) => void;
  setAnswers?: (answers: Record<string, AnswerValue>) => void;
  skipQuestions?: string[];
  // Prop type now accepts DBQuestion OR QuestionItem array
  questions: (DBQuestion | QuestionItem)[];
}

// Type guard to check if a question is a DBQuestion
function isDBQuestion(question: DBQuestion | QuestionItem): question is DBQuestion {
    return 'page_category' in question; // page_category only exists on DBQuestion
}

// Type guard to check if an option is from DBQuestion
function isDBOption(option: any): option is { option_value: string; option_text: string; score?: number; display_order?: number } {
    return 'option_value' in option;
}

// Type guard to check if an option is from QuestionItem
function isHardcodedOption(option: any): option is QuestionOption {
    return 'value' in option;
}


const QuestionnaireForm = ({
  answers,
  currentPage, // Keep for warnings for now
  onAnswerChange,
  setAnswers,
  skipQuestions = [],
  questions // This is now (DBQuestion | QuestionItem)[]
}: QuestionnaireFormProps) => {

  // Use the received questions directly
  const questionsToRender = questions;

  console.log(`DB-Driven/Hybrid - Page ${currentPage}, Rendering ${questionsToRender.length} questions.`);


  // --- Update handlers and rendering logic to use DBQuestion properties ---

  const handleValueChange = (questionId: string, value: AnswerValue) => {
    if (onAnswerChange) {
      onAnswerChange(questionId, value);
    } else if (setAnswers) {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleValueChange(name, value);
  };

  // Conditional logic - Updated to handle both types
  const isConditionalQuestionDisabled = (question: DBQuestion | QuestionItem): boolean => {
    let parentId: string | undefined;
    let requiredValue: string | undefined;

    // Hardcoded conditional relationships for known DB questions (since DB fields are missing)
    const conditionalMappings: Record<string, { parentId: string, requiredValue: string }> = {
      // Which ophthalmic topical steroid
      "27b24dae-f107-431a-8422-bf49df018e1f": {
        parentId: "879cd028-1b29-4529-9cdb-7adcaf44d553",
        requiredValue: "yes"
      },
      // Which intravitreal steroid
      "986f807c-bc31-4241-9ce3-6c6d3bbf09ad": {
        parentId: "631db108-0f4c-46ff-941e-c37f6856060c",
        requiredValue: "yes"
      },
      // Which systemic steroid
      "468969a4-0f2b-4a03-8cc1-b9f80efff559": {
        parentId: "a43ecfbc-413f-4925-8908-f9fc0d35ea0f",
        requiredValue: "yes"
      }
    };

    // Check if this is a known conditional question
    if (isDBQuestion(question) && conditionalMappings[question.id]) {
      parentId = conditionalMappings[question.id].parentId;
      requiredValue = conditionalMappings[question.id].requiredValue;
    } else if (isDBQuestion(question)) {
      // Fall back to database fields if they exist (for future-proofing)
      parentId = question.conditional_parent_id;
      requiredValue = question.conditional_required_value;
    } else { // It's a QuestionItem (shouldn't happen in current flow, but keep for safety)
      if (question.conditionalOptions) {
        [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
      }
    }

    if (!parentId || !requiredValue) {
      return false; // Not a conditional question or missing data
    }

    const parentAnswer = answers[parentId];
    const isDisabled = String(parentAnswer).toLowerCase() !== requiredValue.toLowerCase();

    return isDisabled;
  };

  // Update warnings if needed (assuming IDs are stable)
  // These might need to be driven by DB properties/categories if IDs change
  const showFamilyGlaucomaWarning = currentPage === 1 &&
    String(answers.familyGlaucoma) === "not_available"; // Assumes 'familyGlaucoma' is a stable ID
  const showClinicalMeasurementsWarning = currentPage === 2 && (
    String(answers.iopBaseline) === "not_available" || // Assumes 'iopBaseline' is stable ID
    String(answers.verticalAsymmetry) === "not_available" || // Assumes 'verticalAsymmetry' is stable ID
    String(answers.verticalRatio) === "not_available" // Assumes 'verticalRatio' is stable ID
  );

  // Helper functions - Updated to handle both types
  const getParentQuestionText = (question: DBQuestion | QuestionItem): string => {
    let parentId: string | undefined;
    if (isDBQuestion(question)) {
        parentId = question.conditional_parent_id;
    } else if (question.conditionalOptions) {
        [parentId] = question.conditionalOptions.parentValue.split(':');
    }
    if (!parentId) return '';

    // Find parent in the rendered list (could be DB or Hardcoded)
    const parentQuestion = questionsToRender.find(q => q.id === parentId);
    return parentQuestion?.question || ''; // Use .question (common property)
  };

  const getRequiredValueText = (question: DBQuestion | QuestionItem): string => {
     let parentId: string | undefined;
     let requiredValue: string | undefined;

     if (isDBQuestion(question)) {
         parentId = question.conditional_parent_id;
         requiredValue = question.conditional_required_value;
     } else if (question.conditionalOptions) {
         [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
     }

     if (!parentId || !requiredValue) return '';

     const parentQuestion = questionsToRender.find(q => q.id === parentId);
     if (!parentQuestion) return requiredValue; // Fallback

     // Find the option text based on parent question type
     const options = isDBQuestion(parentQuestion) ? parentQuestion.options : parentQuestion.options; // Get options array
     const option = options?.find(opt => {
         const value = isDBOption(opt) ? opt.option_value : (isHardcodedOption(opt) ? opt.value : undefined);
         return value === requiredValue;
     });

     // Get the text/label
     const text = option ? (isDBOption(option) ? option.option_text : (isHardcodedOption(option) ? option.label : requiredValue)) : requiredValue;
     return text || requiredValue;
  };


  return (
    <Card className="w-full max-w-2xl mx-auto glass-panel hover:shadow-lg transition-shadow" style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
      <CardContent className="pt-6">
        {/* Tooltip instruction note */}
        <div className="mb-6 p-4 bg-muted rounded-lg border">
           <div className="flex items-start gap-2">
             <Info className="h-5 w-5 text-primary mt-0.5" />
             <div>
               <p className="text-sm font-medium mb-1">Helpful Information Available</p>
               <p className="text-sm text-muted-foreground">
                 Look for the <Info className="h-4 w-4 inline-block mx-1 text-muted-foreground" /> icon next to questions for additional information and guidance. Hover over the icon to view helpful details about each question.
               </p>
             </div>
           </div>
        </div>

        {/* Warnings */}
        {showFamilyGlaucomaWarning && (
          <Alert className="mb-6" variant="default">
             <AlertTriangle className="h-4 w-4 text-amber-500" />
             <AlertDescription className="text-amber-700 bg-amber-50">
               Please note that failing to enter this information may lead to a significantly reduced risk score...
             </AlertDescription>
          </Alert>
        )}
        {showClinicalMeasurementsWarning && (
          <Alert className="mb-6" variant="default">
             <AlertTriangle className="h-4 w-4 text-amber-500" />
             <AlertDescription className="text-amber-700 bg-amber-50">
               Please note that failing to enter this information may lead to a significantly reduced risk score...
             </AlertDescription>
          </Alert>
        )}

        {/* Render questions directly from the filtered 'questions' prop */}
        <div className="space-y-5">
          {questionsToRender && questionsToRender.length > 0 ? (
            questionsToRender.map((question, index) => {
              // Skip questions based on skipQuestions prop
              if (skipQuestions.includes(question.id)) return null;

              // Conditional logic relies on DB structure now
              // We rely on isDisabled to control appearance/interaction.
              const isDisabled = isConditionalQuestionDisabled(question);
              const questionText = question.question;
              // Determine type based on available property
              const questionType = isDBQuestion(question) ? question.question_type : question.type;

              // Render Input for 'text' or 'number' type questions
              if (questionType === 'text' || questionType === 'number') {
                return (
                  <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <label htmlFor={question.id} className="text-base font-medium leading-6 mb-2 block">
                      {questionText}
                      {/* Render tooltip only if it exists */}
                      {question.tooltip && question.tooltip.trim() && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] p-4">
                              <p className="text-sm">{question.tooltip.trim()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </label>
                    <Input
                      id={question.id}
                      type={questionType === 'number' ? 'number' : 'text'}
                      name={question.id}
                      value={String(answers[question.id] || "")}
                      onChange={handleInputChange}
                      className="w-full input-animation"
                      disabled={isDisabled} // Apply disabled state if conditional
                    />
                  </div>
                );
              }

              // Render Select for 'select' or 'dropdown' type
              if (questionType === 'select' || questionType === 'dropdown') {
                  // Get options array (common property name)
                  const options = question.options;

                  const selectContent = (
                    <Select
                      value={String(answers[question.id] || "")}
                      onValueChange={(value) => handleValueChange(question.id, value)}
                      disabled={isDisabled} // Apply disabled state
                    >
                      <SelectTrigger id={question.id} className={`w-full input-animation ${isDisabled ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{questionText}</SelectLabel>
                          {/* Sort options by display_order if available */}
                          {options?.slice()
                            .sort((a, b) => {
                              // Get display_order with fallback to ensure consistent sorting
                              const orderA = isDBOption(a) ? (a.display_order ?? 999) :
                                             (isHardcodedOption(a) ? (a.order ?? 999) : 999);
                              const orderB = isDBOption(b) ? (b.display_order ?? 999) :
                                             (isHardcodedOption(b) ? (b.order ?? 999) : 999);
                              return orderA - orderB;
                            })
                            .map((option) => {
                              // Determine value and text based on option type
                              const value = isDBOption(option) ? option.option_value : (isHardcodedOption(option) ? option.value : '');
                              const text = isDBOption(option) ? option.option_text : (isHardcodedOption(option) ? option.label : '');
                              // Tooltip only exists on hardcoded QuestionOption
                              const tooltip = isHardcodedOption(option) ? option.tooltip : undefined;

                              return (
                                <SelectItem
                                  key={value} // Use determined value
                                  value={value} // Use determined value
                                >
                                  {text} {/* Use determined text */}
                                  {/* Render option tooltip only if it exists (only for hardcoded) */}
                                  {tooltip && tooltip.trim() && (
                                     <TooltipProvider>
                                       <Tooltip>
                                         <TooltipTrigger asChild>
                                           <Info className="h-3 w-3 inline-block ml-1 text-muted-foreground" />
                                         </TooltipTrigger>
                                         <TooltipContent className="max-w-[300px] p-4">
                                           <p className="text-sm">{tooltip.trim()}</p>
                                         </TooltipContent>
                                       </Tooltip>
                                     </TooltipProvider>
                                   )}
                                </SelectItem>
                              );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );

                  // Render the Select component, wrapping in Tooltip if disabled
                  return (
                    <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <label htmlFor={question.id} className={`text-base font-medium leading-6 mb-2 block ${isDisabled ? 'text-muted-foreground' : ''}`}>
                        {questionText}
                        {/* Render question tooltip only if it exists */}
                        {question.tooltip && question.tooltip.trim() && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px] p-4">
                                <p className="text-sm">{question.tooltip.trim()}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </label>
                      {isDisabled ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* Render disabled select inside trigger */}
                              <div className="relative">
                                {selectContent}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] p-4">
                              <div className="space-y-3">
                                <p className="text-sm">
                                  This dropdown will be enabled when you select <span className="font-medium">{getRequiredValueText(question)}</span> in the question "{getParentQuestionText(question)}".
                                </p>
                                {/* Display options even when disabled */}
                                {options && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium mb-1">Available options:</p>
                                    <ul className="text-sm space-y-1">
                                      {options.slice()
                                        .sort((a, b) => {
                                          // Get display_order with fallback to ensure consistent sorting
                                          const orderA = isDBOption(a) ? (a.display_order ?? 999) :
                                                        (isHardcodedOption(a) ? (a.order ?? 999) : 999);
                                          const orderB = isDBOption(b) ? (b.display_order ?? 999) :
                                                        (isHardcodedOption(b) ? (b.order ?? 999) : 999);
                                          return orderA - orderB;
                                        })
                                        .map((option) => {
                                          const value = isDBOption(option) ? option.option_value : (isHardcodedOption(option) ? option.value : '');
                                          const text = isDBOption(option) ? option.option_text : (isHardcodedOption(option) ? option.label : '');
                                          const tooltip = isHardcodedOption(option) ? option.tooltip : undefined;
                                          return (
                                            <li key={value} className="text-muted-foreground">
                                              • {text}
                                              {tooltip && tooltip.trim() && (
                                                <TooltipProvider>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Info className="h-3 w-3 inline-block ml-1 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[300px] p-4">
                                                      <p className="text-sm">{tooltip.trim()}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              )}
                                            </li>
                                          );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        // Render enabled select directly
                        selectContent
                      )}
                    </div>
                  );
              } // End select type rendering

              // Fallback for unknown types
              return <div key={question.id}>Unsupported question type: {questionType} for question ID: {question.id}</div>;

            })
          ) : (
            <div className="py-4 text-center questionnaire-text">
              Loading questions or no questions found for this page...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireForm;
