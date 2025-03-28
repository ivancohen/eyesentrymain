import { useState, useEffect } from "react";
import { Question, QuestionService, DropdownOption } from "@/services/QuestionService";
import { QUESTION_FORM_FIELDS, DROPDOWN_OPTION_FIELDS } from "@/constants/questionConstants";
import DataForm, { Field } from "@/components/DataForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, Award, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface QuestionFormManagerProps {
  currentItem: Question | null;
  onSuccess: () => void;
  onCancel: () => void;
  userId: string;
}

const QuestionFormManager = ({
  currentItem,
  onSuccess,
  onCancel,
  userId
}: QuestionFormManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questionType, setQuestionType] = useState(currentItem?.question_type || "text");
  const [dropdownOptions, setDropdownOptions] = useState<Partial<DropdownOption>[]>([]);
  const [newOptionText, setNewOptionText] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionScore, setNewOptionScore] = useState("0");
  const [formInitialData, setFormInitialData] = useState<Record<string, string | number>>({});

  // Update the form data when the question data is fetched
  useEffect(() => {
    if (currentItem) {
      console.log("Setting form initial data from currentItem:", currentItem);
      const initialData = Object.entries(currentItem).reduce((acc, [key, value]) => {
        // Convert boolean values to strings
        if (typeof value === 'boolean') {
          acc[key] = value ? 'true' : 'false';
        } else if (value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number>);

      setFormInitialData(initialData);
    }
  }, [currentItem]);

  // Fetch full question data when editing
  useEffect(() => {
    if (currentItem && currentItem.id) {
      // If we only have the ID, fetch the full question data
      if (Object.keys(currentItem).length === 1) {
        fetchQuestionData(currentItem.id);
      } else {
        // If we already have the full question data
        if (currentItem.question_type) {
          setQuestionType(currentItem.question_type);
        }

        // If it's a dropdown question, load the dropdown options
        if (currentItem.question_type === "dropdown") {
          console.log("Loading dropdown options for question:", currentItem.id);
          loadDropdownOptions(currentItem.id);
        }
      }
    }
  }, [currentItem]);

  // Debug log for dropdown options
  useEffect(() => {
    console.log("Current dropdown options:", dropdownOptions);
  }, [dropdownOptions]);

  // Fetch the full question data
  const fetchQuestionData = async (questionId: string) => {
    try {
      console.log("Fetching question data for ID:", questionId);
      const questions = await QuestionService.fetchQuestions();
      const question = questions.find(q => q.id === questionId);

      if (question) {
        console.log("Found question data:", question);
        // Update the currentItem with the full question data
        // We need to use a workaround since we can't directly modify the currentItem prop
        if (question.question_type) {
          setQuestionType(question.question_type);
        }

        // Update the form initial data
        const initialData = Object.entries(question).reduce((acc, [key, value]) => {
          // Convert boolean values to strings
          if (typeof value === 'boolean') {
            acc[key] = value ? 'true' : 'false';
          } else if (value !== null && value !== undefined) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string | number>);

        setFormInitialData(initialData);

        // If it's a dropdown question, load the dropdown options
        if (question.question_type === "dropdown") {
          loadDropdownOptions(questionId);
        }
      } else {
        console.error("Question not found with ID:", questionId);
        toast.error("Question not found");
      }
    } catch (error) {
      console.error("Error fetching question data:", error);
      toast.error("Failed to load question data");
    }
  };

  // Load dropdown options from the database
  const loadDropdownOptions = async (questionId: string) => {
    try {
      console.log("Fetching dropdown options for question ID:", questionId);
      const options = await QuestionService.fetchDropdownOptions(questionId);
      console.log("Fetched dropdown options:", options);

      if (options && Array.isArray(options)) {
        setDropdownOptions(options);
      } else {
        console.error("Invalid dropdown options format:", options);
        setDropdownOptions([]);
      }
    } catch (error) {
      console.error("Error loading dropdown options:", error);
      toast.error("Failed to load dropdown options");
      setDropdownOptions([]);
    }
  };

  // Add a new dropdown option to the local state
  const handleAddOption = () => {
    if (!newOptionText || !newOptionValue) {
      toast.error("Option text and value are required");
      return;
    }

    const newOption: Partial<DropdownOption> = {
      option_text: newOptionText,
      option_value: newOptionValue,
      score: parseInt(newOptionScore)
    };

    setDropdownOptions([...dropdownOptions, newOption]);
    setNewOptionText("");
    setNewOptionValue("");
    setNewOptionScore("0");
  };

  // Remove a dropdown option from the local state
  const handleRemoveOption = (index: number) => {
    const updatedOptions = [...dropdownOptions];
    updatedOptions.splice(index, 1);
    setDropdownOptions(updatedOptions);
  };

  // Handle drag end event for reordering dropdown options
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(dropdownOptions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display order for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    
    setDropdownOptions(updatedItems);
  };

  // Handle form submission
  const handleFormSubmit = async (formData: Record<string, string | number>) => {
    setIsLoading(true);
    try {
      // Validate dropdown options if question type is dropdown
      if (questionType === "dropdown" && dropdownOptions.length === 0) {
        toast.error("Dropdown questions must have at least one option");
        setIsLoading(false);
        return;
      }

      // Format the data for the Supabase query
      const questionData = {
        ...formData,
        id: currentItem?.id,
        question_type: questionType,
        has_dropdown_options: questionType === "dropdown"
      };

      console.log("Saving question data:", questionData);

      // Use createQuestion or updateQuestion based on whether we have an ID
      const result = questionData.id
        ? await QuestionService.updateQuestion(questionData.id, questionData)
        : await QuestionService.createQuestion(questionData);

      // Check if the result is truthy
      if (result) {
        // Get the question ID from the result or from the input data
        const questionId = questionData.id || (typeof result === 'object' && result.id);
        
        if (questionType === "dropdown" && questionId) {
          // If editing an existing question with dropdown options
          if (currentItem?.id) {
            // First fetch existing dropdown options to compare
            const existingOptions = await QuestionService.fetchDropdownOptions(currentItem.id);
            console.log("Existing dropdown options:", existingOptions);

            // Find options to delete (options that exist in the database but not in the current state)
            const optionsToDelete = existingOptions.filter(existingOption =>
              !dropdownOptions.some(currentOption =>
                currentOption.id === existingOption.id
              )
            );

            // Delete options that are no longer needed
            for (const option of optionsToDelete) {
              await QuestionService.deleteDropdownOption(option.id);
            }
          }

          // Save all current dropdown options
          let allOptionsSuccess = true;

          for (const option of dropdownOptions) {
            const optionData: Partial<DropdownOption> = {
              ...option,
              question_id: questionId
            };

            // Use createDropdownOption or updateDropdownOption based on whether we have an ID
            const success = option.id
              ? await QuestionService.updateDropdownOption(option.id, optionData)
              : await QuestionService.createDropdownOption(optionData);
            if (!success) {
              allOptionsSuccess = false;
            }
          }

          if (allOptionsSuccess) {
            toast.success("Question and dropdown options saved successfully");
            onSuccess();
          } else {
            toast.error("Some dropdown options could not be saved");
          }
        } else {
          // If changing from dropdown to another type, delete all dropdown options
          if (currentItem?.id && currentItem.question_type === "dropdown") {
            const existingOptions = await QuestionService.fetchDropdownOptions(currentItem.id);
            for (const option of existingOptions) {
              await QuestionService.deleteDropdownOption(option.id);
            }
          }

          toast.success("Question saved successfully");
          onSuccess();
        }
      } else {
        toast.error("Failed to save question. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error saving question:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error saving question: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle question type change
  const handleQuestionTypeChange = (key: string, value: string | number) => {
    if (key === "question_type") {
      setQuestionType(String(value));
      console.log("Question type changed to:", value);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <DataForm
        title={currentItem ? "Edit Question" : "Add New Question"}
        fields={QUESTION_FORM_FIELDS}
        initialData={formInitialData}
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
        onChange={handleQuestionTypeChange}
      />

      {/* Render dropdown options section separately */}
      {questionType === 'dropdown' && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Dropdown Menu Items</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add menu items and their scores for this dropdown question.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="option-value">Menu Item</Label>
              <Input
                id="option-value"
                value={newOptionValue}
                onChange={(e) => {
                  setNewOptionValue(e.target.value);
                  setNewOptionText(e.target.value); // Set the same value for both text and value
                }}
                placeholder="Dropdown menu item"
                className="mt-1"
              />
            </div>
            <div className="w-32">
              <Label htmlFor="option-score">Score</Label>
              <Select value={newOptionScore} onValueChange={setNewOptionScore}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 2, 4, 6, 8, 10].map((score) => (
                    <SelectItem key={score} value={score.toString()}>
                      {score}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6">
              <Button onClick={handleAddOption} size="sm">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* List of added options with drag and drop */}
          {dropdownOptions.length > 0 ? (
            <div className="space-y-2 mt-4">
              <div className="text-sm font-medium flex justify-between">
                <span>Menu Items:</span>
                <span>Score</span>
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="dropdown-options">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {dropdownOptions.map((option, index) => (
                        <Draggable key={index.toString()} draggableId={index.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center justify-between py-1 border-b"
                            >
                              <div className="flex items-center">
                                <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="font-medium">{option.option_value}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700">
                                  {option.score}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(index)}
                                  className="text-destructive h-6 w-6 p-0"
                                >
                                  <Trash size={14} />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-4">
              Add at least one menu item for this dropdown question.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionFormManager;
