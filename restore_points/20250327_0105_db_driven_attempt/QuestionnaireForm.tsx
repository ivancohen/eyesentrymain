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
// Remove QUESTIONNAIRE_PAGES import
// import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define accepted answer value types
type AnswerValue = string | number | boolean | null | undefined;

// Interface for DB Question data (ensure this matches service response)
// This will be used directly now
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
        tooltip?: string; // Assuming tooltip might exist on options too
    }>;
    display_order?: number;
    // Add conditional options structure if fetched from DB
    conditionalOptions?: {
        parentValue: string; // e.g., "parentQuestionId:requiredValue"
        // Options might be implicitly handled if parent controls visibility/options
    };
}

// Remove internal Constant interfaces
// interface ConstantQuestionOption { ... }
// interface ConstantConditionalOptions { ... }
// interface ConstantQuestion { ... }


interface QuestionnaireFormProps {
  answers: Record<string, AnswerValue>;
  currentPage: number; // Still needed for warnings, maybe refactor later
  onAnswerChange?: (questionId: string, value: AnswerValue) => void;
  setAnswers?: (answers: Record<string, AnswerValue>) => void;
  skipQuestions?: string[];
  // Prop type now expects DBQuestion array directly
  questions: DBQuestion[];
}

const QuestionnaireForm = ({
  answers,
  currentPage, // Keep for warnings for now
  onAnswerChange,
  setAnswers,
  skipQuestions = [],
  questions // This is now DBQuestion[] filtered by the container
}: QuestionnaireFormProps) => {

  // Use the received questions directly
  const questionsToRender = questions;

  console.log(`Page ${currentPage}, Rendering ${questionsToRender.length} questions from DB data.`);


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

  // Update conditional logic functions to use DBQuestion type
  const shouldShowConditionalQuestion = (question: DBQuestion) => {
    // This logic might need adjustment based on actual DB structure for conditionalOptions
    if (!question.conditionalOptions) return true;
    const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
    const parentAnswer = answers[parentId];
    const shouldShow = String(parentAnswer) === requiredValue;
    return shouldShow;
  };

  const isConditionalQuestionDisabled = (question: DBQuestion) => {
    if (!question.conditionalOptions) return false;
    const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
    const parentAnswer = answers[parentId];
    const isDisabled = String(parentAnswer) !== requiredValue;
    return isDisabled;
  };

  // Update warnings if needed (assuming IDs are stable)
  const showFamilyGlaucomaWarning = currentPage === 1 &&
    String(answers.familyGlaucoma) === "not_available";
  const showClinicalMeasurementsWarning = currentPage === 2 && (
    String(answers.iopBaseline) === "not_available" ||
    String(answers.verticalAsymmetry) === "not_available" ||
    String(answers.verticalRatio) === "not_available"
  );

  // Update helper functions to use DBQuestion type and properties
  const getParentQuestionText = (question: DBQuestion) => {
    if (!question.conditionalOptions) return '';
    const [parentId] = question.conditionalOptions.parentValue.split(':');
    // Find parent in the rendered list
    const parentQuestion = questionsToRender.find(q => q.id === parentId);
    return parentQuestion?.question || ''; // Use .question
  };

  const getRequiredValueText = (question: DBQuestion) => {
    if (!question.conditionalOptions) return '';
    const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
    const parentQuestion = questionsToRender.find(q => q.id === parentId);
    // Use option_value and option_text from DB options structure
    const option = parentQuestion?.options?.find(opt => opt.option_value === requiredValue);
    return option?.option_text || requiredValue; // Use .option_text
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
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
              // REMOVED: Don't skip rendering based on shouldShowConditionalQuestion
              // Rely on isDisabled flag below to control appearance/interaction
              // if (!shouldShowConditionalQuestion(question)) {
              //     // console.log(`--> Skipping ${question.id} because condition not met.`); // Removed log
              //     return null;
              // }

              const questionText = question.question; // Use .question from DBQuestion
              const questionType = question.question_type || 'select'; // Use .question_type from DBQuestion
              const isDisabled = isConditionalQuestionDisabled(question);

              // Render Input for 'text' type questions
              if (questionType === 'text') {
                return (
                  <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <label htmlFor={question.id} className="text-base font-medium leading-6 mb-2 block">
                      {questionText}
                      {question.tooltip && ( // Check tooltip from DBQuestion
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] p-4">
                              <p className="text-sm">{question.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </label>
                    <Input
                      id={question.id}
                      type="text"
                      name={question.id}
                      value={String(answers[question.id] || "")}
                      onChange={handleInputChange}
                      className="w-full input-animation"
                      disabled={isDisabled}
                    />
                  </div>
                );
              }

              // Render Select for 'select' or other dropdown types
              // Use options from DBQuestion structure
              const options = question.options; // Directly use options if available on DBQuestion
              // Conditional options might need specific handling based on DB structure
              // const options = isDisabled ? question.conditionalOptions?.options : question.options;

              const selectContent = (
                <Select
                  value={String(answers[question.id] || "")}
                  onValueChange={(value) => handleValueChange(question.id, value)}
                  disabled={isDisabled}
                >
                  <SelectTrigger id={question.id} className={`w-full input-animation ${isDisabled ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{questionText}</SelectLabel>
                      {options?.map((option) => ( // Use options from DBQuestion
                        <SelectItem
                          key={option.option_value} // Use option_value
                          value={option.option_value} // Use option_value
                          className={isDisabled ? 'opacity-70 cursor-not-allowed' : ''}
                        >
                          {option.option_text} {/* Use option_text */}
                          {option.tooltip && ( // Check option tooltip
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Info className="h-3 w-3 inline-block ml-1 text-muted-foreground" />
                                 </TooltipTrigger>
                                 <TooltipContent className="max-w-[300px] p-4">
                                   <p className="text-sm">{option.tooltip}</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           )}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              );

              // Render the Select component (conditionally wrapped in Tooltip if disabled)
              return (
                <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <label htmlFor={question.id} className={`text-base font-medium leading-6 mb-2 block ${isDisabled ? 'text-muted-foreground' : ''}`}>
                    {questionText}
                    {question.tooltip && ( // Check tooltip from DBQuestion
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] p-4">
                            <p className="text-sm">{question.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </label>
                  {isDisabled ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                                  {options.map((option) => ( // Use options from DBQuestion
                                    <li key={option.option_value} className="text-muted-foreground">
                                      • {option.option_text} {/* Use option_text */}
                                      {option.tooltip && ( // Check option tooltip
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Info className="h-3 w-3 inline-block ml-1 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[300px] p-4">
                                              <p className="text-sm">{option.tooltip}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    selectContent
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Loading questions or no questions found for this page...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireForm;