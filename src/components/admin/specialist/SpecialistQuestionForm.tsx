import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SpecialistQuestionFormProps {
  currentItem?: any;
  onSuccess?: (data: any) => void; // Expect data to be passed back
  onCancel?: () => void;
}

const SpecialistQuestionForm = ({ 
  currentItem,
  onSuccess,
  onCancel
}: SpecialistQuestionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    question_type: "text",
    required: true,
    dropdown_options: [],
    conditional_parent_id: null, // Or ""
    conditional_required_value: "",
    conditional_display_mode: "hide" // Default to hide
  });
  const [newOption, setNewOption] = useState('');

  // Load current item data for editing
  useEffect(() => {
    if (currentItem) {
      setFormData({
        ...currentItem,
        dropdown_options: currentItem.dropdown_options || [],
        conditional_parent_id: currentItem.conditional_parent_id || null, // Or ""
        conditional_required_value: currentItem.conditional_required_value || "",
        conditional_display_mode: currentItem.conditional_display_mode || "hide"
      });
    }
  }, [currentItem]);

  const handleInputChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value,
      // Reset dropdown options if type is changed from select
      dropdown_options: key === 'question_type' && value !== 'select' ? [] : formData.dropdown_options
    });
  };

  const handleAddOption = () => {
    if (!newOption) {
      toast.error("Option text is required");
      return;
    }

    setFormData({
      ...formData,
      dropdown_options: [...(formData.dropdown_options || []), newOption]
    });
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = [...formData.dropdown_options];
    updatedOptions.splice(index, 1);
    setFormData({
      ...formData,
      dropdown_options: updatedOptions
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate
      if (!formData.question) {
        toast.error("Question text is required");
        return;
      }

      if (formData.question_type === 'select' && (!formData.dropdown_options || formData.dropdown_options.length < 2)) {
        toast.error('Please add at least two options for dropdown menu');
        return;
      }

      // Pass the form data back to the parent component for saving
      console.log("Submitting specialist question:", formData);
      
      if (onSuccess) {
        onSuccess(formData); // Pass form data back to parent component
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving specialist question:", error);
      toast.error("Failed to save question");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{currentItem ? "Edit Specialist Question" : "Add Specialist Question"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question Text</Label>
            <Textarea 
              id="question"
              value={formData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              placeholder="Enter the question text"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question_type">Question Type</Label>
            <Select 
              value={formData.question_type} 
              onValueChange={(value) => handleInputChange('question_type', value)}
            >
              <SelectTrigger id="question_type">
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Input</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="select">Dropdown Menu</SelectItem>
                <SelectItem value="radio">Radio Buttons</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="required" className="flex-grow">Required</Label>
            <Select 
              value={formData.required ? "true" : "false"} 
              onValueChange={(value) => handleInputChange('required', value === "true")}
            >
              <SelectTrigger id="required" className="w-[180px]">
                <SelectValue placeholder="Is this required?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Logic Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Conditional Logic (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              Show this question only if another question has a specific answer.
            </p>
            <div className="space-y-2">
              <Label htmlFor="conditional_parent_id">Parent Question ID</Label>
              <Input
                id="conditional_parent_id"
                value={formData.conditional_parent_id || ""}
                onChange={(e) => handleInputChange('conditional_parent_id', e.target.value || null)} // Store null if empty
                placeholder="Enter the UUID of the parent question"
              />
              {/* TODO: Replace with a Select populated with questions */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditional_required_value">Required Parent Answer</Label>
              <Input
                id="conditional_required_value"
                value={formData.conditional_required_value}
                onChange={(e) => handleInputChange('conditional_required_value', e.target.value)}
                placeholder="Enter the exact answer value from the parent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditional_display_mode">Display Mode</Label>
              <Select
                value={formData.conditional_display_mode}
                onValueChange={(value) => handleInputChange('conditional_display_mode', value)}
              >
                <SelectTrigger id="conditional_display_mode">
                  <SelectValue placeholder="Select display mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">Show when condition met</SelectItem>
                  <SelectItem value="hide">Hide when condition met</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.question_type === 'select' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Dropdown Options</h3>
              
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add an option"
                  className="flex-grow"
                />
                <Button type="button" onClick={handleAddOption} size="sm">
                  <Plus size={16} />
                </Button>
              </div>

              {formData.dropdown_options?.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {formData.dropdown_options.map((option: string, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between py-2 px-3 border rounded-md"
                    >
                      <span>{option}</span>
                      <Button
                        type="button" 
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-destructive h-8 w-8 p-0"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No options added yet. Add at least two options for the dropdown.
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {currentItem ? "Update Question" : "Create Question"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SpecialistQuestionForm;
