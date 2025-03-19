
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
import { AlertTriangle } from "lucide-react";
import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";

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

  // Determine which warning to show based on current page and answers
  const showFamilyGlaucomaWarning = currentPage === 1 && 
    String(answers.familyGlaucoma) === "not_available";
  const showClinicalMeasurementsWarning = currentPage === 2 && (
    String(answers.iopBaseline) === "not_available" || 
    String(answers.verticalAsymmetry) === "not_available" || 
    String(answers.verticalRatio) === "not_available"
  );

  return (
    <Card className="animate-fade-in">
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
              
              // Skip conditional questions if their condition isn't met
              if (!shouldShowConditionalQuestion(question)) return null;
              
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
              return (
                <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <label className="text-base font-medium leading-6 mb-2 block">
                    {question.text}
                  </label>
                  <Select
                    value={String(answers[question.id] || "")}
                    onValueChange={(value) => handleValueChange(question.id, value)}
                  >
                    <SelectTrigger className="w-full input-animation">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{question.text}</SelectLabel>
                        {question.options && question.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
