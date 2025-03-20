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
import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define accepted answer value types
type AnswerValue = string | number | boolean | null;

interface QuestionnaireFormProps {
  answers: Record<string, AnswerValue>;
  currentPage: number;
  onAnswerChange?: (questionId: string, value: AnswerValue) => void;
  setAnswers?: (answers: Record<string, AnswerValue>) => void;
  skipQuestions?: string[]; // New prop to allow skipping certain questions
}

const QuestionnaireForm = ({
  answers,
  currentPage,
  onAnswerChange,
  setAnswers,
  skipQuestions = [], // Default to empty array if not provided
}: QuestionnaireFormProps) => {
  // Get questions for current page, make sure it's defined with an empty array fallback
  const currentQuestions = QUESTIONNAIRE_PAGES[currentPage] || [];
  
  // Handle answer changes based on which prop was provided
  const handleValueChange = (questionId: string, value: AnswerValue) => {
    if (onAnswerChange) {
      onAnswerChange(questionId, value);
    } else if (setAnswers) {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  // Handle input change for text fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleValueChange(name, value);
  };

  // Check if a conditional question should be shown
  const shouldShowConditionalQuestion = (question: typeof currentQuestions[0]) => {
    if (!question.conditionalOptions) return true;
    
    const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
    return String(answers[parentId]) === requiredValue;
  };

  // Check if a conditional question is disabled
  const isConditionalQuestionDisabled = (question: typeof currentQuestions[0]) => {
    if (!question.conditionalOptions) return false;
    
    const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
    return String(answers[parentId]) !== requiredValue;
  };

  // Determine which warning to show based on current page and answers
  const showFamilyGlaucomaWarning = currentPage === 1 && 
    String(answers.familyGlaucoma) === "not_available";
  const showClinicalMeasurementsWarning = currentPage === 2 && (
    String(answers.iopBaseline) === "not_available" || 
    String(answers.verticalAsymmetry) === "not_available" || 
    String(answers.verticalRatio) === "not_available"
  );

  // Get the parent question text for conditional questions
  const getParentQuestionText = (question: typeof currentQuestions[0]) => {
    if (!question.conditionalOptions) return '';
    
    const [parentId] = question.conditionalOptions.parentValue.split(':');
    const parentQuestion = currentQuestions.find(q => q.id === parentId);
    return parentQuestion?.text || '';
  };

  // Get the required value text for conditional questions
  const getRequiredValueText = (question: typeof currentQuestions[0]) => {
    if (!question.conditionalOptions) return '';
    
    const [, requiredValue] = question.conditionalOptions.parentValue.split(':');
    const parentQuestion = currentQuestions.find(q => 
      q.id === question.conditionalOptions?.parentValue.split(':')[0]
    );
    const option = parentQuestion?.options?.find(opt => opt.value === requiredValue);
    return option?.label || requiredValue;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        {showFamilyGlaucomaWarning && (
          <Alert className="mb-6" variant="default">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 bg-amber-50">
              Please note that failing to enter this information may lead to a significantly reduced risk score, 
              which does not accurately reflect the actual risk. For the most accurate assessment, please ensure 
              all relevant fields are completed.
            </AlertDescription>
          </Alert>
        )}
        
        {showClinicalMeasurementsWarning && (
          <Alert className="mb-6" variant="default">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 bg-amber-50">
              Please note that failing to enter this information may lead to a significantly reduced risk score, 
              which does not accurately reflect the actual risk. For the most accurate assessment, please ensure 
              all relevant fields are completed.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-5">
          {currentQuestions && currentQuestions.length > 0 ? (
            currentQuestions.map((question, index) => {
              // Skip questions that are in the skipQuestions array
              if (skipQuestions.includes(question.id)) return null;
              
              // Special handling for firstName and lastName to use text inputs
              if (question.id === "firstName" || question.id === "lastName") {
                return (
                  <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <label className="text-base font-medium leading-6 mb-2 block">
                      {question.text}
                    </label>
                    <Input
                      type="text"
                      name={question.id}
                      value={String(answers[question.id] || "")}
                      onChange={handleInputChange}
                      className="w-full input-animation"
                    />
                  </div>
                );
              }
              
              // Default rendering for select/dropdown fields
              const isDisabled = isConditionalQuestionDisabled(question);
              const selectContent = (
                <Select
                  value={String(answers[question.id] || "")}
                  onValueChange={(value) => handleValueChange(question.id, value)}
                  disabled={isDisabled}
                >
                  <SelectTrigger className={`w-full input-animation ${isDisabled ? 'opacity-70 cursor-not-allowed bg-muted' : ''}`}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{question.text}</SelectLabel>
                      {(isDisabled ? question.conditionalOptions?.options : question.options)?.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className={isDisabled ? 'opacity-70 cursor-not-allowed' : ''}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              );

              return (
                <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <label className={`text-base font-medium leading-6 mb-2 block ${isDisabled ? 'text-muted-foreground' : ''}`}>
                    {question.text}
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
                            {question.conditionalOptions?.options && (
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-1">Available options:</p>
                                <ul className="text-sm space-y-1">
                                  {question.conditionalOptions.options.map((option) => (
                                    <li key={option.value} className="text-muted-foreground">
                                      • {option.label}
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
              Loading questions...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireForm;
