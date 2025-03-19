import { useState, useEffect } from "react";
import { DropdownOption, QuestionService } from "@/services/QuestionService";
import { DROPDOWN_OPTION_FIELDS } from "@/constants/questionConstants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataForm from "@/components/DataForm";
import { Plus, AlertCircle, Trash, Award } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface DropdownOptionsManagerProps {
  questionId: string;
  hasScore?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DropdownOptionsManager = ({ 
  questionId, 
  hasScore = true, 
  onSuccess, 
  onCancel 
}: DropdownOptionsManagerProps) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentOption, setCurrentOption] = useState<DropdownOption | null>(null);
  
  const getFormFields = () => DROPDOWN_OPTION_FIELDS;

  useEffect(() => {
    if (questionId) {
      loadDropdownOptions();
    }
  }, [questionId]);

  const loadDropdownOptions = async () => {
    setIsLoading(true);
    try {
      const options = await QuestionService.fetchDropdownOptions(questionId);
      setOptions(options);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    setCurrentOption(null);
    setShowForm(true);
  };

  const handleEditOption = (option: DropdownOption) => {
    setCurrentOption(option);
    setShowForm(true);
  };

  const handleDeleteOption = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this dropdown option?")) {
      setIsLoading(true);
      try {
        const success = await QuestionService.deleteDropdownOption(id);
        if (success) {
          toast.success("Dropdown option deleted successfully");
          loadDropdownOptions();
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    setIsLoading(true);
    try {
      const optionData: Partial<DropdownOption> = {
        ...formData,
        question_id: questionId,
        id: currentOption?.id,
      };

      const success = await QuestionService.saveDropdownOption(optionData);
      if (success) {
        toast.success(currentOption ? "Dropdown option updated" : "Dropdown option added");
        setShowForm(false);
        loadDropdownOptions();
        
        if (onSuccess && !showForm && options.length > 0) {
          onSuccess();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    if (onCancel && options.length === 0) {
      onCancel();
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dropdown Options with Scoring</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddOption} className="hover-lift">
            <Plus size={16} className="mr-2" />
            Add Dropdown Option
          </Button>
          {onSuccess && options.length > 0 && (
            <Button onClick={onSuccess} variant="outline">
              Done
            </Button>
          )}
          {onCancel && (
            <Button onClick={onCancel} variant="ghost" className="text-destructive">
              Cancel
            </Button>
          )}
        </div>
      </div>

      {showForm ? (
        <DataForm
          title={currentOption ? "Edit Dropdown Option" : "Add Dropdown Option"}
          fields={getFormFields()}
          initialData={currentOption || {}}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-4">
          {options.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No dropdown options have been added yet. Click "Add Dropdown Option" to create one.
              </AlertDescription>
            </Alert>
          ) : (
            options.map((option) => (
              <Card key={option.id} className="hover:bg-secondary/10 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between p-4">
                  <div>
                    <CardTitle className="text-md">
                      {option.option_text}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditOption(option)}
                      className="h-8 w-8 p-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOption(option.id)}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-muted-foreground mb-2">Value: {option.option_value}</p>
                  <div className="flex items-center gap-1">
                    <Award size={16} className="text-amber-500" />
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700">
                      Score: {option.score || 0} points
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownOptionsManager;
