# Admin Interface Updates

Below are the key updates needed for the admin interface to support the new features.

## Enhanced SpecialistQuestionForm

Create a file named `src/components/admin/specialist/EnhancedQuestionForm.tsx` with the following content:

```tsx
import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Checkbox, FormControl, FormLabel, Textarea, Box, VStack, HStack, IconButton, Text, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from '@chakra-ui/react';
import { DragHandleIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { QuestionService } from '@/services/QuestionService.enhanced';

interface DropdownOption {
  id?: string;
  question_id?: string;
  option_text: string;
  option_value: string;
  score: number;
  display_order?: number;
}

interface QuestionFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const EnhancedQuestionForm: React.FC<QuestionFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    question: '',
    tooltip: '',
    status: 'Active',
    page_category: 'patient_info',
    question_type: 'text',
    display_order: 0,
    conditional_parent_id: '',
    conditional_required_value: '',
    conditional_display_mode: 'hide',
    risk_score: 0
  });
  
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
  const [availableParentQuestions, setAvailableParentQuestions] = useState<any[]>([]);
  const [availableParentValues, setAvailableParentValues] = useState<DropdownOption[]>([]);
  const [isConditional, setIsConditional] = useState(false);
  
  // Load initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        question: initialData.question || '',
        tooltip: initialData.tooltip || '',
        status: initialData.status || 'Active',
        page_category: initialData.page_category || 'patient_info',
        question_type: initialData.question_type || 'text',
        display_order: initialData.display_order || 0,
        conditional_parent_id: initialData.conditional_parent_id || '',
        conditional_required_value: initialData.conditional_required_value || '',
        conditional_display_mode: initialData.conditional_display_mode || 'hide',
        risk_score: initialData.risk_score || 0
      });
      
      setIsConditional(!!initialData.conditional_parent_id);
      
      // Load dropdown options if this is a dropdown/select question
      if (initialData.id && (initialData.question_type === 'dropdown' || initialData.question_type === 'select')) {
        loadDropdownOptions(initialData.id);
      }
    }
    
    // Load available parent questions for conditional logic
    loadAvailableParentQuestions();
  }, [initialData]);
  
  // Load dropdown options for a question
  const loadDropdownOptions = async (questionId: string) => {
    try {
      const options = await QuestionService.fetchDropdownOptions(questionId);
      setDropdownOptions(options);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
    }
  };
  
  // Load available parent questions for conditional logic
  const loadAvailableParentQuestions = async () => {
    try {
      const questions = await QuestionService.fetchQuestions();
      // Filter out the current question and non-dropdown/select questions
      const availableQuestions = questions.filter(q => 
        q.id !== formData.id && 
        (q.question_type === 'dropdown' || q.question_type === 'select')
      );
      setAvailableParentQuestions(availableQuestions);
    } catch (error) {
      console.error('Error loading available parent questions:', error);
    }
  };
  
  // Load available values for the selected parent question
  useEffect(() => {
    if (formData.conditional_parent_id) {
      loadParentQuestionValues(formData.conditional_parent_id);
    } else {
      setAvailableParentValues([]);
    }
  }, [formData.conditional_parent_id]);
  
  // Load values for a parent question
  const loadParentQuestionValues = async (parentId: string) => {
    try {
      const options = await QuestionService.fetchDropdownOptions(parentId);
      setAvailableParentValues(options);
    } catch (error) {
      console.error('Error loading parent question values:', error);
    }
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle number input changes
  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Add a new dropdown option
  const addDropdownOption = () => {
    setDropdownOptions(prev => [
      ...prev,
      { option_text: '', option_value: '', score: 0 }
    ]);
  };
  
  // Update a dropdown option
  const updateDropdownOption = (index: number, field: keyof DropdownOption, value: string | number) => {
    const newOptions = [...dropdownOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setDropdownOptions(newOptions);
  };
  
  // Remove a dropdown option
  const removeDropdownOption = (index: number) => {
    setDropdownOptions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle drag and drop reordering of dropdown options
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(dropdownOptions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display_order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    
    setDropdownOptions(updatedItems);
  };
  
  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare data for submission
      const submissionData = { ...formData };
      if (!isConditional) {
        submissionData.conditional_parent_id = '';
        submissionData.conditional_required_value = '';
        submissionData.conditional_display_mode = 'hide';
      }
      
      // Save the question
      let savedQuestion;
      if (submissionData.id) {
        // Update existing question
        savedQuestion = await QuestionService.updateQuestion(submissionData.id, submissionData);
      } else {
        // Create new question
        savedQuestion = await QuestionService.createQuestion(submissionData);
      }
      
      // Save dropdown options if this is a dropdown/select question
      if (formData.question_type === 'dropdown' || formData.question_type === 'select') {
        // Process each option
        for (const [index, option] of dropdownOptions.entries()) {
          const optionData = {
            ...option,
            question_id: savedQuestion.id,
            display_order: index + 1 // Ensure display_order is set
          };
          
          if (option.id) {
            // Update existing option
            await QuestionService.updateDropdownOption(option.id, optionData);
          } else {
            // Create new option
            await QuestionService.createDropdownOption(optionData);
          }
        }
        
        // Delete removed options
        if (formData.id) {
          const existingOptions = await QuestionService.fetchDropdownOptions(formData.id);
          const optionIdsToKeep = dropdownOptions.map(opt => opt.id).filter(Boolean);
          
          for (const existingOption of existingOptions) {
            if (existingOption.id && !optionIdsToKeep.includes(existingOption.id)) {
              await QuestionService.deleteDropdownOption(existingOption.id);
            }
          }
        }
      }
      
      onSubmit(savedQuestion);
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Question</FormLabel>
          <Input 
            name="question" 
            value={formData.question} 
            onChange={handleChange} 
            placeholder="Enter question text"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Tooltip</FormLabel>
          <Textarea 
            name="tooltip" 
            value={formData.tooltip} 
            onChange={handleChange} 
            placeholder="Enter tooltip text (optional)"
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select name="page_category" value={formData.page_category} onChange={handleChange}>
            <option value="patient_info">Patient Info</option>
            <option value="family_medication">Family & Medication</option>
            <option value="clinical_measurements">Clinical Measurements</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Question Type</FormLabel>
          <Select name="question_type" value={formData.question_type} onChange={handleChange}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="dropdown">Dropdown</option>
            <option value="select">Select</option>
            <option value="checkbox">Checkbox</option>
            <option value="radio">Radio</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select name="status" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </FormControl>
        
        {/* Conditional Logic Configuration */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Conditional Logic?</FormLabel>
            <Checkbox
              isChecked={isConditional}
              onChange={(e) => setIsConditional(e.target.checked)}
            />
          </FormControl>
          
          {isConditional && (
            <VStack spacing={4} align="stretch" mt={4}>
              <FormControl>
                <FormLabel>Parent Question</FormLabel>
                <Select 
                  name="conditional_parent_id" 
                  value={formData.conditional_parent_id} 
                  onChange={handleChange}
                  placeholder="Select parent question"
                >
                  {availableParentQuestions.map(q => (
                    <option key={q.id} value={q.id}>{q.question}</option>
                  ))}
                </Select>
              </FormControl>
              
              {formData.conditional_parent_id && (
                <FormControl>
                  <FormLabel>Required Value</FormLabel>
                  <Select
                    name="conditional_required_value"
                    value={formData.conditional_required_value}
                    onChange={handleChange}
                    placeholder="Select required value"
                  >
                    {availableParentValues.map(val => (
                      <option key={val.option_value} value={val.option_value}>{val.option_text}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              <FormControl>
                <FormLabel>Display Mode</FormLabel>
                <Select
                  name="conditional_display_mode"
                  value={formData.conditional_display_mode}
                  onChange={handleChange}
                >
                  <option value="hide">Hide until condition is met</option>
                  <option value="disable">Show but disable until condition is met</option>
                </Select>
              </FormControl>
            </VStack>
          )}
        </Box>
        
        {/* Dropdown Options Editor */}
        {(formData.question_type === 'dropdown' || formData.question_type === 'select') && (
          <Box p={4} borderWidth={1} borderRadius="md">
            <Text fontWeight="bold" mb={2}>Dropdown Options</Text>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="dropdownOptions">
                {(provided) => (
                  <VStack {...provided.droppableProps} ref={provided.innerRef} align="stretch">
                    {dropdownOptions.map((option, index) => (
                      <Draggable key={option.id || `new-${index}`} draggableId={option.id || `new-${index}`} index={index}>
                        {(provided) => (
                          <HStack 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            spacing={4} 
                            align="center"
                            p={2} 
                            borderWidth={1} 
                            borderRadius="md"
                          >
                            <Box {...provided.dragHandleProps}>
                              <DragHandleIcon />
                            </Box>
                            <FormControl>
                              <FormLabel>Text</FormLabel>
                              <Input
                                value={option.option_text}
                                onChange={(e) => updateDropdownOption(index, 'option_text', e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel>Value</FormLabel>
                              <Input
                                value={option.option_value}
                                onChange={(e) => updateDropdownOption(index, 'option_value', e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel>Score</FormLabel>
                              <NumberInput
                                min={0}
                                value={option.score || 0}
                                onChange={(value) => updateDropdownOption(index, 'score', parseInt(value) || 0)}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>
                            <IconButton
                              aria-label="Remove option"
                              icon={<DeleteIcon />}
                              onClick={() => removeDropdownOption(index)}
                            />
                          </HStack>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </DragDropContext>
            <Button leftIcon={<AddIcon />} mt={4} onClick={addDropdownOption}>
              Add Option
            </Button>
          </Box>
        )}
        
        {/* Risk Score for non-dropdown questions */}
        {formData.question_type !== 'dropdown' && formData.question_type !== 'select' && (
          <FormControl>
            <FormLabel>Risk Score (for 'yes' or positive answers)</FormLabel>
            <NumberInput
              min={0}
              value={formData.risk_score || 0}
              onChange={(value) => handleNumberChange('risk_score', parseInt(value) || 0)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        )}
        
        <HStack justify="flex-end" mt={4}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" colorScheme="blue">Save Question</Button>
        </HStack>
      </VStack>
    </Box>
  );
};
```

## Enhanced SpecialistQuestionManager

Update the `SpecialistQuestionManager` component to:
1. Use the `EnhancedQuestionForm` component
2. Implement drag-and-drop reordering for questions within each category
3. Call the `QuestionService.updateQuestionOrder` method when questions are reordered

## How to Use

1. Replace the existing `SpecialistQuestionForm` component with the `EnhancedQuestionForm` component
2. Update the `SpecialistQuestionManager` component to use the enhanced form and implement reordering
3. Ensure the `QuestionService.enhanced.ts` file is used for all service calls

These updates will provide the necessary admin interface functionality to support:
- Reordering of questions and dropdown options
- Configuration of conditional logic
- Setting risk scores for all question types

After updating the admin interface, you can proceed with updating the frontend questionnaire components.